const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['leader', 'member'], default: 'member' },
}, { _id: false });

const projectSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  description: { type: String },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members:     [memberSchema],
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);