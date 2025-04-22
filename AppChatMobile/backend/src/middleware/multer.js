const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    if (!file) return cb(null, true); // Cho phép nếu không có file
    const fileTypes = /jpeg|jpg|png/;
    const mimetype = fileTypes.test(file.mimetype);
    const extname = fileTypes.test(file.originalname.toLowerCase().split(".").pop());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Chỉ hỗ trợ định dạng JPEG hoặc PNG"));
  },
}).fields([
  { name: "image", maxCount: 1 },
  { name: "video", maxCount: 1 },
  { name: "file", maxCount: 1 },
  { name: "avatar", maxCount: 1 },
  { name: "groupName", maxCount: 1 }, 
  { name: "memberIds", maxCount: 1 }, 
]);

module.exports = upload;