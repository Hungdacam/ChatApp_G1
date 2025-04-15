// useSocketStore.js
import { io } from "socket.io-client";
import { create } from "zustand";
import { useChatStore } from "./useChatStore";
export const useSocketStore = create((set) => ({
  socket: null,
  onlineUsers: [], // Thêm trạng thái onlineUsers

  connectSocket: (token, userId) => {
    console.log("Đang kết nối socket với token:", token ? "Có token" : "Không có token");
    console.log("userId:", userId);
    // Kiểm tra nếu socket đã kết nối thì bỏ qua
    if (useSocketStore.getState().socket?.connected) {
      console.log("Socket đã kết nối, bỏ qua kết nối mới");
      return;
    }

    const socket = io("http://localhost:3000", {
      withCredentials: true, // Gửi cookie trong kết nối socket
      transports: ["websocket"],
      auth: { token, userId }, // Gửi token và userId trong auth
    });

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
      if (userId) {
        socket.emit("register", userId);
        console.log(`📤 Gửi register với userId: ${userId}`);
      } else {
        console.warn("Không có userId để đăng ký socket");
      }
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err.message);
    });

    socket.on("disconnect", () => {
      console.log("Socket ngắt kết nối");
      set({ onlineUsers: [] }); // Reset onlineUsers khi ngắt kết nối
    });

    socket.on("new_message", (data) => {
      const updatedMessage = {
        ...data.message,
        image: data.message.imageUrl, // Chuyển từ URL tạm sang URL thật
        video: data.message.videoUrl,
        fileUrl: data.message.fileUrl
      };
      useChatStore.getState().addMessage(updatedMessage);
      
      // Cập nhật lại danh sách chat nếu cần
      const { chats, fetchChatList } = useChatStore.getState();
      if (chats.length === 0) {
        fetchChatList();
      }
    });
    
    
    socket.on("message_delivered", ({ messageId }) => {
      console.log("Tin nhắn đã được gửi:", messageId);
      // Cập nhật trạng thái đã gửi của tin nhắn nếu cần
    });
    
    socket.on("message_read", ({ chatId, messageId }) => {
      console.log("Tin nhắn đã được đọc:", messageId);
      // Cập nhật trạng thái đã đọc của tin nhắn
      const { messages } = useChatStore.getState();
      const updatedMessages = messages.map(message => {
        if (message.messageId === messageId) {
          return { ...message, isRead: true };
        }
        return message;
      });
      
      useChatStore.setState({ messages: updatedMessages });
    });
    set({ socket });
  },

  disconnectSocket: () => {
    set((state) => {
      if (state.socket) {
        state.socket.disconnect();
        console.log("Socket đã ngắt kết nối thủ công");
      }
      return { socket: null, onlineUsers: [] }; // Reset cả socket và onlineUsers
    });
  },

  setOnlineUsers: (users) => {
    set({ onlineUsers: users });
  },
}));
