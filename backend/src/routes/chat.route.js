const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chat.controller");
const authMiddleware = require("../middleware/auth.middleware");
const multer = require('multer');

// Cấu hình multer để lưu tệp tạm thời
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
}).fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 },
  { name: 'file', maxCount: 1 },
]);

// Cấu hình multer riêng cho endpoint send-file
const uploadSingleFile = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
}).single('file'); // Chỉ xử lý trường 'file'

router.post("/send", authMiddleware, upload, chatController.sendMessage);
router.get("/messages/:chatId", authMiddleware, chatController.getMessages);
router.get("/list", authMiddleware, chatController.getChatList);
router.post("/mark-read", authMiddleware, chatController.markAsRead);
router.post("/test-emoji", authMiddleware, chatController.testEmojiStorage);
router.post('/recall', authMiddleware, chatController.recallMessage);
router.post('/send-file', authMiddleware, uploadSingleFile, chatController.sendFile);

module.exports = router;