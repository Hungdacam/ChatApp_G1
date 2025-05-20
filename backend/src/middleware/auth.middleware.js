const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const protectRoute = async (req, res, next) => {
    try {
        let token;

        // 1. Lấy token từ cookie hoặc Authorization header
        if (req.cookies && req.cookies.jwt) {
            token = req.cookies.jwt; // từ cookie (web)
        } else if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer ')
        ) {
            token = req.headers.authorization.split(' ')[1]; // từ header (mobile)
            console.log("Token from header:", token);  // Debug log
        }

        // 2. Nếu không có token, từ chối truy cập
        if (!token) {
            return res.status(401).json({ message: 'Không được cấp quyền truy cập' });
        }

        // 3. Giải mã token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Decoded token:", decoded);  // Debug log
        if (!decoded) {
            return res.status(401).json({ message: 'Không xác thực được token' });
        }

        // 4. Tìm user trong DB
        const user = await User.findById(decoded.userId).select('-password');
        if (!user) {
            console.log(`User not found with ID: ${decoded.userId}`);  // Debug log
            return res.status(404).json({ message: 'Người dùng không tồn tại' });
        }

        // 5. Gắn user vào request để dùng tiếp
        req.user = user;
        next();
    } catch (error) {
        console.error('Lỗi trong protectRoute middleware:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token không hợp lệ' });
        }
    
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token đã hết hạn' });
        }
    
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
};


module.exports = protectRoute;
