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

    const fullChat = await Chat.findOne({ chatId })
      .populate('participants', 'name avatar')
      .populate('admins', 'name avatar')
      .populate('createdBy', 'name avatar');
    
      participants.forEach((userId) => {
        const socketId = onlineUsers.get(userId.toString());
        if (socketId) {
          io.to(socketId).emit("new_group_created", {
            chat: fullChat, // Gửi đầy đủ thông tin chat
            chatId,
            groupName,
            participants,
            avatar,
          });
        }
      });

      res.status(201).json({ 
        message: "Tạo nhóm thành công", 
        chatId, 
        avatar,
        chat: fullChat // Trả về đầy đủ thông tin chat
      });
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
    
    const isCreator = chat.createdBy.toString();
        const isAdmin = chat.admins.includes(adminId);
        
        if (!isAdmin && !isCreator) {
            return res.status(403).json({ message: "Bạn không có quyền thêm thành viên vào nhóm này" });
        }
    
    // Tìm thông tin người dùng đầy đủ
    const user = await User.findById(userId).select('name avatar');
    if (!user) {
      return res.status(400).json({ message: "Người dùng không tồn tại" });
    }
    
    // Kiểm tra xem người dùng đã tồn tại trong nhóm chưa
    const userExists = chat.participants.some(p => {
      return p.toString() === userId.toString();
    });
    
    if (userExists) {
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
    
    // Thông báo cho tất cả thành viên hiện tại (trừ thành viên mới)
    chat.participants.forEach((participantId) => {
      const socketId = onlineUsers.get(participantId.toString());
      if (socketId) {
        io.to(socketId).emit("group_member_added", {
          chatId,
          userId,
          userName: user.name,
          userAvatar: user.avatar,
          userInfo: {
            _id: user._id,
            name: user.name,
            avatar: user.avatar
          },
          chat: updatedChat // Gửi đầy đủ thông tin chat
        });
      }
    });
    const newMemberSocketId = onlineUsers.get(userId.toString());
    if (newMemberSocketId) {
      io.to(newMemberSocketId).emit("new_group_created", {
        chatId,
        groupName: chat.groupName,
        participants: updatedChat.participants,
        avatar: chat.avatar,
        chat: updatedChat
      });
    }
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
    const adminId = req.user._id;
    
    const chat = await Chat.findOne({ chatId, isGroupChat: true });
    if (!chat) {
      return res.status(404).json({ message: "Không tồn tại nhóm" });
    }
    
    if (!chat.admins.includes(adminId)) {
      return res.status(403).json({ message: "Chỉ admin mới có thể xóa thành viên" });
    }
    
    if (userId.toString() === adminId.toString()) {
      return res.status(400).json({ message: "Không thể tự xóa chính mình" });
    }
    
    if (!chat.participants.includes(userId)) {
      return res.status(400).json({ message: "Không tồn tại người dùng trong nhóm" });
    }
    
    chat.participants = chat.participants.filter((id) => id.toString() !== userId.toString());
    chat.admins = chat.admins.filter((id) => id.toString() !== userId.toString());
    await chat.save();
    
    // Lấy thông tin đầy đủ của chat để trả về
    const updatedChat = await Chat.findOne({ chatId })
      .populate('participants', 'name avatar')
      .populate('admins', 'name avatar')
      .populate('createdBy', 'name avatar');
    
    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");
    
    // Gửi sự kiện với đầy đủ thông tin chat
    chat.participants.forEach((participantId) => {
      const socketId = onlineUsers.get(participantId.toString());
      if (socketId) {
        io.to(socketId).emit("group_member_removed", {
          chatId,
          userId,
          chat: updatedChat // Gửi đầy đủ thông tin chat
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
     // Lấy thông tin người dùng để gửi kèm thông báo
     const user = await User.findById(userId).select('name');

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
          dissolvedBy: {
            _id: userId,
            name: user.name
          }
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
      const user = await User.findById(userId).select('name avatar');
      
      // Tìm nhóm chat
      const chat = await Chat.findOne({ chatId, isGroupChat: true });
      if (!chat) {
          return res.status(404).json({ message: "Nhóm không tồn tại" });
      }
      
      // Kiểm tra xem người dùng có phải là thành viên của nhóm không
      if (!chat.participants.includes(userId)) {
          return res.status(400).json({ message: "Bạn không phải là thành viên của nhóm này" });
      }
      
      // Kiểm tra nếu người dùng là người tạo nhóm
      const isCreator = chat.createdBy.toString() === userId.toString();
      const isAdmin = chat.admins.includes(userId);
      
      // Nếu là người tạo nhóm, kiểm tra xem có admin khác không
      if (isCreator) {
          const otherAdmins = chat.admins.filter(adminId => 
              adminId.toString() !== userId.toString()
          );
          
          if (otherAdmins.length === 0) {
              return res.status(400).json({
                  message: "Bạn là người tạo nhóm và là admin duy nhất. Vui lòng gán quyền admin cho người khác trước khi rời nhóm hoặc chọn giải tán nhóm."
              });
          }
      } 
      // Nếu là admin thường (không phải người tạo), kiểm tra xem người tạo nhóm còn trong nhóm không
      else if (isAdmin) {
          const creatorStillInGroup = chat.participants.some(participantId => 
              participantId.toString() === chat.createdBy.toString()
          );
          
          // Nếu người tạo nhóm không còn trong nhóm và là admin cuối cùng
          if (!creatorStillInGroup) {
              const remainingAdmins = chat.admins.filter(adminId =>
                  adminId.toString() !== userId.toString()
              );
              
              if (remainingAdmins.length === 0) {
                  return res.status(400).json({
                      message: "Bạn là admin cuối cùng của nhóm và người tạo nhóm không còn trong nhóm. Vui lòng gán quyền admin cho người khác trước khi rời nhóm."
                  });
              }
          }
          // Nếu người tạo nhóm vẫn còn trong nhóm, admin có thể rời đi
      }
      
      // Xóa người dùng khỏi danh sách thành viên và admin
      chat.participants = chat.participants.filter(id => id.toString() !== userId.toString());
      chat.admins = chat.admins.filter(id => id.toString() !== userId.toString());
      
      await chat.save();
    
    // Lấy thông tin đầy đủ của chat để gửi về
    const updatedChat = await Chat.findOne({ chatId })
    .populate('participants', 'name avatar')
    .populate('admins', 'name avatar')
    .populate('createdBy', 'name avatar');
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
          userName: user.name,
          groupName: chat.groupName,
          chat: updatedChat // Thêm thông tin chat đầy đủ
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

