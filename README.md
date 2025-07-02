```markdown
# ShibaTalk - Realtime Chat App with Video Call

**"Kết nối tức thì – Trò chuyện không giới hạn."**  
Một ứng dụng nhắn tin thời gian thực hiện đại, giao diện đẹp, hỗ trợ gọi video, đăng nhập bảo mật và trải nghiệm mượt mà.

## 🌟 Tổng quan
ShibaTalk là ứng dụng chat realtime được xây dựng dựa trên kiến trúc MERN hiện đại, tích hợp Socket.IO cho nhắn tin thời gian thực và Stream SDK cho gọi video. Dự án hỗ trợ triển khai bằng Docker và hoạt động hiệu quả ở cả môi trường development và production.

## 🚀 Tính năng nổi bật
- ✨ Đăng ký / đăng nhập với JWT, xác thực OTP với Twilio
- 💬 Chat 1-1 và nhóm với Socket.IO  
- 📸 Upload ảnh đại diện với Cloudinary  
- 🎥 Gọi video nhóm với Stream Video SDK  
- 🧾 Tìm bạn, quản lý nhóm, chỉnh sửa profile  
- 🌐 Giao diện UI đẹp, tối giản, responsive  

## 🧱 Tech Stack

| Layer            | Công nghệ sử dụng                      |
|-------------------|---------------------------------------|
| Frontend         | ReactJS, TailwindCSS, Zustand, Vite    |
| Backend          | ExpressJS, MongoDB Atlas, Socket.IO    |
| Auth             | JWT, bcrypt, cookie-parser, Twilio(OTP)|
| Realtime         | Socket.IO, Stream SDK                  |
| Media            | Cloudinary, Multer                     |
| DevOps           | Docker, Docker Compose, Nodemon        |

## 📁 Cấu trúc thư mục
📦 ChatApp_G1
├── backend/
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── models/
│       ├── routes/
│       ├── services/
│       └── index.js
├── frontend/
│   └── src/
│       ├── assets/
│       ├── components/
│       ├── constants/
│       ├── lib/
│       ├── pages/
│       ├── store/
│       ├── App.jsx
│       └── main.jsx
├── demo/
├── Dockerfile
├── docker-compose.dev.yml
├── docker-compose.prod.yml
└── README.md

## 🖼️ Giao diện Demo
Dưới đây là một số hình ảnh minh họa các chức năng nổi bật:

### 🏠 Đăng nhập

![Login Screen](./demo/LoginScreen.png)

---

### 🏠 Đăng ký

![Register Screen:](./demo/RegisterScreen.png)

---

### 🏠 Trang chủ

![Home Page:](./demo/HomePage.png)  

---

### 🏠 Giao diện nhắn tin

![Chat Screen:](./demo/ChatScreen.png)  

---

### 🏠 Thông tin người dùng

![Profile Screen:](./demo/ProfileScreen.png)    

---

### 🏠 Tìm kiếm bạn bè

![Search Friend Screen:](./demo/SearchFriendScreen.png)    

---

### 🏠 Cuộc gọi

![Call Screen:](./demo/CallScreen.jpg)

---

## ⚙️ Hướng dẫn cài đặt & chạy

### ✅ 1. Clone và cấu hình môi trường


git clone https://github.com/Hungdacam/ChatApp_G1
cd ChatApp_G1
```

Tạo file `.env` trong thư mục `backend/`:
```
# Database
MONGODB_URI=mongodb://localhost:27017/shibatalk

# JWT
JWT_SECRET=your_super_secret_jwt_key_here

# AWS S3
REGION=ap-southeast-1
ACCESS_KEY_ID=your_aws_access_key_id
SECRET_ACCESS_KEY=your_aws_secret_access_key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Twilio
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_SERVICE_SID=your_twilio_service_sid

# Environment
NODE_ENV=production
```

### ✅ 2. Chạy ở chế độ Development
```bash
docker-compose -f docker-compose.dev.yml up --build
```

### ✅ 3. Truy cập ứng dụng
- 🌐 Frontend: http://localhost:5173  
- ⚙️ Backend API: http://localhost:3000  

### 🧪 Lệnh thủ công nếu không dùng Docker
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

### 📦 Build cho production
```bash
docker-compose -f docker-compose.prod.yml up --build
```

⚠️ Đảm bảo cập nhật `.env` phù hợp và set `NODE_ENV=production`.

## 📌 Ghi chú
- Kết nối Mongo sử dụng MongoDB Atlas  
- Video call sử dụng Stream SDK, cần token  
- Giao diện viết bằng Tailwind + DaisyUI  

## 👨‍💻 Tác giả
- Hungdacam  
- 🔗 GitHub: https://github.com/Hungdacam  

## 🌈 Happy Chatting!
- 💬 "Mỗi dòng chat là một kết nối!"  
- 🚀 "Viết code không bug, triển khai không lỗi!"
```
