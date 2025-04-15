const Chat = require("../models/chat.model");
const friendship = require("../models/friendship.model");
const Message = require("../models/message.model");
const { v4: uuidv4 } = require("uuid");
const { emitNewMessage } = require("../services/socket.service");
const s3 = require('../config/aws');
const cloudinary = require('../config/cloudinary');

exports.sendMessage = async (req, res) => {
  try {
    const senderId = req.user?._id;
    const { chatId, content, receiverId } = req.body;
    let imageUrl = null;
    let videoUrl = null;

    console.log("Request body:", req.body);
    console.log("Request files:", req.files);

    if (!senderId) return res.status(401).json({ message: "Vui lòng đăng nhập lại." });
    if (!chatId) return res.status(400).json({ message: "Thiếu chatId." });
    if ((!content || content.trim() === "") && !req.files?.image && !req.files?.video) {
      return res.status(400).json({ message: "Tin nhắn hoặc tệp không được để trống." });
    }

    let chat = await Chat.findOne({ chatId });
    if (!chat) return res.status(404).json({ message: "Chat không tồn tại." });

    // Xử lý ảnh
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

    // Xử lý video
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

    const contentToSave = content && content.trim() !== "" ? content : (videoUrl ? "[Video]" : imageUrl ? "[Image]" : "");

    const messageId = uuidv4();
    const message = new Message({
      messageId,
      chatId,
      senderId,
      content: contentToSave,
      image: imageUrl,
      video: videoUrl,
    });

    await message.save();
    console.log("Saved message:", message);

    chat.updatedAt = new Date();
    await chat.save();

    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");
    const populatedMessage = await Message.findOne({ messageId }).populate("senderId", "name avatar");

    emitNewMessage(chat, populatedMessage, io, onlineUsers);

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
      .populate("senderId", "name avatar")
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
    const chats = await Chat.find({
      participants: userId,
      isGroupChat: false,
    })
      .populate("participants", "name avatar")
      .sort({ updatedAt: -1 });

    const chatList = await Promise.all(
      chats.map(async (chat) => {
        const otherParticipant = chat.participants.find(
          (p) => p._id.toString() !== userId.toString()
        );
        const lastMessage = await Message.findOne({ chatId: chat.chatId })
          .sort({ createdAt: -1 })
          .select("content createdAt isRead senderId");

        const hasUnread =
          lastMessage &&
          lastMessage.senderId &&
          lastMessage.senderId.toString() !== userId.toString() &&
          !lastMessage.isRead;

        return {
          chatId: chat.chatId,
          name: otherParticipant ? otherParticipant.name : "Unknown",
          avatar: otherParticipant?.avatar || "https://via.placeholder.com/50",
          lastMessage: lastMessage ? lastMessage.content : "",
          currentUserId: userId,
          participants: chat.participants,
          hasUnread: hasUnread || false,
        };
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

exports.sendFile = async (req, res) => {
  try {
    const { chatId, receiverId } = req.body;

    console.log("Request body:", req.body); // Debug
    console.log("Request file:", req.file); // Debug

    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Không tìm thấy người dùng. Vui lòng đăng nhập lại." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Vui lòng gửi một tệp." });
    }

    const fileId = uuidv4();
    const fileName = req.file.originalname;
    const fileKey = `chat-files/${fileId}-${fileName}`;

    const params = {
      Bucket: "app-chat-cnm",
      Key: fileKey,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };

    const uploadResult = await s3.upload(params).promise();
    console.log("File uploaded to S3:", uploadResult.Location); // Debug

    const newMessage = new Message({
      messageId: uuidv4(),
      chatId,
      senderId: req.user._id,
      content: fileName,
      fileUrl: uploadResult.Location,
      fileName,
      isDelivered: false,
      isRead: false,
      createdAt: new Date(),
    });

    await newMessage.save();
    console.log("Saved message:", newMessage); // Debug

    req.app.get("io").to(chatId).emit("new_message", { message: newMessage });

    res.status(200).json(newMessage);
  } catch (error) {
    console.error("Lỗi gửi tệp:", error);
    res.status(500).json({ message: "Không thể gửi tệp." });
  }
};