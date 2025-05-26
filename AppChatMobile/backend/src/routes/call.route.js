
const express = require('express');
const router = express.Router();
const streamController = require('../controllers/call.controller');
const protectRoute = require('../middleware/auth.middleware');

// Áp dụng middleware xác thực cho tất cả các route
router.use(protectRoute);

// Lấy token Stream
router.get('/token', streamController.generateStreamToken);

// Tạo cuộc gọi mới
router.post('/call', streamController.createCall);

// Tạo group call
router.post('/group-call', streamController.createGroupCall);

// Kết thúc cuộc gọi
router.put('/call/:callId/end', streamController.endCall);

// Lấy lịch sử cuộc gọi
router.get('/calls', streamController.getCallHistory);

module.exports = router;