const express = require('express');
const {
  login,
  logout,
  sendSignupOTP,
  verifyAndSignup,
  updateProfile,
  checkAuth,
  sendForgotPasswordOTP,
  verifyForgotPasswordOTP,
  resetPassword,
  changePassword,
  findByPhone
} = require('../controllers/auth.controller');

const protectRoute = require('../middleware/auth.middleware');

const router = express.Router();

// 📌 Gửi mã OTP đến số điện thoại
router.post('/send-otp', sendSignupOTP);

// 📌 Xác minh OTP và tạo tài khoản
router.post('/verify-signup', verifyAndSignup);

// 📌 Đăng nhập
router.post('/login', login);

// 📌 Đăng xuất
router.post('/logout', logout);

// 📌 Cập nhật hồ sơ (avatar, info,...)
router.put('/update-profile', protectRoute, updateProfile);

// 📌 Kiểm tra xác thực người dùng
router.get('/check', protectRoute, checkAuth);


// Route để thay đổi mật khẩu
router.put('/change-password', protectRoute, changePassword);

// otp quen mat khau
router.post('/send-forgot-otp', sendForgotPasswordOTP);
// Xac thực quên mật khẩu 
router.post('/verify-otp', verifyForgotPasswordOTP);
// Đổi mật khẩu
router.post('/reset-password', resetPassword);
// Tim friend by phone
router.post("/find-user-by-phone", protectRoute, findByPhone);

module.exports = router;
