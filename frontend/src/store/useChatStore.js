// useChatStore.js
import { create } from "zustand";
import axios from '../lib/axios'

export const useChatStore = create((set, get) => ({
  chats: [],
  selectedChat: null,
  messages: [],
  isChatsLoading: false,
  isMessagesLoading: false,
  error: null,
  
  // Lấy danh sách chat
  fetchChatList: async () => {
    set({ isChatsLoading: true, error: null });
    try {
      console.log("Đang gọi API lấy danh sách chat");
      const response = await axios.get("/chat/list");
      console.log("Kết quả API chat list:", response.data);
      set({ chats: response.data.chats, isChatsLoading: false });
    } catch (error) {
      console.error("Lỗi khi lấy danh sách chat:", error);
      set({
        error: error.response?.data?.message || "Lỗi khi lấy danh sách chat",
        isChatsLoading: false,
      });
    }
  },
  
  // Chọn một chat
  selectChat: (chat) => {
    set({ selectedChat: chat });
  },
  
  // Lấy tin nhắn của một chat
  getMessages: async (chatId) => {
    set({ isMessagesLoading: true, error: null });
    try {
      console.log(`Đang lấy tin nhắn cho chatId: ${chatId}`);
      const response = await axios.get(`/chat/messages/${chatId}?limit=50&skip=0`);
      console.log("Kết quả API messages:", response.data);
      set({ messages: response.data, isMessagesLoading: false });
    } catch (error) {
      console.error("Lỗi khi lấy tin nhắn:", error);
      set({
        error: error.response?.data?.message || "Lỗi khi lấy tin nhắn",
        isMessagesLoading: false,
        messages: [],
      });
    }
  },
  
  // Gửi tin nhắn
  // Trong useChatStore.js, cập nhật hàm sendMessage

  sendMessage: async ({ chatId, content, image, video }) => {
    const tempId = `temp-${Date.now()}`;
    const tempMessage = {
      messageId: tempId,
      chatId,
      content,
      image,
      video,
      senderId: {
        _id: localStorage.getItem("userId"),
        name: localStorage.getItem("userName") || "Tôi",
        avatar: localStorage.getItem("userAvatar") || "https://via.placeholder.com/50"
      },
      createdAt: new Date().toISOString(),
      isRead: false,
      isPending: true,
    };
  
    const { messages } = get();
    set({ messages: [...messages, tempMessage] });
  
    try {
      const response = await axios.post("/chat/send", { chatId, content, image, video });
      // Xóa tin nhắn tạm thời, tin nhắn thật sẽ được nhận qua socket
      const updatedMessages = get().messages.filter(msg => msg.messageId !== tempId);
      set({ messages: updatedMessages });
      return response.data;
    } catch (error) {
      const updatedMessages = get().messages.map(msg =>
        msg.messageId === tempId
          ? { ...msg, isError: true, isPending: false }
          : msg
      );
      set({ messages: updatedMessages });
      throw error;
    }
  },
  

// Cập nhật hàm addMessage để xử lý tin nhắn mới từ socket
addMessage: (message) => {
  const { messages, selectedChat, chats } = get();

  // Kiểm tra xem tin nhắn đã tồn tại trong state chưa
  const messageExists = messages.some(m => m.messageId === message.messageId);

  // Chỉ thêm tin nhắn vào state nếu thuộc về chat đang được chọn và chưa tồn tại
  if (selectedChat && message.chatId === selectedChat.chatId && !messageExists) {
    set({ messages: [...messages, message] });
  }

  // Cập nhật tin nhắn mới nhất trong danh sách chat
  const updatedChats = chats.map(chat => {
    if (chat.chatId === message.chatId) {
      // Nếu tin nhắn có video, hiển thị thông báo thay vì nội dung text
      const lastMessageText = message.video
        ? "Đã gửi một video"
        : message.content || "";

      return {
        ...chat,
        lastMessage: lastMessageText,
        updatedAt: message.createdAt // Cập nhật thời gian
      };
    }
    return chat;
  });

  // Sắp xếp lại danh sách chat theo thời gian cập nhật mới nhất
  updatedChats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  set({ chats: updatedChats });
},

  
  // Đánh dấu tin nhắn đã đọc
  markMessagesAsRead: async (chatId) => {
    try {
      await axios.post("/chat/mark-as-read", { chatId });
      
      // Cập nhật trạng thái tin nhắn trong state
      const { messages } = get();
      const updatedMessages = messages.map(message => {
        if (message.chatId === chatId) {
          return { ...message, isRead: true };
        }
        return message;
      });
      
      set({ messages: updatedMessages });
    } catch (error) {
      console.error("Lỗi khi đánh dấu tin nhắn đã đọc:", error);
    }
  },
}));
