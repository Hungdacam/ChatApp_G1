const mongoose = require('mongoose');

const streamCallSchema = new mongoose.Schema({
  callId: {
    type: String,
    required: true,
    unique: true
  },
  initiator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['active', 'ended', 'missed'],
    default: 'active'
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number,
    default: 0
  },
  chatId: {
    type: String,
    ref: 'Chat'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

streamCallSchema.index({ callId: 1 });
streamCallSchema.index({ initiator: 1 });
streamCallSchema.index({ participants: 1 });
streamCallSchema.index({ chatId: 1 });

const StreamCall = mongoose.model('StreamCall', streamCallSchema);

module.exports = StreamCall;
