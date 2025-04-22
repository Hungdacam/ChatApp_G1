const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const cloudinary = require("../config/cloudinary");
const generateToken = require("../config/utils");
const { client, serviceSid } = require("../config/twilio");
const jwt = require('jsonwebtoken');
// 📌 1. Gửi OTP tới số điện thoại đăng ký
const sendSignupOTP = async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ message: "Thiếu số điện thoại!" });
  }
  // Định dạng số điện thoại: bỏ số 0 đầu, thêm +84
  if (!phone.startsWith("+")) {
    phone = `+84${phone.replace(/^0/, "")}`;
  }
  try {
    await client.verify.v2
      .services(serviceSid)
      .verifications.create({ to: phone, channel: "sms" });

    res.status(200).json({ success: true, message: "Đã gửi mã OTP." });
  } catch (err) {
    console.error("Lỗi gửi OTP:", err.message);
    res.status(500).json({ success: false, message: "Không thể gửi OTP." });
  }
};

// 📌 2. Xác minh OTP và tạo tài khoản
const verifyAndSignup = async (req, res) => {
  const { phone, code, name, email, password, dob, gender, avatar } = req.body;

  if (!phone || !code || !name || !email || !password) {
    return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
  }

  try {
    // ✅ Xác minh OTP
    const check = await client.verify.v2
      .services(serviceSid)
      .verificationChecks.create({ to: phone, code });

    if (check.status !== "approved") {
      return res
        .status(400)
        .json({ message: "OTP không hợp lệ hoặc đã hết hạn" });
    }

    // ✅ Kiểm tra tài khoản đã tồn tại
    const existingPhone = await User.findOne({ phone });
    const existingEmail = await User.findOne({ email });

    if (existingPhone || existingEmail) {
      return res
        .status(400)
        .json({ message: "Email hoặc số điện thoại đã tồn tại" });
    }

    // ✅ Upload avatar nếu có
    let uploadedAvatar = "";
    if (avatar) {
      const uploadResponse = await cloudinary.uploader.upload(avatar);
      uploadedAvatar = uploadResponse.secure_url;
    }

    // ✅ Tạo tài khoản mới
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      avatar: uploadedAvatar,
      dob,
      gender,
    });

    // ✅ Sinh JWT và trả về dữ liệu
    const clientType = req.headers["x-client-type"] || "mobile";
    const token = generateToken(newUser._id, res, clientType);

    const userData = {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      avatar: newUser.avatar,
      dob: newUser.dob,
      gender: newUser.gender,
      createAt: newUser.createAt,
    };

    if (clientType === "web") {
      return res
        .status(201)
        .json({ message: "Đăng ký thành công (Web)", user: userData });
    } else {
      return res.status(201).json({
        message: "Đăng ký thành công (Mobile)",
        token,
        user: userData,
      });
    }
  } catch (err) {
    console.error("Lỗi xác minh và đăng ký:", err.message);
    return res
      .status(500)
      .json({ message: "Lỗi máy chủ khi xác minh OTP và tạo tài khoản" });
  }
};

// 📌 Đăng nhập
// 📌 Đăng nhập
const login = async (req, res) => {
  const { phone, password } = req.body;

  try {
    if (!phone || !password) {
      return res
        .status(400)
        .json({ message: "Vui lòng điền số điện thoại và mật khẩu" });
    }

    // Định dạng số điện thoại nếu cần
    let formattedPhone = phone;
    if (!phone.startsWith("+")) {
      formattedPhone = `+84${phone.replace(/^0/, "")}`;
    }

    const user = await User.findOne({ phone: formattedPhone });
    if (!user)
      return res.status(401).json({ message: "Số điện thoại không tồn tại" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Mật khẩu không đúng" });

    const clientType = req.headers["x-client-type"] || "mobile";
    const token = generateToken(user._id, res, clientType);

    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      dob: user.dob,
      gender: user.gender,
      createAt: user.createAt,
    };

    // Trả về token cho cả web và mobile
    res.status(200).json({
      message: `Đăng nhập thành công (${clientType})`,
      token,
      user: userData,
    });
  } catch (error) {
    console.error("Lỗi đăng nhập:", error); // Thêm log để debug
    res.status(500).json({ message: "Lỗi máy chủ khi đăng nhập" });
  }
};

// 📌 Đăng xuất (nếu dùng cookie cho web)
const logout = (req, res) => {
  res
    .clearCookie("token")
    .status(200)
    .json({ message: "Đăng xuất thành công" });
};

// 📌 Cập nhật hồ sơ
const updateProfile = async (req, res) => {
  const user = req.user;
  const { name, phone, dob, gender, avatar } = req.body;

  try {
    if (phone && phone !== user.phone) {
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) {
        return res.status(400).json({ message: "Số điện thoại đã tồn tại" });
      }
    }

    if (avatar) {
      const uploadResponse = await cloudinary.uploader.upload(avatar);
      user.avatar = uploadResponse.secure_url;
    }

    user.name = name || user.name;
    user.phone = phone || user.phone;
    user.dob = dob || user.dob;
    user.gender = gender || user.gender;

    await user.save();
    res.status(200).json({ message: "Cập nhật thành công", user });

  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ khi cập nhật hồ sơ" });
  }
};
const updateUserImg = async (req, res) => {
  try {
    const { name, email, phone, dob, gender, avatar } = req.body;
    const userId = req.user._id;
    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (email !== undefined) updateFields.email = email;
    if (phone !== undefined) updateFields.phone = phone;
    if (dob !== undefined) updateFields.dob = dob;
    if (gender !== undefined) updateFields.gender = gender;
    if (avatar !== undefined) updateFields.avatar = avatar;
    const updateUser = await User.findByIdAndUpdate(userId, updateFields, {
      new: true,
    });
    if (!updateUser) {
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }
    res.status(200).json(updateUser);
  } catch (error) {
    console.error("Lỗi cập nhật người dùng:", error.message);
    res.status(500).json({ message: "Đã xảy ra lỗi khi cập nhật người dùng." });
  }
};

