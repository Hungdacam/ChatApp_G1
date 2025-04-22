const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  chatId: { type: String, required: true, unique: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }],
  isGroupChat: { type: Boolean, default: false },
  groupName: { type: String },
  admins:[{type: mongoose.Schema.Types.ObjectId, ref:"user"}],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  avatar: { type: String, default: "https://via.placeholder.com/50" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Chat', chatSchema);