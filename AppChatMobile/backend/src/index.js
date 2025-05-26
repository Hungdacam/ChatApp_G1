
const express = require('express');
const authRoutes = require('./routes/auth.route');
const messageRoutes = require('./routes/message.route');
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
app.use('/api/message', messageRoutes);
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

    socket.on("register", (userId) => {
        onlineUsers.set(userId, socket.id);
        console.log("📥 Nhận được register:", userId);
        console.log(`📌 Đã lưu user ${userId} với socket ${socket.id}`);
        console.log("🗺️ Danh sách onlineUsers:", [...onlineUsers.entries()]);
        // Emit sự kiện online_users cho tất cả client
        io.emit("online_users", [...onlineUsers.entries()]);
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
socket.on("end_call", (data) => {
  console.log("📞 Nhận sự kiện end_call:", data);
  const { callId } = data;
  
  // Tìm cuộc gọi trong database
  StreamCall.findOne({ callId })
    .then(call => {
      if (call) {
        // Cập nhật trạng thái cuộc gọi
        call.status = 'ended';
        call.endTime = new Date();
        call.duration = Math.floor((call.endTime - call.startTime) / 1000);
        call.save();
        
        // Thông báo cho tất cả người tham gia
        call.participants.forEach(userId => {
          const targetSocketId = findUserSocket(userId.toString());
          if (targetSocketId) {
            console.log(`📤 Gửi thông báo call_ended đến user ${userId}`);
            io.to(targetSocketId).emit("call_ended", { callId });
          }
        });
      } else {
        console.log("⚠️ Không tìm thấy cuộc gọi với ID:", callId);
      }
    })
    .catch(err => console.error("Lỗi khi tìm cuộc gọi:", err));
});

// Xử lý khi người dùng từ chối cuộc gọi
socket.on("reject_call", (data) => {
  console.log("📞 Nhận sự kiện reject_call:", data);
  const { callId, callerId } = data;
  // Thông báo cho người gọi
  if (callerId) {
    const callerSocketId = findUserSocket(callerId);
    if (callerSocketId) {
      console.log(`📤 Gửi thông báo call_rejected đến người gọi ${callerId}`);
      io.to(callerSocketId).emit("call_rejected", {
        callId,
        message: "Cuộc gọi đã bị từ chối"
      });
    } else {
      console.log(`❌ Không tìm thấy socket của người gọi ${callerId}`);
    }
  }
  
  // Cập nhật trạng thái cuộc gọi trong database
  StreamCall.findOne({ callId })
    .then(call => {
      if (call) {
        call.status = 'missed';
        call.endTime = new Date();
        call.save();
      }
    })
    .catch(err => console.error("Lỗi khi cập nhật trạng thái cuộc gọi:", err));
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
