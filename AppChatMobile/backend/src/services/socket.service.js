const Message = require("../models/message.model");

exports.emitNewMessage = async (chat, populatedMessage, io, onlineUsers) => {
  chat.participants.forEach(async (participantId) => {
    const socketId = onlineUsers.get(participantId.toString());

    if (socketId) {
      io.to(socketId).emit("new_message", { message: populatedMessage });

      // Đánh dấu isDelivered = true nếu không phải người gửi
      if (participantId.toString() !== populatedMessage.senderId._id.toString()) {
        await Message.updateOne({ messageId: populatedMessage.messageId }, { isDelivered: true });
      }
    }
  });
};