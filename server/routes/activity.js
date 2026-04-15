const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const protect = require('../middleware/authMiddleware');

router.get('/:projectId', protect, async (req, res) => {
  try {
    const activities = await Activity.find({ project: req.params.projectId })
      .sort({ createdAt: -1 })
      .limit(30);
    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const { project, action, target, type } = req.body;
    const activity = await Activity.create({
      project, action, target, type,
      user: req.user.id,
      userName: req.user.name,
    });
    res.json(activity);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;