const express = require('express');
const authRoutes = require('./routes/auth.route');
const messageRoutes = require('./routes/message.route');
const friendRoutes = require('./routes/friends.router');
const chatRoutes = require('./routes/chat.route');
const groupRoutes = require('./routes/group.route');
const http = require('http');
const socketio = require('socket.io');

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
});

app.set('io', io);
app.set('onlineUsers', onlineUsers);

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port: ${PORT}`);
    connectDB();
});