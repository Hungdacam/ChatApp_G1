const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  chatId: { type: String, required: true, unique: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }],
  isGroupChat: { type: Boolean, default: false },
  groupName: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Hàm tiện ích tìm chat 1-1
chatSchema.statics.findOneToOneChat = async function(userId1, userId2) {
  return this.findOne({
    participants: { $all: [userId1, userId2] },
    isGroupChat: false,
  });
};


module.exports = mongoose.model('Chat', chatSchema);