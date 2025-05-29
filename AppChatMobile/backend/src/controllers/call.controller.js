// controllers/stream.controller.js
const StreamCall = require('../models/call.model');
const User = require('../models/user.model');
const { StreamChat } = require('stream-chat');
const Chat = require('../models/chat.model'); 
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

// Thêm hàm mới để tạo group call
const createGroupCall = async (req, res) => {
  try {
    const { chatId, callType = 'video' } = req.body;
    const initiatorId = req.user._id;
    
    // Kiểm tra group chat có tồn tại không
    const chat = await Chat.findOne({ chatId, isGroupChat: true });
    if (!chat) {
      return res.status(404).json({ message: 'Group chat không tồn tại' });
    }
    
    // Kiểm tra người gọi có phải là thành viên của group không
    if (!chat.participants.includes(initiatorId)) {
      return res.status(403).json({ message: 'Bạn không có quyền tạo cuộc gọi trong group này' });
    }
    
    // Tạo ID cuộc gọi ngẫu nhiên
    const callId = crypto.randomBytes(16).toString('hex');
    
    // Tạo bản ghi cuộc gọi mới
    const newCall = new StreamCall({
      callId,
      initiator: initiatorId,
      participants: chat.participants,
      chatId,
      callType,
      isGroupCall: true
    });
    
    await newCall.save();
    
    res.status(201).json({
      callId,
      callType,
      isGroupCall: true,
      participants: chat.participants,
      groupName: chat.groupName,
      message: 'Group call đã được tạo thành công'
    });
  } catch (error) {
    console.error('Error creating group call:', error);
    res.status(500).json({ message: 'Không thể tạo group call' });
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
// ✅ Sửa lại endCall function
const endCall = async (req, res) => {
  try {
    const { callId } = req.params;
    
   // ✅ Populate participants với User model đã được import
    const call = await StreamCall.findOne({ callId }).populate('participants', '_id name avatar');

    if (!call) {
      return res.status(404).json({ message: 'Không tìm thấy cuộc gọi' });
    }

    // Kiểm tra call đã kết thúc chưa
    if (call.status === 'ended') {
      return res.status(200).json({ message: 'Cuộc gọi đã được kết thúc trước đó' });
    }

    call.status = 'ended';
    call.endTime = new Date();
    
    // ✅ Kiểm tra startTime
    if (call.startTime) {
      call.duration = Math.floor((call.endTime - call.startTime) / 1000);
    } else {
      call.duration = 0;
      call.startTime = call.createdAt || call.endTime;
    }
    
    await call.save();

    // ✅ Thông báo cho TẤT CẢ participants qua socket
    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers');
    
    if (io && call.participants) {
      console.log("📋 Sending call_ended to participants:", call.participants);
      
      call.participants.forEach(participant => {
        const participantId = participant._id ? participant._id.toString() : participant.toString();
        const targetSocketId = onlineUsers.get(participantId);
        
        if (targetSocketId) {
          console.log(`📤 API: Gửi call_ended đến user ${participantId}`);
          io.to(targetSocketId).emit('call_ended', {
            callId,
            endedBy: req.user._id,
            message: 'Cuộc gọi đã kết thúc'
          });
        } else {
          console.log(`❌ API: Không tìm thấy socket của user ${participantId}`);
        }
      });
    }

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
  getCallHistory,
  createGroupCall
};