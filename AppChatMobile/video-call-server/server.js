const express = require('express');
const path = require('path');
const app = express();

// Thiết lập CSP
app.use((req, res, next) => {
     res.setHeader('ngrok-skip-browser-warning', 'true'); 
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self' https://*.ngrok-free.app https://*.getstream.io; " +
        "font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com https://*.getstream.io https://cdn.getstream.io; " +
        "style-src 'self' 'unsafe-inline' https://*.getstream.io https://cdn.getstream.io https://fonts.googleapis.com; " +
        "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.getstream.io; " +
        "connect-src 'self' https://*.ngrok-free.app ws://*.ngrok-free.app wss://*.ngrok-free.app https://*.getstream.io wss://*.getstream.io; " +
        "media-src 'self' https://*.ngrok-free.app https://*.getstream.io; " +
        "frame-src 'self' https://*.ngrok-free.app https://*.getstream.io data:;"
    );
    next();
});

// Phục vụ file tĩnh từ thư mục hiện tại
app.use(express.static(path.join(__dirname, '.')));

// Xử lý favicon.ico
app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
});

// Khởi động server
const PORT = 8080;
app.listen(PORT, () => {
    console.log(`Server chạy tại http://localhost:${PORT}`);
});