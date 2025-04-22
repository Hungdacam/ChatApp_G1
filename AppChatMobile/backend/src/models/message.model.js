const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  messageId: { type: String, required: true, unique: true },
  chatId: { type: String, required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  content: { type: String, required: true },
  video: { type: String, default: "" },
  image: { type: String, default: "" },
  fileUrl: { type: String, required: false },
  fileName: { type: String, required: false },
  isDelivered: { type: Boolean, default: false },
  isRead: { type: Boolean, default: false },
  isRecalled: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Message', messageSchema);