const Chat = require("../models/chat.model");
const friendship = require("../models/friendship.model");
const Message = require("../models/message.model");
const { v4: uuidv4 } = require("uuid");
const { emitNewMessage } = require("../services/socket.service");

exports.sendMessage = async (req, res) => {
  const senderId = req.user?._id;
  const { chatId, content, receiverId } = req.body;

  try {
    if (!senderId) {
      return res.status(401).json({ message: "Không tìm thấy người dùng. Vui lòng đăng nhập lại." });
    }

    if (!content || content.trim() === "") {
      return res.status(400).json({ message: "Nội dung tin nhắn không được để trống" });
    }

    let targetChatId = chatId;
    let chat;

    if (!chatId) {
      const friendShip = await friendship.findOne({
        $or: [
          { userId1: senderId, userId2: receiverId, status: "accepted" },
          { userId2: senderId, userId1: receiverId, status: "accepted" },
        ],
      });

      if (!friendShip) {
        return res.status(403).json({ message: "Chỉ bạn bè mới có thể nhắn tin" });
      }

      chat = await Chat.findOneToOneChat(senderId, receiverId);
      if (!chat) {
        targetChatId = uuidv4();
        chat = new Chat({
          chatId: targetChatId,
          participants: [senderId, receiverId],
          isGroupChat: false,
        });
        await chat.save();
      } else {
        targetChatId = chat.chatId;
      }
    } else {
      chat = await Chat.findOne({ chatId });
    }

    const messageId = uuidv4();
    const message = new Message({
      messageId,
      chatId: targetChatId,
      senderId,
      content,
    });
    await message.save();

    // Cập nhật thời gian hoạt động
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
    res.json({ message: "Đã đánh dấu đã đọc", modifiedCount: updated.modifiedCount });
  } catch (err) {
    console.error("Lỗi đánh dấu đã đọc:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};
