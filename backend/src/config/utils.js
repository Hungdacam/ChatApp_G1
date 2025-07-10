const jwt = require('jsonwebtoken');

const generateToken = (userId, res, clientType = 'mobile') => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: '7d',
    });

    // Nếu client là web → gắn vào cookie
    if (clientType === 'web' && res) {
        res.cookie('jwt', token, {
            httpOnly: true,
            secure: true,
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // none cho cross-origin
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
        });
    }

    return token;
};

module.exports = generateToken;
