const Chat = require("../models/chat.model");
const friendship = require("../models/friendship.model");
const Message = require("../models/message.model");
const { v4: uuidv4 } = require("uuid");
const { emitNewMessage } = require("../services/socket.service");
const cloudinary = require("cloudinary").v2;

exports.sendMessage = async (req, res) => {
  try {
    const senderId = req.user?._id;
    const { chatId, content, image, video } = req.body;

    if (!senderId) return res.status(401).json({ message: "Vui lòng đăng nhập lại." });
    if ((!content || content.trim() === "") && !image && !video) {
      return res.status(400).json({ message: "Tin nhắn không được để trống" });
    }

    let chat = await Chat.findOne({ chatId });
    if (!chat) return res.status(404).json({ message: "Chat không tồn tại" });

    let imageUrl, videoUrl;

    if (image) {
      const uploadRes = await cloudinary.uploader.upload(image);
      imageUrl = uploadRes.secure_url;
    }

    if (video) {
      const uploadRes = await cloudinary.uploader.upload(video, { resource_type: "video" });
      videoUrl = uploadRes.secure_url;
    }

    const contentToSave = content && content.trim() !== "" ? content : (video ? "[Video]" : "");

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

// chat.controller.js
exports.getChatList = async (req, res) => {
  const userId = req.user._id;
  console.log("Đang lấy danh sách chat cho userId:", userId); // Thêm log
  try {
    const chats = await Chat.find({
      participants: userId,
      isGroupChat: false,
    })
      .populate("participants", "name avatar")
      .sort({ updatedAt: -1 });

    console.log("Danh sách chat tìm thấy:", chats); // Log dữ liệu tìm thấy
    const chatList = await Promise.all(
      chats.map(async (chat) => {
        const otherParticipant = chat.participants.find(
          (p) => p._id.toString() !== userId.toString()
        );
        const lastMessage = await Message.findOne({ chatId: chat.chatId })
          .sort({ createdAt: -1 })
          .select("content createdAt");

        return {
          chatId: chat.chatId,
          name: otherParticipant ? otherParticipant.name : "Unknown",
          avatar: otherParticipant?.avatar || "https://via.placeholder.com/50",
          lastMessage: lastMessage ? lastMessage.content : "",
          currentUserId: userId,
          participants: chat.participants,
        };
      })
    );

    console.log("Danh sách chat trả về:", chatList); // Log dữ liệu trả về
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

// Thêm vào chat.controller.js
exports.testEmojiStorage = async (req, res) => {
  const { content } = req.body;
  const senderId = req.user._id;

  try {
    // Tạo tin nhắn test với emoji
    const messageId = uuidv4();
    const testMessage = new Message({
      messageId,
      chatId: "test-emoji",
      senderId,
      content,
    });

    await testMessage.save();

    // Truy xuất tin nhắn để kiểm tra
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
