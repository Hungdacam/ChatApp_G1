const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chat.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.post("/send", authMiddleware, chatController.sendMessage);
router.get("/messages/:chatId", authMiddleware, chatController.getMessages);
router.get("/list", authMiddleware, chatController.getChatList);

module.exports = router;