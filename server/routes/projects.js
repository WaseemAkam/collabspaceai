const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const protect = require('../middleware/authMiddleware');

// Helper: get role of requesting user in a project
function getUserRole(project, userId) {
  const m = project.members.find(m => m.user._id.toString() === userId.toString() || m.user.toString() === userId.toString());
  return m ? m.role : null;
}

// GET all projects for current user
router.get('/', protect, async (req, res) => {
  try {
    const projects = await Project.find({ 'members.user': req.user.id })
      .populate('members.user', 'name email');

    // Attach current user's role to each project
    const result = projects.map(p => {
      const obj = p.toObject();
      obj.myRole = getUserRole(p, req.user.id);
      // Flatten members for frontend compatibility
      obj.members = obj.members.map(m => ({ ...m.user, role: m.role }));
      return obj;
    });

    res.json(result);
  } catch (err) {
    console.error('GET PROJECTS ERROR:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// POST create project — creator becomes leader
router.post('/', protect, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Project name is required' });

    const project = await Project.create({
      name, description,
      createdBy: req.user.id,
      members: [{ user: req.user.id, role: 'leader' }]
    });

    const populated = await Project.findById(project._id).populate('members.user', 'name email');
    const obj = populated.toObject();
    obj.myRole = 'leader';
    obj.members = obj.members.map(m => ({ ...m.user, role: m.role }));
    res.json(obj);
  } catch (err) {
    console.error('CREATE PROJECT ERROR:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// POST add member — only leaders can add members; new members get role 'member'
router.post('/:id/add-member', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const role = getUserRole(project, req.user.id);
    if (role !== 'leader') return res.status(403).json({ message: 'Only the team leader can add members' });

    const User = require('../models/User');
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ message: 'No user found with that email' });

    // Check if already a member
    const alreadyMember = project.members.some(m => m.user.toString() === user._id.toString());
    if (alreadyMember) return res.status(400).json({ message: 'User is already a member' });

    project.members.push({ user: user._id, role: 'member' });
    await project.save();

    const populated = await Project.findById(project._id).populate('members.user', 'name email');
    const obj = populated.toObject();
    obj.myRole = getUserRole(populated, req.user.id);
    obj.members = obj.members.map(m => ({ ...m.user, role: m.role }));
    res.json(obj);
  } catch (err) {
    console.error('ADD MEMBER ERROR:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// DELETE project — only leaders can delete
router.delete('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const role = getUserRole(project, req.user.id);
    if (role !== 'leader') return res.status(403).json({ message: 'Only the team leader can delete this project' });

    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;