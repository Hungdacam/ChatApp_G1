// controllers/stream.controller.js
const StreamCall = require('../models/call.model');
const User = require('../models/user.model');
const { StreamChat } = require('stream-chat');
const { StreamClient } = require('@stream-io/node-sdk');
const crypto = require('crypto');

// Khởi tạo Stream clients
const streamApiKey = process.env.STREAM_API_KEY;
const streamApiSecret = process.env.STREAM_API_SECRET;
const serverClient = new StreamClient(streamApiKey, streamApiSecret);
// Tạo Stream token
const generateStreamToken = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    
    // Tạo token cho người dùng
    const token = serverClient.createToken(userId);
    
    res.status(200).json({ token });
  } catch (error) {
    console.error('Error generating Stream token:', error);
    res.status(500).json({ message: 'Không thể tạo Stream token' });
  }
};

// Tạo cuộc gọi mới
const createCall = async (req, res) => {
  try {
    const { participantIds, chatId } = req.body;
    const initiatorId = req.user._id;
    
    // Tạo ID cuộc gọi ngẫu nhiên
    const callId = crypto.randomBytes(16).toString('hex');
    
    // Tạo bản ghi cuộc gọi mới
    const newCall = new StreamCall({
      callId,
      initiator: initiatorId,
      participants: [...participantIds, initiatorId],
      chatId
    });
    
    await newCall.save();
    
    res.status(201).json({ 
      callId,
      message: 'Cuộc gọi đã được tạo thành công'
    });
  } catch (error) {
    console.error('Error creating call:', error);
    res.status(500).json({ message: 'Không thể tạo cuộc gọi' });
  }
};

// Kết thúc cuộc gọi
const endCall = async (req, res) => {
  try {
    const { callId } = req.params;
    
    const call = await StreamCall.findOne({ callId });
    
    if (!call) {
      return res.status(404).json({ message: 'Không tìm thấy cuộc gọi' });
    }
    
    call.status = 'ended';
    call.endTime = new Date();
    call.duration = Math.floor((call.endTime - call.startTime) / 1000);
    
    await call.save();
    
    res.status(200).json({ message: 'Cuộc gọi đã kết thúc' });
  } catch (error) {
    console.error('Error ending call:', error);
    res.status(500).json({ message: 'Không thể kết thúc cuộc gọi' });
  }
};

// Lấy lịch sử cuộc gọi
const getCallHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const calls = await StreamCall.find({
      participants: userId
    })
    .populate('initiator', 'name avatar')
    .populate('participants', 'name avatar')
    .sort({ createdAt: -1 });
    
    res.status(200).json(calls);
  } catch (error) {
    console.error('Error fetching call history:', error);
    res.status(500).json({ message: 'Không thể lấy lịch sử cuộc gọi' });
  }
};

module.exports = {
  generateStreamToken,
  createCall,
  endCall,
  getCallHistory
};
