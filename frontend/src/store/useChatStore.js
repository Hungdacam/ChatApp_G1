import { create } from "zustand";
import axios from '../lib/axios'

export const useChatStore = create((set, get) => ({
  chats: [],
  selectedChat: null,
  messages: [],
  isChatsLoading: false,
  isMessagesLoading: false,
  error: null,
  hasAttemptedInitialFetch: false,
  
  fetchChatList: async () => {
    if (get().isChatsLoading || get().hasAttemptedInitialFetch) return;
    
    set({ isChatsLoading: true, error: null });
    try {
      console.log("Đang gọi API lấy danh sách chat");
      const response = await axios.get("/chat/list");
      console.log("Kết quả API chat list:", response.data);
      
      set({ 
        chats: response.data.chats, 
        isChatsLoading: false,
        hasAttemptedInitialFetch: true 
      });
    } catch (error) {
      console.error("Lỗi khi lấy danh sách chat:", error);
      set({
        error: error.response?.data?.message || "Lỗi khi lấy danh sách chat",
        isChatsLoading: false,
        hasAttemptedInitialFetch: true
      });
    }
  },

  setHasAttemptedFetch: (value) => set({ hasAttemptedFetch: value }),
  
  selectChat: (chat) => {
    set({ selectedChat: chat });
  },
  
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
  
  sendMessage: async ({ chatId, content, image, video }) => {
    const tempId = `temp-${Date.now()}`;
    const userId = localStorage.getItem("userId");
    
    const formData = new FormData();
    formData.append("chatId", chatId);
    if (content) formData.append("content", content);
    if (image) formData.append("image", image);
    if (video) formData.append("video", video);
    
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
      isTemp: true, // Thêm flag để đánh dấu đây là tin nhắn tạm thời
      isPending: true,
      status: 'PENDING'
    };
    
    try {
      if (image) {
        tempMessage.image = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(image);
        });
        if (!content) tempMessage.content = "[Image]";
      }
      
      if (video) {
        tempMessage.video = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(video);
        });
        if (!content) tempMessage.content = "[Video]";
      }
      
      const { messages } = get();
      const existingSimilarMsg = messages.find(msg => 
        msg.content === tempMessage.content && 
        msg.senderId._id === tempMessage.senderId._id &&
        !msg.isPending && 
        Math.abs(new Date(msg.createdAt) - new Date(tempMessage.createdAt)) < 5000
      );
      
      if (!existingSimilarMsg) {
        set({ messages: [...messages, tempMessage] });
      }
      
      const response = await axios.post("/chat/send", formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      const serverMessage = response.data;
      // Cập nhật tin nhắn tạm thời với messageId thực tế từ server
      const updatedMessages = get().messages.filter(msg => msg.messageId !== tempId);
      const completeServerMessage = {
        ...serverMessage,
        status: 'SENT',
        _processed: true // Đánh dấu đã xử lý để tránh trùng lặp
      };
      set({ messages: [...updatedMessages, completeServerMessage] });
      serverMessage._processed = true;
      return response.data;
    } catch (error) {
      console.error("Lỗi khi gửi tin nhắn:", error);
      
      const { messages } = get();
      const updatedMessages = messages.map(msg =>
        msg.messageId === tempId
          ? { ...msg, isError: true, isPending: false }
          : msg
      );
      set({ messages: updatedMessages });
      
      throw error;
    }
  },
  
  sendFile: async ({ chatId, file }) => {
    const tempId = `temp-${Date.now()}`;
    const userId = localStorage.getItem("userId");
    
    const formData = new FormData();
    formData.append("chatId", chatId);
    formData.append("file", file);
    
    const tempMessage = {
      messageId: tempId,
      chatId,
      senderId: {
        _id: userId,
        name: localStorage.getItem("userName") || "Tôi",
        avatar: localStorage.getItem("userAvatar") || "https://via.placeholder.com/50"
      },
      content: file.name,
      fileName: file.name,
      fileSize: file.size,
      createdAt: new Date().toISOString(),
      isRead: false,
      isPending: true,
    };
    
    const { messages } = get();
    set({ messages: [...messages, tempMessage] });
    
    try {
      const response = await axios.post("/chat/send-file", formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log("Kết quả gửi file:", response.data);
      
      const serverMessage = response.data;
      const updatedMessages = get().messages.map(msg => 
        msg.messageId === tempId 
          ? { 
              ...serverMessage, 
              messageId: serverMessage.messageId,
              fileName: serverMessage.fileName || file.name,
              fileSize: file.size,
              fileUrl: serverMessage.fileUrl,
              isPending: false
            } 
          : msg
      );
      
      set({ messages: updatedMessages });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi gửi file:", error);
      
      const updatedMessages = get().messages.map(msg =>
        msg.messageId === tempId
          ? { ...msg, isError: true, isPending: false }
          : msg
      );
      set({ messages: updatedMessages });
      
      throw error;
    }
  },

  addMessage: (message) => {
    const { messages, selectedChat, chats, getMessages } = get();
    const userId = localStorage.getItem("userId");
    const hasContent = message.content || message.image || message.video || message.fileUrl;
    
    if (!hasContent && selectedChat && message.chatId === selectedChat.chatId) {
      console.warn("Tin nhắn thiếu nội dung, gọi lại getMessages:", message);
      getMessages(message.chatId);
      return;
    }
    // Kiểm tra xem tin nhắn này có phải do người dùng hiện tại gửi không
  const isSentByCurrentUser = message.senderId && message.senderId._id === userId;
  
  // Tìm tin nhắn trùng lặp hoặc tin nhắn tạm thời tương ứng
  const existingMsgIndex = messages.findIndex(m => 
    // Kiểm tra trùng ID
    (m.messageId === message.messageId && message.messageId) || 
    (m._id === message._id && message._id) ||
    // Kiểm tra tin nhắn tạm thời
    (isSentByCurrentUser && 
     m.content === message.content && 
     m.senderId._id === message.senderId._id &&
     Math.abs(new Date(m.createdAt) - new Date(message.createdAt)) < 10000 &&
     (m.isPending || m.messageId.startsWith('temp-')))
  );
    
    let updatedMessages = [...messages];
    
    if (existingMsgIndex !== -1) {
      // Cập nhật tin nhắn nếu đã tồn tại, nhưng không thêm mới
      updatedMessages[existingMsgIndex] = {
        ...updatedMessages[existingMsgIndex],
        ...message,
        image: message.image || updatedMessages[existingMsgIndex].image,
        video: message.video || updatedMessages[existingMsgIndex].video,
        fileUrl: message.fileUrl || updatedMessages[existingMsgIndex].fileUrl,
        fileName: message.fileName || updatedMessages[existingMsgIndex].fileName,
        fileSize: updatedMessages[existingMsgIndex].fileSize,
        isPending: false,
        isError: false
      };
    } else if (selectedChat && message.chatId === selectedChat.chatId) {
      // Thêm tin nhắn mới nếu không trùng
      updatedMessages = [...messages, message];
    }
    
    set({ messages: updatedMessages });

    const updatedChats = chats.map(chat => {
      if (chat.chatId === message.chatId) {
        return {
          ...chat,
          lastMessage: message.content || "[Media]",
          updatedAt: message.createdAt
        };
      }
      return chat;
    });

    const sortedChats = [...updatedChats].sort((a, b) => {
      const timeA = new Date(a.updatedAt || 0).getTime();
      const timeB = new Date(b.updatedAt || 0).getTime();
      return timeB - timeA;
    });

    set({ chats: sortedChats });
  },

  markMessagesAsRead: async (chatId) => {
    try {
      await axios.post("/chat/mark-as-read", { chatId });
      
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

  refreshChatList: async (force = false) => {
    if (get().isChatsLoading && !force) return;
    
    set({ isChatsLoading: true, error: null });
    try {
      console.log("Đang làm mới danh sách chat");
      const response = await axios.get("/chat/list");
      
      const currentChats = get().chats;
      const newChats = response.data.chats;
      
      const sortedChats = [...newChats].sort((a, b) => {
        const timeA = new Date(a.updatedAt || 0).getTime();
        const timeB = new Date(b.updatedAt || 0).getTime();
        return timeB - timeA;
      });
      
      if (JSON.stringify(currentChats) !== JSON.stringify(sortedChats)) {
        set({ chats: sortedChats, isChatsLoading: false, hasAttemptedInitialFetch: true });
      } else {
        set({ isChatsLoading: false, hasAttemptedInitialFetch: true });
      }
    } catch (error) {
      console.error("Lỗi khi làm mới danh sách chat:", error);
      set({
        error: error.response?.data?.message || "Lỗi khi làm mới danh sách chat",
        isChatsLoading: false,
        hasAttemptedInitialFetch: true
      });
    }
  },
}));