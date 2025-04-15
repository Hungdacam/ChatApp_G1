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
    // Tạo tin nhắn tạm thời với ID tạm
    const tempId = `temp-${Date.now()}`;
    const userId = localStorage.getItem("userId");
    
    // Tạo FormData để gửi file
    const formData = new FormData();
    formData.append("chatId", chatId);
    if (content) formData.append("content", content);
    if (image) formData.append("image", image);
    if (video) formData.append("video", video);
    
    // Tạo tin nhắn tạm thời để hiển thị ngay
    const tempMessage = {
      messageId: tempId,
      chatId,
      content: content || "",
      senderId: {
        _id: userId,
        name: localStorage.getItem("userName") || "Tôi",
        avatar: localStorage.getItem("userAvatar") || "https://via.placeholder.com/50"
      },
      createdAt: new Date().toISOString(),
      isRead: false,
      isPending: true,
    };
    
    // Thêm preview ảnh hoặc video vào tin nhắn tạm thời nếu có
    if (image) {
      const reader = new FileReader();
      reader.onloadend = () => {
        tempMessage.image = reader.result;
        // Cập nhật tin nhắn tạm thời với preview ảnh
        const { messages } = get();
        const updatedMessages = messages.map(msg => 
          msg.messageId === tempId ? { ...msg, image: reader.result } : msg
        );
        set({ messages: updatedMessages });
      };
      reader.readAsDataURL(image);
    }
    
    if (video) {
      const reader = new FileReader();
      reader.onloadend = () => {
        tempMessage.video = reader.result;
        // Cập nhật tin nhắn tạm thời với preview video
        const { messages } = get();
        const updatedMessages = messages.map(msg => 
          msg.messageId === tempId ? { ...msg, video: reader.result } : msg
        );
        set({ messages: updatedMessages });
      };
      reader.readAsDataURL(video);
    }
    
    // Thêm tin nhắn tạm thời vào state
    const { messages } = get();
    set({ messages: [...messages, tempMessage] });
    
    try {
      // Gửi tin nhắn lên server
      const response = await axios.post("/chat/send", formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log("Kết quả gửi tin nhắn:", response.data);
      
      // Cập nhật tin nhắn tạm thời thành tin nhắn thật
      // Lưu ý: Tin nhắn thật sẽ được nhận qua socket, nên chúng ta chỉ cần xóa tin nhắn tạm
      const updatedMessages = get().messages.filter(msg => msg.messageId !== tempId);
      set({ messages: updatedMessages });
      
      return response.data;
    } catch (error) {
      console.error("Lỗi khi gửi tin nhắn:", error);
      
      // Đánh dấu tin nhắn lỗi
      const updatedMessages = get().messages.map(msg =>
        msg.messageId === tempId
          ? { ...msg, isError: true, isPending: false }
          : msg
      );
      set({ messages: updatedMessages });
      
      throw error;
    }
  },
  
  // Thêm hàm mới để gửi file
  sendFile: async ({ chatId, file }) => {
    // Tạo tin nhắn tạm thời với ID tạm
    const tempId = `temp-${Date.now()}`;
    const userId = localStorage.getItem("userId");
    
    // Tạo FormData để gửi file
    const formData = new FormData();
    formData.append("chatId", chatId);
    formData.append("file", file);
    
    // Tạo tin nhắn tạm thời để hiển thị ngay
    const tempMessage = {
      messageId: tempId,
      chatId,
      senderId: {
        _id: userId,
        name: localStorage.getItem("userName") || "Tôi",
        avatar: localStorage.getItem("userAvatar") || "https://via.placeholder.com/50"
      },
      fileName: file.name,
      fileSize: file.size,
      createdAt: new Date().toISOString(),
      isRead: false,
      isPending: true,
    };
    
    // Thêm tin nhắn tạm thời vào state
    const { messages } = get();
    set({ messages: [...messages, tempMessage] });
    
    try {
      // Gửi file lên server
      const response = await axios.post("/chat/send-file", formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log("Kết quả gửi file:", response.data);
      
      // Cập nhật tin nhắn tạm thời thành tin nhắn thật
      // Lưu ý: Tin nhắn thật sẽ được nhận qua socket, nên chúng ta chỉ cần xóa tin nhắn tạm
      const updatedMessages = get().messages.filter(msg => msg.messageId !== tempId);
      set({ messages: updatedMessages });
      
      return response.data;
    } catch (error) {
      console.error("Lỗi khi gửi file:", error);
      
      // Đánh dấu tin nhắn lỗi
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
      return {
        ...chat,
        lastMessage: message.content,
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
