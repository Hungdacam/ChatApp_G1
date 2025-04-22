const express = require("express");
const {
  login,
  logout,
  sendSignupOTP,
  verifyAndSignup,
  updateProfile,
  checkAuth,
  findByPhone,
  changePassword,
  sendForgotPasswordOTP,
  verifyForgotPasswordOTP,
  resetPassword,
  updateUserImg,
  getUsers
} = require("../controllers/auth.controller");

const protectRoute = require("../middleware/auth.middleware");

const router = express.Router();

// 📌 Gửi mã OTP đến số điện thoại
router.post("/send-otp", sendSignupOTP);

// 📌 Xác minh OTP và tạo tài khoản
router.post("/verify-signup", verifyAndSignup);

// 📌 Đăng nhập
router.post("/login", login);

// 📌 Đăng xuất
router.post("/logout", logout);

// 📌 Cập nhật hồ sơ (avatar, info,...)
router.put("/update-profile", protectRoute, updateProfile);
router.put("/me/update", protectRoute, updateUserImg);
// 📌 Cập nhật mật khẩu
router.post("/update-password", protectRoute, changePassword);

// otp quen mat khau
router.post("/send-forgot-otp", sendForgotPasswordOTP);
// Xac thực quên mật khẩu
router.post("/verify-otp", verifyForgotPasswordOTP);
// Đổi mật khẩu
router.post("/reset-password", resetPassword);

// 📌 Kiểm tra xác thực người dùng
router.get("/check", protectRoute, checkAuth);
router.post("/find-user-by-phone", protectRoute, findByPhone);

// 📌 Lấy danh sách người dùng
router.get("/users", protectRoute, getUsers);
module.exports = router;
