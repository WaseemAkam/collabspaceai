const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  project:  { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: { type: String },
  action:   { type: String, required: true },
  target:   { type: String },
  type:     { type: String, enum: ['task', 'project', 'member', 'ai', 'chat'], default: 'task' },
}, { timestamps: true });

module.exports = mongoose.model('Activity', activitySchema);