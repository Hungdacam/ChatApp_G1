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
  { name: 'images', maxCount: 10 },
  { name: 'videos', maxCount: 10 } 
]);

router.post("/send", authMiddleware, upload, chatController.sendMessage);
router.get("/messages/:chatId", authMiddleware, chatController.getMessages);
router.get("/list", authMiddleware, chatController.getChatList);
router.post("/mark-read", authMiddleware, chatController.markAsRead);
router.post("/test-emoji", authMiddleware, chatController.testEmojiStorage);
router.post('/recall', authMiddleware, chatController.recallMessage);
router.get("/:chatId", authMiddleware, chatController.getChatDetails);
router.post('/pin', authMiddleware, chatController.pinMessage);
router.post('/unpin', authMiddleware, chatController.unpinMessage);
router.get('/:chatId/pinned', authMiddleware, chatController.getPinnedMessages);

module.exports = router;