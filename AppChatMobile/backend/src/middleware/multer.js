const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    // Cho phép tất cả các loại file
    cb(null, true);
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