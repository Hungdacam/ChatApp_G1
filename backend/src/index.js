const express = require('express');
const authRoutes = require('./routes/auth.route');
const friendRoutes = require('./routes/friends.route');
const chatRoutes = require('./routes/chat.route');
const groupRoutes = require('./routes/group.route');
const callRoutes = require('./routes/call.route');

const http = require('http');
const socketio = require('socket.io');
const StreamCall = require('./models/call.model');

const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const { connectDB } = require('./config/database');

const PORT = 3000;
const app = express();

dotenv.config();

// 🍪 Parse cookie từ request
app.use(cookieParser());

// 🌐 Cho phép gọi API từ client frontend
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

// 📦 Xử lý dữ liệu JSON và ảnh base64 có kích thước lớn
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 🚀 Đăng ký các route
app.use('/api/auth', authRoutes);
app.use("/api/chat", chatRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/group',groupRoutes );
app.use('/api/stream',callRoutes)
const server = http.createServer(app);

const io = socketio(server, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true,
    }
});
console.log("Socket.IO initialized");

// Socket
const onlineUsers = new Map();
io.on('connection', (socket) => {
    console.log("Có người đăng nhập mới: " + socket.id);

    socket.on("test-client", (data) => {
        console.log("📨 Nhận từ client test-client:", data);
        socket.emit("test-server", { message: "Server nhận được!", original: data });
    });

    socket.on("register", async (userId) => {
        onlineUsers.set(userId, socket.id);
        console.log("📥 Nhận được register:", userId);
        console.log(`📌 Đã lưu user ${userId} với socket ${socket.id}`);
        console.log("🗺️ Danh sách onlineUsers:", [...onlineUsers.entries()]);
        // Emit sự kiện online_users cho tất cả client
        io.emit("online_users", [...onlineUsers.entries()]);
        // Kiểm tra xem user có trong group nào đang có cuộc gọi không
        try {
          const user = require('./models/user.model');
          const Chat = require('./models/chat.model');
          
          // Tìm các group mà user này là thành viên
          const userChats = await Chat.find({
            participants: userId,
            isGroupChat: true
          });
          
          // Kiểm tra các group có cuộc gọi đang diễn ra không
          for (const chat of userChats) {
            const activeCall = await StreamCall.findOne({
              chatId: chat.chatId,
              status: 'active',
              isGroupCall: true
            }).populate('participants', 'name', 'user');
            
            if (activeCall && !activeCall.participants.some(p => p._id.toString() === userId)) {
              // Gửi thông báo về cuộc gọi đang diễn ra
              socket.emit("active_group_call_notification", {
                callId: activeCall.callId,
                groupName: chat.groupName || chat.name,
                participants: activeCall.participants,
                chatId: chat.chatId
              });
            }
          }
        } catch (error) {
          console.error("Lỗi khi kiểm tra cuộc gọi đang diễn ra:", error);
        }
      });

    socket.on('disconnect', () => {
        console.log('Người dùng đã ngắt kết nối: ' + socket.id);
        for (const [userId, sockId] of onlineUsers.entries()) {
            if (sockId === socket.id) {
                onlineUsers.delete(userId);
                console.log(`🗑️ Đã xoá user ${userId} khỏi onlineUsers`);
                break;
            }
        }
        // Emit sự kiện online_users sau khi xóa người dùng
        io.emit("online_users", [...onlineUsers.entries()]);
        console.log("🗺️ Danh sách onlineUsers sau disconnect:", [...onlineUsers.entries()]);
    });
  socket.on("call_user", async (data) => {
  console.log("📞 Nhận sự kiện call_user:", data);
  const { callId, participantIds, chatId, callerId } = data;
  
  try {
    // Lấy thông tin chi tiết của người gọi từ database
    const User = require('./models/user.model');
    const callerUser = await User.findById(callerId);
    
    // Tạo đối tượng caller với thông tin thực tế
    const caller = {
      _id: callerId,
      name: callerUser?.name || "Người dùng",
      avatar: callerUser?.avatar || "/avatar.png"
    };
    
    // Gửi thông báo đến tất cả người tham gia
    participantIds.forEach(userId => {
      console.log(`📲 Gửi thông báo cuộc gọi đến user ${userId}`);
      // Tìm socket của người dùng đích
      const targetSocketId = findUserSocket(userId);
      if (targetSocketId) {
        console.log(`✅ Đã tìm thấy socket của user ${userId}, gửi thông báo`);
        io.to(targetSocketId).emit("incoming_call", {
          callId,
          caller
        });
      } else {
        console.log(`❌ Không tìm thấy socket của user ${userId}`);
      }
    });
  } catch (error) {
    console.error("Lỗi khi xử lý cuộc gọi:", error);
  }
});
// Xử lý khi người dùng kết thúc cuộc gọi
socket.on("end_call", async (data) => {
  console.log("📞 Nhận sự kiện end_call:", data);
  const { callId } = data;
  
  try {
    // ✅ Populate participants để lấy thông tin đầy đủ
   const call = await StreamCall.findOne({ callId }).populate('participants', '_id name avatar');
    if (!call || !call.participants) {
            console.log("⚠️ Không tìm thấy cuộc gọi hoặc participants:", callId);
            return;
        }

    // ✅ Cập nhật trạng thái call
    call.status = 'ended';
    call.endTime = new Date();
    
    // ✅ Kiểm tra startTime trước khi tính duration
    if (call.startTime) {
      call.duration = Math.floor((call.endTime - call.startTime) / 1000);
    } else {
      call.duration = 0;
      call.startTime = call.createdAt || call.endTime;
    }
    
    await call.save();

    // ✅ Gửi cho TẤT CẢ participants bao gồm cả người kết thúc
        console.log("📋 Participants trong call:", call.participants);
        call.participants.forEach(participant => {
            const participantId = participant._id ? participant._id.toString() : participant.toString();
            const targetSocketId = findUserSocket(participantId);
            
            if (targetSocketId) {
                console.log(`📤 Gửi thông báo call_ended đến user ${participantId}`);
                io.to(targetSocketId).emit("call_ended", {
                    callId,
                    endedBy: socket.userId || 'unknown',
                    message: 'Cuộc gọi đã kết thúc'
                });
            } else {
                console.log(`❌ Không tìm thấy socket của user ${participantId}`);
      }
    });

  } catch (error) {
    console.error("❌ Lỗi khi xử lý end_call:", error);
  }
});




// Khi cuộc gọi được chấp nhận
socket.on("call_accepted", (data) => {
  console.log("📞 Cuộc gọi được chấp nhận:", data);
  const { callId } = data;
  
  StreamCall.findOne({ callId })
    .then(call => {
      if (call && call.status === 'ringing') {
        call.status = 'active';
        call.startTime = new Date();
        call.save();
        
        // Thông báo cho tất cả participants
        call.participants.forEach(userId => {
          const targetSocketId = findUserSocket(userId.toString());
          if (targetSocketId) {
            io.to(targetSocketId).emit("call_started", { callId });
          }
        });
      }
    })
    .catch(err => console.error("Lỗi khi cập nhật trạng thái cuộc gọi:", err));
});

// Cập nhật reject_call
socket.on("reject_call", async (data) => {
  console.log("📞 Nhận sự kiện reject_call:", data);
  const { callId, callerId, reason, message } = data;

  try {
    const call = await StreamCall.findOne({ callId });
    if (call) {
      call.status = reason === "busy" ? "busy" : "rejected";
      call.endTime = new Date();
      await call.save();

      // Thông báo cho người gọi
      const callerSocketId = findUserSocket(callerId);
      if (callerSocketId) {
        io.to(callerSocketId).emit("call_rejected", {
          callId,
          reason,
          message: message || "Cuộc gọi đã bị từ chối"
        });
      }

      // Thông báo kết thúc cuộc gọi cho tất cả participants
      call.participants.forEach(userId => {
        const targetSocketId = findUserSocket(userId.toString());
        if (targetSocketId) {
          io.to(targetSocketId).emit("call_ended", { callId });
        }
      });
    }
  } catch (error) {
    console.error("Lỗi khi xử lý reject_call:", error);
  }
});

  // 1. Xử lý group call
  socket.on("start_group_call", async (data) => {
    console.log("📞 Nhận sự kiện start_group_call:", data);
    const { callId, chatId, callerId, isGroupCall } = data;
    
    try {
      // Lấy thông tin group chat
      const Chat = require('./models/chat.model');
      const User = require('./models/user.model');
      
      const chat = await Chat.findOne({ chatId }).populate('participants', 'name avatar');
      const callerUser = await User.findById(callerId);
      
      if (!chat || !chat.isGroupChat) {
        console.error("Group chat không tồn tại");
        return;
      }
      
      const caller = {
        _id: callerId,
        name: callerUser?.name || "Người dùng",
        avatar: callerUser?.avatar || "/avatar.png"
      };
      
      // ✅ Gửi cả participants đầy đủ và participantIds
    const participantIds = chat.participants.map(p => p._id.toString());

    chat.participants.forEach(participant => {
      const participantId = participant._id.toString();
      if (participantId !== callerId) {
        const targetSocketId = findUserSocket(participantId);
        if (targetSocketId) {
          console.log(`📲 Gửi group call đến user ${participantId}`);
          io.to(targetSocketId).emit("incoming_group_call", {
            callId,
            caller,
            groupName: chat.groupName || chat.name,
            chatId,
            isGroupCall: true,
            participants: participantIds, // ✅ Gửi array string IDs
            participantDetails: chat.participants // ✅ Gửi thêm chi tiết nếu cần
          });
          }
        }
      });
    } catch (error) {
      console.error("Lỗi khi xử lý group call:", error);
    }
  });

  // 2. Xử lý khi có người tham gia group call
  socket.on("join_group_call", async (data) => {
    console.log("📞 Nhận sự kiện join_group_call:", data);
    const { callId, userId, userName } = data;
    
    try {
      const call = await StreamCall.findOne({ callId });
      if (call) {
        // Thông báo cho các thành viên khác
        call.participants.forEach(participantId => {
          const targetSocketId = findUserSocket(participantId.toString());
          if (targetSocketId && participantId.toString() !== userId) {
            io.to(targetSocketId).emit("user_joined_call", {
              callId,
              userId,
              userName
            });
          }
        });
      }
    } catch (error) {
      console.error("Lỗi khi xử lý join group call:", error);
    }
  });

  // 3. Xử lý khi có người rời group call
  socket.on("leave_group_call", async (data) => {
    console.log("📞 Nhận sự kiện leave_group_call:", data);
    const { callId, userId, userName } = data;
    
    try {
      const call = await StreamCall.findOne({ callId });
      if (call) {
        // Thông báo cho các thành viên khác
        call.participants.forEach(participantId => {
          const targetSocketId = findUserSocket(participantId.toString());
          if (targetSocketId && participantId.toString() !== userId) {
            io.to(targetSocketId).emit("user_left_call", {
              callId,
              userId,
              userName
            });
          }
        });
      }
    } catch (error) {
      console.error("Lỗi khi xử lý leave group call:", error);
    }
  });

  // 4. Xử lý từ chối group call
  socket.on("reject_group_call", async (data) => {
    console.log("📞 Nhận sự kiện reject_group_call:", data);
    const { callId, userId, userName } = data;
    
    try {
      const call = await StreamCall.findOne({ callId });
      if (call) {
        // Thông báo cho người tạo cuộc gọi
        const creatorSocketId = findUserSocket(call.initiator.toString());
        if (creatorSocketId) {
          io.to(creatorSocketId).emit("group_call_rejected", {
            callId,
            userId,
            userName,
            message: `${userName} đã từ chối tham gia group call`
          });
        }
      }
    } catch (error) {
      console.error("Lỗi khi xử lý reject group call:", error);
    }
  });


function findUserSocket(userId) {
  return onlineUsers.get(userId);
}
});

app.set('io', io);
app.set('onlineUsers', onlineUsers);

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port: ${PORT}`);
    connectDB();
});