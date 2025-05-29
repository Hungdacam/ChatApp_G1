const Chat = require("../models/chat.model");
const friendship = require("../models/friendship.model");
const Message = require("../models/message.model");
const { v4: uuidv4 } = require("uuid");
const { emitNewMessage } = require("../services/socket.service");
const s3 = require('../config/aws');
const cloudinary = require('../config/cloudinary');

exports.sendMessage = async (req, res) => {
  console.log("Request files:", req.files);
  try {
    const senderId = req.user?._id;
    const { chatId, content, receiverId, replyToMessageId } = req.body;
    let imageUrls = [];
    let imageUrl = null;
    let videoUrl = null;
    let fileUrl = null;
    let fileName = null;
    let videoUrls = [];
if (req.body.image) imageUrl = req.body.image;
if (req.body.video) videoUrl = req.body.video;
if (req.body.fileUrl) fileUrl = req.body.fileUrl;
if (req.body.fileName) fileName = req.body.fileName;
    console.log("Request body:", req.body);
    console.log("Request files:", req.files);

    // Kiểm tra xác thực và dữ liệu đầu vào
    if (!senderId) return res.status(401).json({ message: "Vui lòng đăng nhập lại." });
    if (!chatId) return res.status(400).json({ message: "Thiếu chatId." });
    if (
      (!content || content.trim() === "") &&
      !req.files?.image &&
      !req.files?.images && // Thêm dòng này
      !req.files?.video &&
      !req.files?.file
    ) {
      return res.status(400).json({ message: "Tin nhắn, tệp, hình ảnh hoặc video không được để trống." });
    }

    // Kiểm tra chat tồn tại
    let chat = await Chat.findOne({ chatId });
    if (!chat) return res.status(404).json({ message: "Chat không tồn tại." });

    // Xử lý ảnh (Cloudinary)
    if (req.files && req.files.image) {
      try {
        const uploadResponse = await cloudinary.uploader.upload(
          `data:image/jpeg;base64,${req.files.image[0].buffer.toString('base64')}`,
          { resource_type: 'image' }
        );
        imageUrl = uploadResponse.secure_url;
        console.log("Image uploaded:", imageUrl);
      } catch (uploadError) {
        console.error("Lỗi tải ảnh:", uploadError);
        return res.status(500).json({ message: "Lỗi tải ảnh lên Cloudinary." });
      }
    }

    // Xử lý video (Cloudinary)
    if (req.files && req.files.video) {
      try {
        const uploadRes = await cloudinary.uploader.upload(
          `data:video/mp4;base64,${req.files.video[0].buffer.toString('base64')}`,
          { resource_type: 'video' }
        );
        videoUrl = uploadRes.secure_url;
        console.log("Video uploaded:", videoUrl);
      } catch (uploadError) {
        console.error("Lỗi tải video:", uploadError);
        return res.status(500).json({ message: "Lỗi tải video lên Cloudinary." });
      }
    }

    // Xử lý tệp (AWS S3)
    if (req.files && req.files.file && Array.isArray(req.files.file) && req.files.file.length > 0) {
      const file = req.files.file[0];
      console.log("Đang upload file lên S3:", file.originalname);
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `${Date.now()}_${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
      };
      try {
        const uploadResult = await s3.upload(params).promise();
        fileUrl = uploadResult.Location;
        fileName = file.originalname;
        console.log("Upload file thành công:", fileUrl);
      } catch (err) {
        console.error("Lỗi upload file lên S3:", err);
        return res.status(500).json({ message: "Lỗi upload file lên S3", error: err.message });
      }
    }

    // Xử lý nhiều ảnh (Cloudinary)
    if (req.files && req.files.images) {
      for (const img of req.files.images) {
        try {
          const uploadResponse = await cloudinary.uploader.upload(
            `data:image/jpeg;base64,${img.buffer.toString('base64')}`,
            { resource_type: 'image' }
          );
          imageUrls.push(uploadResponse.secure_url);
        } catch (uploadError) {
          console.error("Lỗi tải ảnh:", uploadError);
        }
      }
    }

    // Xử lý nhiều video (Cloudinary)
    if (req.files && req.files.videos) {
      for (const vid of req.files.videos) {
        try {
          const uploadResponse = await cloudinary.uploader.upload(
            `data:video/mp4;base64,${vid.buffer.toString('base64')}`,
            { resource_type: 'video' }
          );
          videoUrls.push(uploadResponse.secure_url);
        } catch (uploadError) {
          console.error("Lỗi tải video:", uploadError);
        }
      }
    }

    // Xác định nội dung tin nhắn
    const contentToSave = content && content.trim() !== ""
      ? content
      : (videoUrl ? "[Video]"
        : imageUrl ? "[Image]"
        : fileUrl ? fileName
        : "");

    if (imageUrls.length > 0) {
      // LẤY io và onlineUsers TRƯỚC khi emit
      const io = req.app.get("io");
      const onlineUsers = req.app.get("onlineUsers");
      for (const url of imageUrls) {
        const messageId = uuidv4();
        const message = new Message({
          messageId,
          chatId,
          senderId,
          content: contentToSave || "[Image]",
          image: url,
          isDelivered: false,
          isRead: false,
          createdAt: new Date(),
          replyToMessageId
        });
        await message.save();
        // emit socket nếu cần
        const populatedMessage = await Message.findOne({ messageId }).populate("senderId", "name avatar");
        emitNewMessage(chat, populatedMessage, io, onlineUsers);
      }
      return res.status(201).json({ message: "Đã gửi nhiều ảnh" });
    }

    // Sau đó tạo message cho từng video
    if (videoUrls.length > 0) {
      const io = req.app.get("io");
      const onlineUsers = req.app.get("onlineUsers");
      for (const url of videoUrls) {
        const messageId = uuidv4();
        const message = new Message({
          messageId,
          chatId,
          senderId,
          content: contentToSave || "[Video]",
          video: url,
          isDelivered: false,
          isRead: false,
          createdAt: new Date(),
          replyToMessageId
        });
        await message.save();
        const populatedMessage = await Message.findOne({ messageId }).populate("senderId", "name avatar");
        emitNewMessage(chat, populatedMessage, io, onlineUsers);
      }
      return res.status(201).json({ message: "Đã gửi nhiều video" });
    }

    // Tạo và lưu tin nhắn
    const messageId = uuidv4();
    const message = new Message({
      messageId,
      chatId,
      senderId,
      content: contentToSave,
      image: imageUrl,
      video: videoUrl,
      fileUrl,
      fileName,
      isDelivered: false,
      isRead: false,
      createdAt: new Date(),
      replyToMessageId
    });

    await message.save();
    console.log("Saved message:", message);

    // Cập nhật thời gian chat
    chat.updatedAt = new Date();
    await chat.save();

    // Phát sự kiện new_message
    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");
    const populatedMessage = await Message.findOne({ messageId }).populate("senderId", "name avatar");

    emitNewMessage(chat, populatedMessage, io, onlineUsers);

    // Phản hồi
    res.status(201).json({ message: "Đã gửi tin nhắn", messageId });
  } catch (error) {
    console.error("Lỗi gửi tin nhắn:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

exports.getMessages = async (req, res) => {
  const { chatId } = req.params;
  const limit = parseInt(req.query.limit) || 20;
  const skip = parseInt(req.query.skip) || 0;

  try {
    const messages = await Message.find({ chatId })
      .populate("senderId", "_id name avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json(messages.reverse());
  } catch (error) {
    console.error("Lỗi lấy tin nhắn:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.getChatList = async (req, res) => {
  const userId = req.user._id;

  try {
    // Lấy cả chat 1-1 và nhóm chat
    const chats = await Chat.find({ participants: userId })
      .populate("participants", "name avatar")
      .sort({ updatedAt: -1 });

    const chatList = await Promise.all(
      chats.map(async (chat) => {
        const lastMessage = await Message.findOne({ chatId: chat.chatId })
          .sort({ createdAt: -1 })
          .select("content createdAt isRead senderId");

        const hasUnread =
          lastMessage &&
          lastMessage.senderId &&
          lastMessage.senderId.toString() !== userId.toString() &&
          !lastMessage.isRead;

        if (chat.isGroupChat) {
          // Xử lý nhóm chat
          return {
            chatId: chat.chatId,
            name: chat.groupName || "Nhóm không tên",
            avatar: chat.avatar || "https://via.placeholder.com/50",
            lastMessage: lastMessage ? lastMessage.content : "",
            currentUserId: userId,
            participants: chat.participants,
            hasUnread: hasUnread || false,
            isGroupChat: true,
            admins: chat.admins || [], // Thêm danh sách admin
            createdBy: chat.createdBy // Thêm người tạo nhóm
          };
        } else {
          // Xử lý chat 1-1
          const otherParticipant = chat.participants.find(
            (p) => p._id.toString() !== userId.toString()
          );
          return {
            chatId: chat.chatId,
            name: otherParticipant ? otherParticipant.name : "Unknown",
            avatar: otherParticipant?.avatar || "https://via.placeholder.com/50",
            lastMessage: lastMessage ? lastMessage.content : "",
            currentUserId: userId,
            participants: chat.participants,
            hasUnread: hasUnread || false,
            isGroupChat: false,
          };
        }
      })
    );

    res.json({ chats: chatList });
  } catch (error) {
    console.error("Lỗi lấy danh sách chat:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.markAsRead = async (req, res) => {
  const { chatId } = req.body;
  const userId = req.user._id;

  try {
    const updated = await Message.updateMany(
      { chatId, senderId: { $ne: userId }, isRead: false },
      { isRead: true }
    );
    res.json({
      message: "Đã đánh dấu đã đọc",
      modifiedCount: updated.modifiedCount,
    });
  } catch (err) {
    console.error("Lỗi đánh dấu đã đọc:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.testEmojiStorage = async (req, res) => {
  const { content } = req.body;
  const senderId = req.user._id;

  try {
    const messageId = uuidv4();
    const testMessage = new Message({
      messageId,
      chatId: "test-emoji",
      senderId,
      content,
    });

    await testMessage.save();
    const retrievedMessage = await Message.findOne({ messageId });

    res.status(200).json({
      original: content,
      stored: retrievedMessage.content,
      isMatched: content === retrievedMessage.content,
    });
  } catch (error) {
    console.error("Lỗi test emoji:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

exports.recallMessage = async (req, res) => {
  const { messageId } = req.body;
  const userId = req.user?._id;

  try {
    if (!userId) {
      return res.status(401).json({ message: "Không tìm thấy người dùng. Vui lòng đăng nhập lại." });
    }

    const message = await Message.findOne({ messageId });
    if (!message) {
      return res.status(404).json({ message: "Không tìm thấy tin nhắn." });
    }

    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Bạn không có quyền thu hồi tin nhắn này." });
    }

    if (message.isRecalled) {
      return res.status(400).json({ message: "Tin nhắn đã được thu hồi trước đó." });
    }

    message.isRecalled = true;
    message.content = "Tin nhắn đã được thu hồi";
    if (message.fileUrl) {
      message.fileUrl = null; // Xóa fileUrl khi thu hồi
      message.fileName = null; // Xóa fileName khi thu hồi
    }
    await message.save();

    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");
    const chat = await Chat.findOne({ chatId: message.chatId });

    emitNewMessage(chat, message, io, onlineUsers);

    res.status(200).json({ message: "Tin nhắn đã được thu hồi", messageId });
  } catch (error) {
    console.error("Lỗi thu hồi tin nhắn:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};



exports.getChatDetails = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    // Tìm chat theo chatId và đảm bảo user là thành viên
    const chat = await Chat.findOne({ chatId, participants: userId }).populate(
      "participants",
      "_id name avatar"
    );

    if (!chat) {
      return res.status(404).json({ message: "Nhóm không tồn tại hoặc bạn không phải thành viên" });
    }

    // Lấy danh sách admin và creator
    const admins = chat.admins.map((adminId) => adminId.toString());
    const createdBy = chat.createdBy.toString();

    res.status(200).json({
      chatId: chat.chatId,
      groupName: chat.groupName,
      avatar: chat.avatar || "https://via.placeholder.com/50",
      participants: chat.participants,
      admins,
      createdBy,
      isGroupChat: chat.isGroupChat,
    });
  } catch (error) {
    console.error("Lỗi lấy chi tiết nhóm:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

exports.pinMessage = async (req, res) => {
  try {
    console.log("Request body nhận được:", req.body);
    console.log("Headers:", req.headers);
    console.log("User:", req.user);
    
    const { messageId } = req.body;
    const userId = req.user._id;

    // Kiểm tra messageId
    if (!messageId) {
      console.log("Lỗi: messageId bị thiếu");
      return res.status(400).json({ message: "messageId là bắt buộc" });
    }

    console.log("Đang tìm message với messageId:", messageId);
    const message = await Message.findOne({ messageId });
    
    if (!message) {
      console.log("Lỗi: Không tìm thấy message");
      return res.status(404).json({ message: "Không tìm thấy tin nhắn." });
    }

    // Thêm xác định loại tin nhắn
    let type = "text";
    if (message.image) type = "image";
    else if (message.video) type = "video";
    else if (message.fileUrl) type = "file";

    // Đếm số lượng tin nhắn ghim cùng loại
    const pinnedCount = await Message.countDocuments({
      chatId: message.chatId,
      isPinned: true,
      ...(type === "image" && { image: { $ne: null } }),
      ...(type === "video" && { video: { $ne: null } }),
      ...(type === "file" && { fileUrl: { $ne: null } }),
      ...(type === "text" && { image: null, video: null, fileUrl: null }),
    });
    if (pinnedCount >= 3) return res.status(400).json({ message: "Chỉ được ghim tối đa 3 tin nhắn cùng loại." });

    message.isPinned = true;
    message.pinnedAt = new Date();
    message.pinnedBy = userId;
    await message.save();

     const populatedMessage = await Message.findOne({ messageId })
            .populate('senderId', 'name avatar')
            .populate('pinnedBy', 'name avatar');

    // Phát socket cho các client cập nhật giao diện
    const io = req.app.get("io");

    const roomSize = io.sockets.adapter.rooms.get(message.chatId)?.size || 0;
        console.log(`📊 Phòng ${message.chatId} có ${roomSize} người`);

    io.to(message.chatId).emit("message_pinned", {
  messageId: message.messageId,
  senderName: req.user.name,
  content: message.content,
    fileName: message.fileName, 
    chatId: message.chatId,
    pinnedMessage: populatedMessage,
     pinnedBy: {
                _id: req.user._id,
                name: req.user.name,
                avatar: req.user.avatar
            }
});

    res.status(200).json({ message: "Đã ghim tin nhắn", messageId: message.messageId, pinnedBy: req.user.name }
      
    );
  } catch (error) {
    console.error("Lỗi ghim tin nhắn:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.unpinMessage = async (req, res) => {
    try {
        const { messageId } = req.body;

        const message = await Message.findOne({ messageId });
        if (!message) {
            return res.status(404).json({ message: "Không tìm thấy tin nhắn." });
        }

        // Cập nhật trạng thái bỏ ghim
        message.isPinned = false;
        message.pinnedAt = null;
        message.pinnedBy = null;
        await message.save();

        // **QUAN TRỌNG: Gửi đến TẤT CẢ client trong phòng chat**
        const io = req.app.get("io");
        const roomSize = io.sockets.adapter.rooms.get(message.chatId)?.size || 0;
        
        io.to(message.chatId).emit("message_unpinned", {
            messageId: message.messageId,
            chatId: message.chatId,
            unpinnedBy: {
                _id: req.user._id,
                name: req.user.name,
                avatar: req.user.avatar
            }
        });

        console.log(`✅ Đã gửi message_unpinned đến ${roomSize} client trong phòng: ${message.chatId}`);

        res.status(200).json({
            message: "Đã bỏ ghim tin nhắn",
            messageId: message.messageId
        });
    } catch (error) {
        console.error("Lỗi bỏ ghim tin nhắn:", error);
        res.status(500).json({ message: "Lỗi server" });
    }
};


// Lấy danh sách tin nhắn ghim của 1 chat
exports.getPinnedMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const pinnedMessages = await Message.find({ chatId, isPinned: true })
      .populate('senderId', 'name avatar')
      .populate('pinnedBy', 'name avatar')
      .sort({ pinnedAt: -1 });
    res.status(200).json({ pinnedMessages });
  } catch (error) {
    console.error("Lỗi lấy tin nhắn ghim:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};