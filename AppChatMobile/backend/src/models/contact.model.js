const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  phone: { type: String, required: true },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Index để tránh lưu trùng số điện thoại cho cùng userId
contactSchema.index({ userId: 1, phone: 1 }, { unique: true });

module.exports = mongoose.model('Contact', contactSchema);