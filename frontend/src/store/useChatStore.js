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
  // Thêm các state mới cho chat nhóm
  isCreatingGroup: false,
  isAddingMember: false,
  isRemovingMember: false,
  compareIds : (id1, id2) => {
    if (!id1 || !id2) return false;
    
    // Chuyển đổi thành chuỗi để so sánh
    const str1 = typeof id1 === 'object' && id1._id ? id1._id.toString() : id1.toString();
    const str2 = typeof id2 === 'object' && id2._id ? id2._id.toString() : id2.toString();
    
    return str1 === str2;
  },
  
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
    if (!chat || !chat.chatId) {
      console.error("Không thể chọn chat không hợp lệ:", chat);
      return;
    }
    
    const { chats } = get();
    
    // Lọc bỏ các phần tử undefined trước khi tìm kiếm
    const validChats = chats.filter(c => c !== undefined && c !== null);
    
    // Tìm chat đầy đủ từ danh sách chats
    const fullChat = validChats.find(c => c.chatId === chat.chatId) || chat;
    axios.get(`/chat/${chat.chatId}`)
    .then(response => {
      if (response.data && response.data.chat) {
        set({ selectedChat: response.data.chat });
      } else {
        set({ selectedChat: fullChat });
      }
    })
    .catch(() => {
      set({ selectedChat: fullChat });
    });
    console.log("Selecting chat:", fullChat);
    console.log("createdBy:", fullChat.createdBy);
    console.log("admins:", fullChat.admins);
    
    set({ selectedChat: fullChat });
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
      
      const { selectedChat } = get();
  
  const sortedChats = [...newChats].sort((a, b) => {
    const timeA = new Date(a.updatedAt || 0).getTime();
    const timeB = new Date(b.updatedAt || 0).getTime();
    return timeB - timeA;
  });
  
  // Cập nhật selectedChat nếu nó tồn tại trong danh sách mới
  let updatedSelectedChat = selectedChat;
  if (selectedChat) {
    const freshSelectedChat = sortedChats.find(c => c.chatId === selectedChat.chatId);
    if (freshSelectedChat) {
      updatedSelectedChat = freshSelectedChat;
    }
  }
  
  if (JSON.stringify(currentChats) !== JSON.stringify(sortedChats)) {
    set({ 
      chats: sortedChats, 
      selectedChat: updatedSelectedChat,
      isChatsLoading: false, 
      hasAttemptedInitialFetch: true 
    });
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
  
  createGroup: async (groupName, memberIds, avatar) => {
    set({ isCreatingGroup: true, error: null });
    try {
      const formData = new FormData();
      formData.append('groupName', groupName);
      formData.append('memberIds', JSON.stringify(memberIds));
      if (avatar) {
        formData.append('avatar', avatar);
      }

      const response = await axios.post("/group/create", formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log("Kết quả tạo nhóm:", response.data);
      
     
       // Sử dụng chat đầy đủ từ response nếu có
      const newGroup = response.data.chat || {
        chatId: response.data.chatId,
        groupName: groupName,
        avatar: response.data.avatar,
        participants: [...memberIds, localStorage.getItem("userId")],
        isGroupChat: true,
        createdBy: localStorage.getItem("userId"),
        admins: [localStorage.getItem("userId")],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
       // Đảm bảo nhóm có thuộc tính isGroupChat
      newGroup.isGroupChat = true;

       // Cập nhật danh sách chat với nhóm mới
       const { chats } = get();
      // Kiểm tra xem nhóm đã tồn tại trong danh sách chưa
      const existingChat = chats.find(chat => chat.chatId === newGroup.chatId);
      
      if (!existingChat) {
        // Chỉ thêm vào nếu chưa tồn tại
        set({
          chats: [newGroup, ...chats],
          selectedChat: newGroup,
          isCreatingGroup: false
        });
      } else {
        // Nếu đã tồn tại, chỉ cập nhật selectedChat
        set({
          selectedChat: existingChat,
          isCreatingGroup: false
        });
      }
      
      return newGroup;
    } catch (error) {
      console.error("Lỗi khi tạo nhóm:", error);
      set({
        error: error.response?.data?.message || "Lỗi khi tạo nhóm",
        isCreatingGroup: false
      });
      throw error;
    }
  },
  // Thêm hàm kiểm tra quyền admin
  isUserAdmin: (chatId, userId) => {
    const { chats } = get();
    const chat = chats.find(c => c.chatId === chatId);
    
    if (!chat) return false;
    
    // Kiểm tra nếu là người tạo nhóm
    if (chat.createdBy) {
      if (typeof chat.createdBy === 'object' && chat.createdBy._id) {
        if (chat.createdBy._id.toString() === userId.toString()) {
          return true;
        }
      } else if (typeof chat.createdBy === 'string') {
        if (chat.createdBy === userId) {
          return true;
        }
      } else {
        if (chat.createdBy.toString() === userId.toString()) {
          return true;
        }
      }
    }
    
    // Kiểm tra trong danh sách admin
    if (chat.admins && Array.isArray(chat.admins)) {
      return chat.admins.some(adminId => {
        if (typeof adminId === 'object' && adminId._id) {
          return adminId._id.toString() === userId.toString();
        }
        return typeof adminId === 'string' ? 
          adminId === userId : 
          adminId.toString() === userId.toString();
      });
    }
    
    return false;
  },
  addGroupMember: async (chatId, userId) => {
    set({ isAddingMember: true, error: null });
    try {
      const currentUserId = localStorage.getItem("userId");
      
      // Kiểm tra quyền admin
      if (!get().isUserAdmin(chatId, currentUserId)) {
        throw new Error("Bạn không có quyền thêm thành viên vào nhóm này");
      }
      
      const response = await axios.post("/group/add-member", { chatId, userId });
      
      // Kiểm tra dữ liệu trả về
      if (!response.data) {
        throw new Error("Không nhận được dữ liệu từ server");
      }
      
      // Cập nhật thông tin nhóm trong danh sách chat
      const { chats, selectedChat } = get();
      
      // Nếu server trả về chat đầy đủ, sử dụng nó
      if (response.data.chat) {
        const updatedChat = {
          ...response.data.chat,
          isGroupChat: true,
          chatId: chatId // Đảm bảo chatId luôn có
        };
        
        // Cập nhật danh sách chats
        const updatedChats = chats.map(chat =>
          chat.chatId === chatId ? updatedChat : chat
        );
        
        set({
          chats: updatedChats,
          selectedChat: selectedChat?.chatId === chatId ? updatedChat : selectedChat,
          isAddingMember: false
        });
        
        return updatedChat;
      }
      
      // Nếu không có chat đầy đủ, tự cập nhật
      const chatToUpdate = chats.find(chat => chat.chatId === chatId);
      if (!chatToUpdate) {
        throw new Error("Không tìm thấy chat với ID: " + chatId);
      }
      
      // Tìm thông tin người dùng được thêm vào
      const user = await axios.get(`/user/${userId}`).then(res => res.data.user).catch(() => null);
      
      const updatedParticipants = [...chatToUpdate.participants];
      const userExists = updatedParticipants.some(p => {
        if (typeof p === 'object' && p._id) {
          return p._id.toString() === userId.toString();
        }
        return p.toString() === userId.toString();
      });
      
      if (!userExists) {
        if (user) {
          updatedParticipants.push({
            _id: userId,
            name: user.name,
            avatar: user.avatar
          });
        } else {
          updatedParticipants.push(userId);
        }
      }
      
      const updatedChat = {
        ...chatToUpdate,
        participants: updatedParticipants,
        isGroupChat: true,
        updatedAt: new Date().toISOString()
      };
      
      
      
      set({
        chats: updatedChat,
        selectedChat: selectedChat?.chatId === chatId ? updatedChat : selectedChat,
        isAddingMember: false
      });
      await get().refreshChatList(true);
      return updatedChat;
    } catch (error) {
      console.error("Lỗi khi thêm thành viên:", error);
      set({
        error: error.response?.data?.message || "Lỗi khi thêm thành viên",
        isAddingMember: false
      });
      throw error;
    }
  },
    
  removeGroupMember: async (chatId, userId) => {
    set({ isRemovingMember: true, error: null });
    try {
      const currentUserId = localStorage.getItem("userId");
      
      // Kiểm tra quyền admin
      if (!get().isUserAdmin(chatId, currentUserId)) {
        throw new Error("Bạn không có quyền xóa thành viên khỏi nhóm này");
      }
      
      const response = await axios.post("/group/remove-member", { chatId, userId });
      
      // Kiểm tra dữ liệu trả về
      if (!response.data) {
        throw new Error("Không nhận được dữ liệu từ server");
      }
      
      // Cập nhật thông tin nhóm trong danh sách chat
      const { chats, selectedChat } = get();
      
      // Nếu server trả về chat đầy đủ, sử dụng nó
      let updatedChat;
      if (response.data.chat) {
        updatedChat = {
          ...response.data.chat,
          isGroupChat: true,
          chatId: chatId // Đảm bảo chatId luôn có
        };
      } else {
        // Nếu không, tự tạo updatedChat từ dữ liệu hiện có
        const chatToUpdate = chats.find(chat => chat.chatId === chatId);
        if (!chatToUpdate) {
          throw new Error("Không tìm thấy chat với ID: " + chatId);
        }
        
        updatedChat = {
          ...chatToUpdate,
          participants: chatToUpdate.participants.filter(p => {
            if (typeof p === 'object' && p._id) {
              return p._id.toString() !== userId.toString();
            }
            return p.toString() !== userId.toString();
          }),
          isGroupChat: true,
          updatedAt: new Date().toISOString()
        };
      }
      
      // Cập nhật danh sách chats
      const updatedChats = chats.map(chat => 
        chat.chatId === chatId ? updatedChat : chat
      );
      
      set({
        chats: updatedChats,
        selectedChat: selectedChat?.chatId === chatId ? updatedChat : selectedChat,
        isRemovingMember: false
      });
      
      return updatedChat;
    } catch (error) {
      console.error("Lỗi khi xóa thành viên:", error);
      set({
        error: error.response?.data?.message || "Lỗi khi xóa thành viên",
        isRemovingMember: false
      });
      throw error;
    }
  },
  
  
  leaveGroup: async (chatId) => {
    set({ isRemovingMember: true, error: null });
    try {
      await axios.post("/group/leave", { chatId });
      
      // Xóa nhóm khỏi danh sách chat
      const { chats, selectedChat } = get();
      const updatedChats = chats.filter(chat => chat.chatId !== chatId);
      
      set({
        chats: updatedChats,
        selectedChat: selectedChat?.chatId === chatId ? null : selectedChat,
        isRemovingMember: false
      });
    } catch (error) {
      console.error("Lỗi khi rời nhóm:", error);
      set({
        error: error.response?.data?.message || "Lỗi khi rời nhóm",
        isRemovingMember: false
      });
      throw error;
    }
  },
  
  assignAdmin: async (chatId, userId) => {
    set({ error: null });
    try {
      const currentUserId = localStorage.getItem("userId");
      
      // Kiểm tra quyền admin
      if (!get().isUserAdmin(chatId, currentUserId)) {
        throw new Error("Bạn không có quyền gán quyền admin");
      }
      
      const response = await axios.post("/group/assign-admin", { chatId, userId });
      
      // Kiểm tra response
      if (!response.data) {
        throw new Error("Không nhận được dữ liệu từ server");
      }
      
      // Cập nhật thông tin nhóm trong danh sách chat
      const { chats, selectedChat } = get();
      
      // Lọc bỏ các phần tử undefined
      const validChats = chats.filter(chat => chat !== undefined && chat !== null);
      
      // Tìm chat cần cập nhật
      const chatToUpdate = validChats.find(chat => chat.chatId === chatId);
      
      if (!chatToUpdate) {
        throw new Error("Không tìm thấy chat với ID: " + chatId);
      }
      
      // Cập nhật danh sách admin
      let updatedAdmins = [...(chatToUpdate.admins || [])];
      if (!updatedAdmins.includes(userId)) {
        updatedAdmins.push(userId);
      }
      
      // Tạo chat mới với admins đã cập nhật
      const updatedChat = {
        ...chatToUpdate,
        admins: updatedAdmins,
        isGroupChat: true
      };
      
      // Cập nhật danh sách chats
      const updatedChats = validChats.map(chat => 
        chat.chatId === chatId ? updatedChat : chat
      );
      
      // Cập nhật selectedChat nếu cần
      let updatedSelectedChat = selectedChat;
      if (selectedChat && selectedChat.chatId === chatId) {
        updatedSelectedChat = updatedChat;
      }
      
      // Cập nhật state
      set({
        chats: updatedChats,
        selectedChat: updatedSelectedChat
      });
      
      return updatedChat;
    } catch (error) {
      console.error("Lỗi khi gán quyền admin:", error);
      set({
        error: error.response?.data?.message || "Lỗi khi gán quyền admin"
      });
      throw error;
    }
  },
  
  
  
  removeAdmin: async (chatId, userId) => {
    console.log("removeAdmin được gọi với chatId:", chatId, "userId:", userId);
    set({ error: null });
    try {
      const currentUserId = localStorage.getItem("userId");
      
      // Kiểm tra quyền admin
      if (!get().isUserAdmin(chatId, currentUserId)) {
        throw new Error("Bạn không có quyền xóa quyền admin");
      }
      
      const response = await axios.post("/group/remove-admin", { chatId, userId });
      
      // Kiểm tra response
      if (!response.data) {
        throw new Error("Không nhận được dữ liệu từ server");
      }
      
      // Cập nhật thông tin nhóm trong danh sách chat
      const { chats, selectedChat } = get();
      
      // Lọc bỏ các phần tử undefined
      const validChats = chats.filter(chat => chat !== undefined && chat !== null);
      
      // Tìm chat cần cập nhật
      const chatToUpdate = validChats.find(chat => chat.chatId === chatId);
      
      if (!chatToUpdate) {
        throw new Error("Không tìm thấy chat với ID: " + chatId);
      }
      
      // Cập nhật danh sách admin
      let updatedAdmins = [...(chatToUpdate.admins || [])].filter(adminId => {
        if (typeof adminId === 'object' && adminId._id) {
          return adminId._id.toString() !== userId.toString();
        }
        return adminId.toString() !== userId.toString();
      });
      
      // Tạo chat mới với admins đã cập nhật
      const updatedChat = {
        ...chatToUpdate,
        admins: updatedAdmins,
        isGroupChat: true
      };
      
      // Cập nhật danh sách chats
      const updatedChats = validChats.map(chat => 
        chat.chatId === chatId ? updatedChat : chat
      );
      
      // Cập nhật selectedChat nếu cần
      let updatedSelectedChat = selectedChat;
      if (selectedChat && selectedChat.chatId === chatId) {
        updatedSelectedChat = updatedChat;
      }
      
      // Cập nhật state
      set({
        chats: updatedChats,
        selectedChat: updatedSelectedChat
      });
      
      return updatedChat;
    } catch (error) {
      console.error("Lỗi khi xóa quyền admin:", error);
      set({
        error: error.response?.data?.message || "Lỗi khi xóa quyền admin"
      });
      throw error;
    }
  },
  
  
  
  dissolveGroup: async (chatId) => {
    set({ error: null });
    try {
      const currentUserId = localStorage.getItem("userId");
      const { chats } = get();
      const chat = chats.find(c => c.chatId === chatId);
      
      // Kiểm tra xem người dùng có phải là người tạo nhóm không
      if (!chat || !chat.createdBy) {
        throw new Error("Không tìm thấy thông tin nhóm");
      }
      
      let isCreator = false;
      if (typeof chat.createdBy === 'object' && chat.createdBy._id) {
        isCreator = chat.createdBy._id.toString() === currentUserId.toString();
      } else if (typeof chat.createdBy === 'string') {
        isCreator = chat.createdBy === currentUserId;
      } else {
        isCreator = chat.createdBy.toString() === currentUserId.toString();
      }
      
      if (!isCreator) {
        throw new Error("Chỉ người tạo nhóm mới có quyền giải tán nhóm");
      }
      await axios.post("/group/dissolve", { chatId });
      
      // Xóa nhóm khỏi danh sách chat
      const {selectedChat } = get();
      const updatedChats = chats.filter(chat => chat.chatId !== chatId);
      
      set({
        chats: updatedChats,
        selectedChat: selectedChat?.chatId === chatId ? null : selectedChat
      });
    } catch (error) {
      console.error("Lỗi khi giải tán nhóm:", error);
      set({
        error: error.response?.data?.message || "Lỗi khi giải tán nhóm"
      });
      throw error;
    }
  },
  
  updateGroupAvatar: async (chatId, avatarFile) => {
    set({ isUpdatingAvatar: true, error: null });
    try {
      const currentUserId = localStorage.getItem("userId");
      
      // Kiểm tra quyền admin
      if (!get().isUserAdmin(chatId, currentUserId)) {
        throw new Error("Bạn không có quyền cập nhật ảnh nhóm");
      }
      
      // Kiểm tra file
      if (!avatarFile) {
        throw new Error("Vui lòng chọn file ảnh");
      }
      
      // Tạo FormData
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      formData.append('chatId', chatId);
      
      // Gửi request không cần thiết lập Content-Type
      const response = await axios.post("/group/update-avatar", formData, {
        headers: {
          // Không thiết lập Content-Type để browser tự thêm boundary
        }
      });
      
      // Xử lý kết quả
      if (!response.data) {
        throw new Error("Không nhận được dữ liệu từ server");
      }
      
      const avatar = response.data.avatar;
      
      // Cập nhật thông tin nhóm trong danh sách chat
      const { chats, selectedChat } = get();
      const updatedChats = chats.map(chat =>
        chat.chatId === chatId ? {...chat, avatar} : chat
      );
      
      set({
        chats: updatedChats,
        selectedChat: selectedChat?.chatId === chatId ?
          {...selectedChat, avatar} : selectedChat,
        isUpdatingAvatar: false
      });
      
      return response.data;
    } catch (error) {
      console.error("Lỗi khi cập nhật ảnh nhóm:", error);
      const errorMessage = error.response?.data?.message || "Lỗi khi cập nhật ảnh nhóm";
      set({
        error: errorMessage,
        isUpdatingAvatar: false
      });
      throw error;
    }
  },
  recallMessage: async (messageId) => {
    try {
      const response = await axios.post('/chat/recall', { messageId }, { withCredentials: true });
      const { messages } = get();

      // Cập nhật trạng thái tin nhắn đã thu hồi
      const updatedMessages = messages.map((msg) =>
        msg.messageId === messageId
          ? {
              ...msg,
              isRecalled: true,
              content: 'Tin nhắn đã được thu hồi',
              image: null, // Xóa ảnh
              video: null, // Xóa video
              fileUrl: null, // Xóa file
              fileName: null, // Xóa tên file
            }
          : msg
      );

      set({ messages: updatedMessages });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi thu hồi tin nhắn:', error);
      throw error;
    }
  },
}));