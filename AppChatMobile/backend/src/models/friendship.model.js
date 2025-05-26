const mongoose = require('mongoose');

const friendshipSchema = new mongoose.Schema({
  userId1: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  userId2: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  status: { type: String, enum: ['pending', 'accepted'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Đảm bảo không có mối quan hệ trùng lặp
friendshipSchema.index({ userId1: 1, userId2: 1 }, { unique: true });

module.exports = mongoose.model('Friendship', friendshipSchema);