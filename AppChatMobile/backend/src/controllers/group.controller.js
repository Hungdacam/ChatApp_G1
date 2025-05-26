const Chat = require("../models/chat.model");
const Message = require("../models/message.model");
const User = require("../models/user.model");
const { v4: uuidv4 } = require("uuid");
const cloudinary = require("../config/cloudinary");

exports.createGroup = async (req, res) => {
  try {
    let { groupName, memberIds } = req.body;
    const creatorId = req.user._id;
    let avatar = "https://via.placeholder.com/50";

    // Parse memberIds từ chuỗi JSON
    try {
      memberIds = JSON.parse(memberIds);
    } catch (error) {
      return res.status(400).json({ message: "Danh sách thành viên không hợp lệ" });
    }

    // Kiểm tra dữ liệu đầu vào
    if (!groupName || !memberIds || !Array.isArray(memberIds) || memberIds.length < 2) {
      return res.status(400).json({ message: "Phải có tên nhóm và ít nhất 2 thành viên" });
    }

    // Kiểm tra user tồn tại
    const members = await User.find({ _id: { $in: memberIds } });
    if (members.length !== memberIds.length) {
      return res.status(400).json({ message: "Có thành viên không tồn tại" });
    }

    // Xử lý hình ảnh nếu có
    if (req.files && req.files.avatar && req.files.avatar[0]) {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "group_avatars",
            resource_type: "image",
            transformation: [
              { width: 200, height: 200, crop: "fill" },
              { quality: "auto" },
              { fetch_format: "auto" },
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.files.avatar[0].buffer);
      });
      avatar = result.secure_url;
    }

    const participants = [...new Set([creatorId, ...memberIds])];
    const chatId = uuidv4();
    const chat = new Chat({
      chatId,
      avatar,
      admins: [creatorId],
      groupName,
      createdBy: creatorId,
      participants,
      isGroupChat: true,
    });

    await chat.save();

    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");
    
    participants.forEach((userId) => {
      const socketId = onlineUsers.get(userId.toString());
      if (socketId) {
        io.to(socketId).emit("new_group_created", {
          chatId,
          groupName,
          participants,
          avatar,
        });
      }
    });

    res.status(201).json({ message: "Tạo nhóm thành công", chatId, avatar });
  } catch (error) {
    console.error("Lỗi tạo nhóm:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

exports.addGroupMember = async (req, res) => {
  try {
    const { chatId, userId } = req.body;
    const adminId = req.user._id;
    
    const chat = await Chat.findOne({ chatId, isGroupChat: true });
    if (!chat) {
      return res.status(404).json({ message: "Nhóm không tồn tại" });
    }
    
    if (!chat.admins.includes(adminId)) {
      return res.status(403).json({ message: "Chỉ admin mới có thể thực hiện thêm" });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ message: "Người dùng không tồn tại" });
    }
    
    if (chat.participants.includes(userId)) {
      return res.status(400).json({ message: "Thành viên đã tồn tại trong nhóm" });
    }
    
    chat.participants.push(userId);
    await chat.save();
    
    // Lấy thông tin đầy đủ của chat để trả về
    const updatedChat = await Chat.findOne({ chatId })
      .populate('participants', 'name avatar')
      .populate('admins', 'name avatar')
      .populate('createdBy', 'name avatar');
    
    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");
    
    chat.participants.forEach((participantId) => {
      const socketId = onlineUsers.get(participantId.toString());
      if (socketId) {
        io.to(socketId).emit("group_member_added", {
          chatId,
          userId,
          userName: user.name,
          chat: updatedChat // Thêm đối tượng chat đầy đủ
        });
      }
    });
    
    res.status(200).json({ 
      message: "Thêm thành viên mới thành công",
      chat: updatedChat
    });
  } catch (error) {
    console.error("Lỗi thêm thành viên:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};


exports.removeGroupMember = async (req, res) => {
  try {
    const { chatId, userId } = req.body;
    const currentUserId = req.user._id;

    const chat = await Chat.findOne({ chatId, isGroupChat: true });
    if (!chat) {
      return res.status(404).json({ message: "Không tồn tại nhóm" });
    }

    const isOwner = chat.createdBy.toString() === currentUserId.toString();
    const isAdmin = chat.admins.map(id => id.toString()).includes(currentUserId.toString());

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Chỉ trưởng nhóm hoặc phó nhóm mới có thể xóa thành viên" });
    }

    
    if (userId.toString() === currentUserId.toString()) {
      return res.status(400).json({ message: "Không thể tự xóa chính mình" });
    }

    
    if (userId.toString() === chat.createdBy.toString() && !isOwner) {
      return res.status(403).json({ message: "Không thể xóa trưởng nhóm" });
    }

    if (!chat.participants.map(id => id.toString()).includes(userId.toString())) {
      return res.status(400).json({ message: "Không tồn tại người dùng trong nhóm" });
    }

    // Xoá user khỏi participants và admins
    chat.participants = chat.participants.filter(id => id.toString() !== userId.toString());
    chat.admins = chat.admins.filter(id => id.toString() !== userId.toString());
    await chat.save();

    const updatedChat = await Chat.findOne({ chatId })
      .populate('participants', 'name avatar')
      .populate('admins', 'name avatar')
      .populate('createdBy', 'name avatar');

    // Gửi sự kiện qua socket
    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");

    chat.participants.forEach(participantId => {
      const socketId = onlineUsers.get(participantId.toString());
      if (socketId) {
        io.to(socketId).emit("group_member_removed", {
          chatId,
          userId,
          chat: updatedChat
        });
      }
    });

    const userSocketId = onlineUsers.get(userId.toString());
    if (userSocketId) {
      io.to(userSocketId).emit("removed_from_group", {
        chatId,
        groupName: chat.groupName,
      });
    }

    res.status(200).json({
      message: "Đã xóa thành viên khỏi nhóm",
      chat: updatedChat
    });
  } catch (error) {
    console.error("Lỗi xóa thành viên:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

exports.dissolveGroup = async (req, res) => {
  try {
    const { chatId } = req.body;
    const userId = req.user._id;

    const chat = await Chat.findOne({ chatId, isGroupChat: true });
    if (!chat) {
      return res.status(404).json({ message: "Không tồn tại nhóm" });
    }

    if (chat.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Chỉ người tạo nhóm mới có thể giải tán nhóm" });
    }

    if (chat.avatar && chat.avatar !== "https://via.placeholder.com/50") {
      const publicId = chat.avatar.split("/").pop().split(".")[0];
      try {
        await cloudinary.uploader.destroy(`group_avatars/${publicId}`);
      } catch (error) {
        console.warn("Không thể xóa avatar nhóm trên Cloudinary:", error);
      }
    }

    await Message.deleteMany({ chatId });
    await Chat.deleteOne({ chatId });

    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");
    chat.participants.forEach((participantId) => {
      const socketId = onlineUsers.get(participantId.toString());
      if (socketId) {
        io.to(socketId).emit("group_dissolved", {
          chatId,
          groupName: chat.groupName,
        });
      }
    });

    res.status(200).json({ message: "Đã giải tán nhóm" });
  } catch (error) {
    console.error("Lỗi giải tán nhóm:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

exports.assignAdmin = async (req, res) => {
  try {
    const { chatId, userId } = req.body;
    const adminId = req.user._id;

    const chat = await Chat.findOne({ chatId, isGroupChat: true });
    if (!chat) {
      return res.status(404).json({ message: "Nhóm không tồn tại" });
    }

    if (!chat.admins.includes(adminId)) {
      return res.status(403).json({ message: "Chỉ admin mới có thể gán quyền admin" });
    }

    if (!chat.participants.includes(userId)) {
      return res.status(400).json({ message: "Người dùng không phải thành viên của nhóm" });
    }

    if (chat.admins.includes(userId)) {
      return res.status(400).json({ message: "Người dùng đã là admin" });
    }

    chat.admins.push(userId);
    await chat.save();

    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");

    // Lấy thông tin đầy đủ của chat để trả về
    const updatedChat = await Chat.findOne({ chatId })
      .populate('participants', 'name avatar')
      .populate('admins', 'name avatar')
      .populate('createdBy', 'name avatar');
    
    chat.participants.forEach((participantId) => {
      const socketId = onlineUsers.get(participantId.toString());
      if (socketId) {
        io.to(socketId).emit("admin_assigned", {
          chatId,
          userId,
          admins: updatedChat.admins,
          chat: updatedChat
        });
      }
    });

    res.status(200).json({ 
      message: "Đã gán quyền admin cho thành viên",
      chat: updatedChat
    });
  } catch (error) {
    console.error("Lỗi gán quyền admin:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

exports.removeAdmin = async (req, res) => {
  try {
    const { chatId, userId } = req.body;
    const adminId = req.user._id;

    const chat = await Chat.findOne({ chatId, isGroupChat: true });
    if (!chat) {
      return res.status(404).json({ message: "Nhóm không tồn tại" });
    }

    const isAdmin = chat.admins.some(id => id.toString() === adminId.toString());
    if (!isAdmin) {
      return res.status(403).json({ message: "Chỉ admin mới có thể xóa quyền admin" });
    }

    const isUserAdmin = chat.admins.some(id => id.toString() === userId.toString());
    if (!isUserAdmin) {
      return res.status(400).json({ message: "Người dùng không phải admin" });
    }

    if (userId.toString() === adminId.toString()) {
      return res.status(400).json({ message: "Không thể tự xóa quyền admin của mình" });
    }

    chat.admins = chat.admins.filter((id) => id.toString() !== userId.toString());
    await chat.save();

    // Lấy thông tin đầy đủ của chat để trả về
    const updatedChat = await Chat.findOne({ chatId })
      .populate('participants', 'name avatar')
      .populate('admins', 'name avatar')
      .populate('createdBy', 'name avatar');
    
    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");
    
    chat.participants.forEach((participantId) => {
      const socketId = onlineUsers.get(participantId.toString());
      if (socketId) {
        io.to(socketId).emit("admin_removed", {
          chatId,
          userId,
          admins: updatedChat.admins,
          chat: updatedChat
        });
      }
    });
    
    res.status(200).json({ 
      message: "Đã xóa quyền admin của thành viên",
      chat: {
        ...updatedChat._doc,
        isGroupChat: true // Đảm bảo trường này luôn được gửi về
      }
    });
    
  } catch (error) {
    console.error("Lỗi xóa quyền admin:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

exports.updateGroupAvatar = async (req, res) => {
  try {
    const { chatId } = req.body;
    const userId = req.user._id;
    
    // Kiểm tra quyền admin
    const chat = await Chat.findOne({ chatId, admins: userId });
    if (!chat) {
      return res.status(403).json({ message: "Bạn không có quyền cập nhật avatar nhóm" });
    }
    
    // Kiểm tra file ảnh
    if (!req.files || !req.files.avatar || !req.files.avatar[0]) {
      return res.status(400).json({ message: "Không có hình ảnh được gửi" });
    }
    
    // Upload ảnh lên Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "group_avatars",
          resource_type: "image",
          transformation: [
            { width: 200, height: 200, crop: "fill" },
            { quality: "auto" },
            { fetch_format: "auto" },
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.files.avatar[0].buffer);
    });
    
    // Xóa ảnh cũ nếu có
    if (chat.avatar && chat.avatar !== "https://via.placeholder.com/50") {
      const oldPublicId = chat.avatar.split("/").pop().split(".")[0];
      try {
        await cloudinary.uploader.destroy(`group_avatars/${oldPublicId}`);
      } catch (error) {
        console.warn("Không thể xóa hình ảnh cũ trên Cloudinary:", error);
      }
    }
    
    // Cập nhật avatar trong database
    chat.avatar = result.secure_url;
    await chat.save();
    
    // Lấy thông tin đầy đủ của chat để trả về
    const updatedChat = await Chat.findOne({ chatId })
      .populate('participants', 'name avatar')
      .populate('admins', 'name avatar')
      .populate('createdBy', 'name avatar');
    
    // Thông báo cho tất cả thành viên trong nhóm
    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");
    
    chat.participants.forEach((participantId) => {
      const socketId = onlineUsers.get(participantId.toString());
      if (socketId) {
        io.to(socketId).emit("group_avatar_updated", {
          chatId,
          avatar: result.secure_url,
          chat: updatedChat
        });
      }
    });
    
    res.status(200).json({ 
      message: "Cập nhật avatar thành công", 
      avatar: result.secure_url,
      chat: updatedChat
    });
  } catch (error) {
    console.error("Lỗi cập nhật avatar nhóm:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};


exports.leaveGroup = async (req, res) => {
  try {
    const { chatId } = req.body;
    const userId = req.user._id;
    
    // Tìm nhóm chat
    const chat = await Chat.findOne({ chatId, isGroupChat: true });
    
    if (!chat) {
      return res.status(404).json({ message: "Nhóm không tồn tại" });
    }
    
    // Kiểm tra xem người dùng có phải là thành viên của nhóm không
    if (!chat.participants.includes(userId)) {
      return res.status(400).json({ message: "Bạn không phải là thành viên của nhóm này" });
    }
    
    // Kiểm tra xem người dùng có phải là người tạo nhóm không
    if (chat.createdBy.toString() === userId.toString()) {
      return res.status(400).json({ 
        message: "Người tạo nhóm không thể rời nhóm. Vui lòng chọn giải tán nhóm hoặc chuyển quyền sở hữu nhóm cho người khác" 
      });
    }
    
    // Xóa người dùng khỏi danh sách thành viên
    chat.participants = chat.participants.filter(
      (id) => id.toString() !== userId.toString()
    );
    
    // Xóa người dùng khỏi danh sách admin nếu họ là admin
    chat.admins = chat.admins.filter(
      (id) => id.toString() !== userId.toString()
    );
    
    await chat.save();
    
    // Thông báo cho tất cả thành viên còn lại trong nhóm
    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");
    
    // Thông báo cho các thành viên còn lại trong nhóm
    chat.participants.forEach((participantId) => {
      const socketId = onlineUsers.get(participantId.toString());
      if (socketId) {
        io.to(socketId).emit("member_left_group", {
          chatId,
          userId,
          groupName: chat.groupName
        });
      }
    });
    
    // Thông báo cho người rời nhóm
    const userSocketId = onlineUsers.get(userId.toString());
    if (userSocketId) {
      io.to(userSocketId).emit("left_group", {
        chatId,
        groupName: chat.groupName
      });
    }
    
    res.status(200).json({ message: "Đã rời khỏi nhóm thành công" });
  } catch (error) {
    console.error("Lỗi rời nhóm:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};
exports.transferGroupOwnership = async (req, res) => {
  try {
    const { chatId, newCreatorId } = req.body;
    const userId = req.user._id;

    const chat = await Chat.findOne({ chatId, isGroupChat: true });
    if (!chat) {
      return res.status(404).json({ message: "Không tồn tại nhóm" });
    }

    if (chat.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Chỉ trưởng nhóm mới có thể chuyển quyền" });
    }

    if (!chat.participants.includes(newCreatorId)) {
      return res.status(400).json({ message: "Người dùng không phải là thành viên của nhóm" });
    }

    // Cập nhật trưởng nhóm mới
    chat.createdBy = newCreatorId;
    if (!chat.admins.includes(newCreatorId)) {
      chat.admins.push(newCreatorId);
    }
    // Xóa người dùng hiện tại khỏi nhóm
    chat.participants = chat.participants.filter((id) => id.toString() !== userId.toString());
    chat.admins = chat.admins.filter((id) => id.toString() !== userId.toString());
    await chat.save();

    const updatedChat = await Chat.findOne({ chatId })
      .populate('participants', 'name avatar')
      .populate('admins', 'name avatar')
      .populate('createdBy', 'name avatar');

    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");

    // Thông báo cho các thành viên còn lại
    chat.participants.forEach((participantId) => {
      const socketId = onlineUsers.get(participantId.toString());
      if (socketId) {
        io.to(socketId).emit("group_ownership_transferred", {
          chatId,
          newCreatorId,
          oldCreatorId: userId,
          chat: updatedChat,
        });
      }
    });

    // Thông báo cho người rời nhóm
    const userSocketId = onlineUsers.get(userId.toString());
    if (userSocketId) {
      io.to(userSocketId).emit("left_group", {
        chatId,
        groupName: chat.groupName,
      });
    }

    res.status(200).json({ message: "Đã chuyển quyền trưởng nhóm và rời nhóm thành công", chat: updatedChat });
  } catch (error) {
    console.error("Lỗi chuyển quyền trưởng nhóm:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};