const express = require('express');
const router = express.Router();
const protectRoute = require('../middleware/auth.middleware');
const {getUserForsidebar,getMessages,sendMessage} = require('../controllers/message.controller')

//lay nguoi dung len 
router.get("/user",protectRoute,getUserForsidebar);
// xem lich su tro chuyen qua id nguoi dung
router.get("/:id",protectRoute,getMessages);
// xem tin nhan 
router.post("/send/:id",protectRoute,sendMessage)

module.exports =router