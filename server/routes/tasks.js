const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Project = require('../models/Project');
const Activity = require('../models/Activity');
const protect = require('../middleware/authMiddleware');

// Helper: get role of user in a project
async function getRole(projectId, userId) {
  const project = await Project.findById(projectId);
  if (!project) return null;
  const m = project.members.find(m => m.user.toString() === userId.toString());
  return m ? m.role : null;
}
// GET tasks for a project
router.get('/:projectId', protect, async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.params.projectId })
      .populate('assignedTo', 'name email');
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create task — leaders only
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, priority, deadline, project, assignedTo } = req.body;
    if (!title)   return res.status(400).json({ message: 'Title is required' });
    if (!project) return res.status(400).json({ message: 'Project ID is required' });

    const role = await getRole(project, req.user.id);
    if (role !== 'leader') return res.status(403).json({ message: 'Only the team leader can create tasks' });

    const task = await Task.create({
      title, description, priority, deadline, project,
      assignedTo: assignedTo || null,
      createdBy: req.user.id
    });

    await Activity.create({
      project, action: 'created task', target: title,
      type: 'task', user: req.user.id, userName: req.user.name
    });

    const populated = await Task.findById(task._id).populate('assignedTo', 'name email');
    
    // Broadcast via socket
    const io = req.app.get('io');
    if (io) io.to(project.toString()).emit('taskCreated', populated);
    
    res.json(populated);
  } catch (err) {
    console.error('CREATE TASK ERROR:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// PUT update task
// - Members can only update status (moving cards)
// - Leaders can update everything (deadline, assignedTo, priority, title, etc.)
router.put('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const role = await getRole(task.project, req.user.id);
    if (!role) return res.status(403).json({ message: 'Not a project member' });

    // Members can only change status AND must be assigned to the task
    if (role === 'member') {
      const isAssigned = task.assignedTo && task.assignedTo.toString() === req.user.id.toString();
      if (!isAssigned) return res.status(403).json({ message: 'Members can only update tasks assigned to them' });

      const allowed = { status: req.body.status };
      if (!req.body.status) return res.status(403).json({ message: 'Members can only update task status' });
      const updated = await Task.findByIdAndUpdate(req.params.id, allowed, { new: true })
        .populate('assignedTo', 'name email');
      await Activity.create({
        project: task.project, action: `moved task to ${req.body.status}`,
        target: task.title, type: 'task',
        user: req.user.id, userName: req.user.name
      });
      const io = req.app.get('io');
      if (io) io.to(task.project.toString()).emit('taskUpdated', updated);
      return res.json(updated);
    }

    // Leaders can update anything
    const updated = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('assignedTo', 'name email');
    if (req.body.status) {
      await Activity.create({
        project: task.project, action: `moved task to ${req.body.status}`,
        target: task.title, type: 'task',
        user: req.user.id, userName: req.user.name
      });
    }
    const io = req.app.get('io');
    if (io) io.to(task.project.toString()).emit('taskUpdated', updated);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST bulk create tasks (AI) — leaders only
router.post('/bulk', protect, async (req, res) => {
  try {
    const { tasks, projectId } = req.body;

    const role = await getRole(projectId, req.user.id);
    if (role !== 'leader') return res.status(403).json({ message: 'Only the team leader can generate tasks' });

    const created = await Task.insertMany(
      tasks.map(t => ({ ...t, project: projectId, createdBy: req.user.id }))
    );
    await Activity.create({
      project: projectId,
      action: `AI generated ${tasks.length} tasks`,
      target: 'AI Task Generator', type: 'ai',
      user: req.user.id, userName: req.user.name
    });

    const io = req.app.get('io');
    if (io) io.to(projectId.toString()).emit('tasksBulkCreated', created);

    res.json(created);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE task — leaders only
router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const role = await getRole(task.project, req.user.id);
    if (role !== 'leader') return res.status(403).json({ message: 'Only the team leader can delete tasks' });

    await Task.findByIdAndDelete(req.params.id);
    await Activity.create({
      project: task.project, action: 'deleted task',
      target: task.title, type: 'task',
      user: req.user.id, userName: req.user.name
    });
    const io = req.app.get('io');
    if (io) io.to(task.project.toString()).emit('taskDeleted', req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;