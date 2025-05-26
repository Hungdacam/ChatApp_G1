const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware");
const groupController = require("../controllers/group.controller");
const upload = require("../middleware/multer");

// Tạo nhóm
router.post("/create", authMiddleware,upload, groupController.createGroup);

// Thêm thành viên vào nhóm
router.post("/add-member", authMiddleware, groupController.addGroupMember);


// Xóa thành viên khỏi nhóm
router.post("/remove-member", authMiddleware, groupController.removeGroupMember);


// Giải tán nhóm
router.post("/dissolve", authMiddleware, groupController.dissolveGroup);

// Gán quyền admin
router.post("/assign-admin", authMiddleware, groupController.assignAdmin);

// Xóa quyền admin
router.post("/remove-admin", authMiddleware, groupController.removeAdmin);
router.post("/update-avatar", authMiddleware, upload, groupController.updateGroupAvatar);
// Rời nhóm
router.post("/leave", authMiddleware, groupController.leaveGroup);

//Chuyển quyền trưởng nhóm
router.post("/transfer-ownership", authMiddleware, groupController.transferGroupOwnership);
module.exports = router;