// 📌 Kiểm tra người dùng đang đăng nhập
const checkAuth = async (req, res) => {
  const user = req.user;
  if (!user) return res.status(401).json({ message: "Không xác thực được người dùng" });

  res.status(200).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatar: user.avatar,
    dob: user.dob,
    gender: user.gender,
    createAt: user.createAt,
  });
};

const findByPhone = async (req, res) => {
  const { phone } = req.body;

  try {
    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    return res.status(200).json({
      id: user._id,
      name: user.name,
      avatar: user.avatar,
      phone: user.phone,
      email: user.email,
      dob: user.dob,
      gender: user.gender,
    });
  } catch (error) {
    console.error("Lỗi tìm người dùng:", error.message);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

//send otp quen mk 
const sendForgotPasswordOTP = async (req, res) => {
  let { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ message: "Thiếu số điện thoại!" });
  }

  if (!phone.startsWith("+")) {
    phone = `+84${phone.replace(/^0/, "")}`;
  }

  try {
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: "Số điện thoại chưa được đăng ký" });
    }

    await client.verify.v2.services(serviceSid)
      .verifications.create({ to: phone, channel: 'sms' });

    res.status(200).json({ success: true, message: "Đã gửi mã OTP để đặt lại mật khẩu." });
  } catch (err) {
    console.error("Lỗi gửi OTP quên mật khẩu:", err.message);
    res.status(500).json({ success: false, message: "Không thể gửi OTP." });
  }
};

// Xac thu OTP cho quen MK
// 📌 Xác thực OTP cho quên mật khẩu

const verifyForgotPasswordOTP = async (req, res) => {
  const { phone, code } = req.body;

  if (!phone || !code) {
    return res.status(400).json({ message: "Thiếu số điện thoại hoặc mã OTP" });
  }

  try {
    let formattedPhone = phone;
    if (!phone.startsWith("+")) {
      formattedPhone = `+84${phone.replace(/^0/, "")}`;
    }

    const check = await client.verify.v2.services(serviceSid)
      .verificationChecks.create({ to: formattedPhone, code });

    if (check.status !== 'approved') {
      return res.status(400).json({ message: "Mã OTP không hợp lệ hoặc đã hết hạn" });
    }

    // Tạo resetToken (JWT có hạn 5 phút)
    const resetToken = jwt.sign(
      { phone: formattedPhone },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    );

    res.status(200).json({
      success: true,
      message: "Xác minh thành công",
      resetToken,
    });
  } catch (err) {
    console.error("Lỗi xác minh OTP:", err.message);
    res.status(500).json({ message: "Lỗi máy chủ khi xác minh OTP" });
  }
};

// đổi mật khâu
// 📌 Đặt lại mật khẩu
const resetPassword = async (req, res) => {
  const { resetToken, newPassword } = req.body;

  if (!resetToken || !newPassword) {
    return res.status(400).json({ message: "Thiếu token hoặc mật khẩu mới" });
  }

  try {
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    const phone = decoded.phone;

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Đặt lại mật khẩu thành công" });
  } catch (err) {
    console.error("Lỗi đặt lại mật khẩu:", err.message);
    res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
  }
};
const changePassword = async (req, res) => {
  console.log("Body nhận được từ client:", req.body);
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'Thiếu thông tin mật khẩu' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user || !user.password) {
      return res.status(400).json({ message: 'Không tìm thấy mật khẩu người dùng' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Mật khẩu mới và xác nhận mật khẩu không khớp' });
    }

    if (newPassword == currentPassword) {
      return res.status(400).json({ message: 'Mật khẩu mới và mật khẩu hiện tại không được trùng' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: 'Mật khẩu đã được thay đổi thành công' });
  } catch (error) {
    console.error("Lỗi trong changePassword:", error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

const getUsers = async (req, res) => {
  try {
    // Lấy danh sách tất cả người dùng, trừ người dùng hiện tại
    const users = await User.find({ _id: { $ne: req.user._id } }).select(
      "_id name avatar phone"
    );
    res.status(200).json(users);
  } catch (error) {
    console.error("Lỗi lấy danh sách người dùng:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};
module.exports = {
  sendSignupOTP,
  verifyAndSignup,
  login,
  logout,
  updateProfile,
  checkAuth,
  findByPhone,
  resetPassword,
  changePassword,
  verifyForgotPasswordOTP,
  sendForgotPasswordOTP,
  updateUserImg,
  getUsers
};
