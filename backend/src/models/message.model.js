const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  messageId: { type: String, required: true, unique: true },
  chatId: { type: String, required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Message', messageSchema);