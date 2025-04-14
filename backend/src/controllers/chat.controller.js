const Chat = require("../models/chat.model");
const friendship = require("../models/friendship.model");
const Message = require("../models/message.model");
const { v4: uuidv4 } = require("uuid");

exports.sendMessage = async (req, res) => {
    const senderId = req.user?._id; // Kiểm tra req.user tồn tại
    const { chatId, content, receiverId } = req.body;
  
    try {
      // Kiểm tra senderId
      if (!senderId) {
        return res.status(401).json({ message: "Không tìm thấy người dùng. Vui lòng đăng nhập lại." });
      }
  
      let targetChatId = chatId;
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
        let chat = await Chat.findOne({
          participants: { $all: [senderId, receiverId] },
          isGroupChat: false,
        });
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
      }
  
      const messageId = uuidv4();
      const message = new Message({
        messageId,
        chatId: targetChatId,
        senderId,
        content,
      });
      await message.save();
  
      const io = req.app.get("io");
      const onlineUsers = req.app.get("onlineUsers");
      const chat = await Chat.findOne({ chatId: targetChatId });
      const populatedMessage = await Message.findOne({ messageId })
        .populate("senderId", "name avatar"); // Populate senderId để khớp với API getMessages
  
      chat.participants.forEach((participantId) => {
        const socketId = onlineUsers.get(participantId.toString());
        if (socketId) {
          io.to(socketId).emit("new_message", {
            message: populatedMessage, // Gửi dữ liệu đã populate
          });
        }
      });
  
      res.status(201).json({ message: "Đã gửi tin nhắn", messageId });
    } catch (error) {
      console.error("Lỗi gửi tin nhắn:", error);
      res.status(500).json({ message: "Lỗi server", error: error.message });
    }
  };

  exports.getMessages = async (req, res) => {
    const { chatId } = req.params;
    try {
      const messages = await Message.find({ chatId })
        .populate("senderId", "name avatar")
        .sort({ createdAt: 1 });
      res.json(messages);
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
        isGroupChat: false, // Chỉ lấy chat 1-1
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