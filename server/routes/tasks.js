const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const protect = require('../middleware/authMiddleware');

router.get('/:projectId', protect, async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.params.projectId })
      .populate('assignedTo', 'name email');
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const { title, description, priority, deadline, project, assignedTo } = req.body;
    if (!title)   return res.status(400).json({ message: 'Title is required' });
    if (!project) return res.status(400).json({ message: 'Project ID is required' });

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
    res.json(populated);
  } catch (err) {
    console.error('CREATE TASK ERROR:', err.message);
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('assignedTo', 'name email');

    if (req.body.status) {
      await Activity.create({
        project: task.project, action: `moved task to ${req.body.status}`,
        target: task.title, type: 'task',
        user: req.user.id, userName: req.user.name
      });
    }
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/bulk', protect, async (req, res) => {
  try {
    const { tasks, projectId } = req.body;
    const created = await Task.insertMany(
      tasks.map(t => ({ ...t, project: projectId, createdBy: req.user.id }))
    );
    await Activity.create({
      project: projectId,
      action: `AI generated ${tasks.length} tasks`,
      target: 'AI Task Generator', type: 'ai',
      user: req.user.id, userName: req.user.name
    });
    res.json(created);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    await Task.findByIdAndDelete(req.params.id);
    if (task) {
      await Activity.create({
        project: task.project, action: 'deleted task',
        target: task.title, type: 'task',
        user: req.user.id, userName: req.user.name
      });
    }
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;