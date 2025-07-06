// useSocketStore.js
import { io } from "socket.io-client";
import { create } from "zustand";
import { useChatStore } from "./useChatStore";
import toast from 'react-hot-toast';
import useCallStore from "./useCallStore";
import useAuthStore from "./useAuthStore";
const saveSocketToWindow = (socket) => {
  if (typeof window !== 'undefined') {
    window.socketInstance = socket;
  }
  return socket;
};
export const useSocketStore = create((set) => ({
  socket: null,
  onlineUsers: [], // Thêm trạng thái onlineUsers
  incomingCall: null,
  connectSocket: (tokenArg, userIdArg) => {
    const token = tokenArg || localStorage.getItem("authToken");
    const userId = userIdArg || localStorage.getItem("userId");
    console.log("Đang kết nối socket với token:", token ? "Có token" : "Không có token");
    console.log("userId:", userId);
    // Kiểm tra nếu socket đã kết nối thì bỏ qua
    if (useSocketStore.getState().socket?.connected) {
      console.log("Socket đã kết nối, bỏ qua kết nối mới");
      return;
    }

    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:3000", {
      withCredentials: true, // Gửi cookie trong kết nối socket
      transports: ["websocket"],
      auth: { token, userId }, // Gửi token và userId trong auth
    });
    saveSocketToWindow(socket);
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
        image: data.message.image || data.message.imageUrl,
        video: data.message.video || data.message.videoUrl,
        fileUrl: data.message.fileUrl,
        fileName: data.message.fileName,
        fileSize: data.message.fileSize
    };

    const { messages } = useChatStore.getState();
    const userId = localStorage.getItem("userId");
    const isSentByCurrentUser = updatedMessage.senderId._id === userId;

    // ✅ Kiểm tra tin nhắn đã tồn tại dựa trên messageId
    const existingMessage = messages.find(msg => 
        msg.messageId === updatedMessage.messageId ||
        msg._id === updatedMessage._id
    );

    if (existingMessage) {
        console.log("Tin nhắn đã tồn tại, bỏ qua");
        return;
    }

    // ✅ Nếu là tin nhắn của user hiện tại, tìm và thay thế tin nhắn tạm thời
    if (isSentByCurrentUser) {
        const tempMessageIndex = messages.findIndex(msg => {
            if (!msg.isPending) return false;
            
            // Đối với hình ảnh
            if (updatedMessage.image && msg.image) {
                return (
                    msg.content === updatedMessage.content &&
                    Math.abs(new Date(msg.createdAt) - new Date(updatedMessage.createdAt)) < 10000
                );
            }
            
            // Đối với text
            return (
                msg.content === updatedMessage.content &&
                Math.abs(new Date(msg.createdAt) - new Date(updatedMessage.createdAt)) < 10000
            );
        });

        if (tempMessageIndex !== -1) {
            // Thay thế tin nhắn tạm thời
            const updatedMessages = [...messages];
            updatedMessages[tempMessageIndex] = {
                ...updatedMessage,
                isPending: false,
                isError: false,
                status: 'SENT'
            };
            useChatStore.setState({ messages: updatedMessages });
            return;
        }
    }

    // Thêm tin nhắn mới
    useChatStore.getState().addMessage(updatedMessage);
});

    
    
    socket.on("message_delivered", ({ messageId }) => {
      console.log("Tin nhắn đã được gửi:", messageId);
      // Cập nhật trạng thái đã gửi của tin nhắn nếu cần
    });
    
    socket.on("message_read", ({messageId }) => {
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

    
    socket.on("group_member_added", (data) => {
  console.log("Thành viên mới được thêm vào nhóm:", data);
  
  if (!data || !data.chatId) {
    console.error("Dữ liệu không hợp lệ từ sự kiện group_member_added:", data);
    return;
  }

  const chatStore = useChatStore.getState();
  const { chats, selectedChat } = chatStore;
  const currentUserId = localStorage.getItem("userId");

  // Nếu server trả về chat đầy đủ, sử dụng nó
  if (data.chat) {
    const finalChat = {
      ...data.chat,
      isGroupChat: true,
      chatId: data.chatId
    };

    // Kiểm tra xem người dùng hiện tại có trong danh sách participants không
    const isCurrentUserInGroup = finalChat.participants.some(p => {
      const participantId = typeof p === 'object' && p._id ? p._id.toString() : p.toString();
      return participantId === currentUserId;
    });

    if (isCurrentUserInGroup) {
      // Kiểm tra xem chat đã tồn tại trong danh sách chưa
      const existingChatIndex = chats.findIndex(chat => chat.chatId === data.chatId);
      
      let updatedChats;
      if (existingChatIndex !== -1) {
        // Cập nhật chat hiện có
        updatedChats = chats.map(chat =>
          chat.chatId === data.chatId ? finalChat : chat
        );
      } else {
        // Thêm chat mới vào đầu danh sách (cho người được thêm vào)
        updatedChats = [finalChat, ...chats];
        
        // Hiển thị thông báo cho người được thêm vào
        if (data.userId === currentUserId) {
          toast.success(`Bạn đã được thêm vào nhóm "${finalChat.groupName || finalChat.name}"`);
        } else {
          toast.success(`${data.userName || 'Thành viên mới'} đã được thêm vào nhóm`);
        }
      }

      // Cập nhật state
      useChatStore.setState({
        chats: updatedChats,
        selectedChat: selectedChat?.chatId === data.chatId ? finalChat : selectedChat
      });
    }
  } else {
    // Nếu không có chat đầy đủ, làm mới danh sách chat
    useChatStore.getState().refreshChatList(true);
  }
});

    
    
    
    socket.on("group_member_removed", async (data) => {
  console.log("Thành viên bị xóa khỏi nhóm:", data);
  
  if (!data || !data.chatId) {
    console.error("Dữ liệu không hợp lệ từ sự kiện group_member_removed:", data);
    return;
  }

  // Làm mới dữ liệu từ server để đảm bảo tính chính xác
  try {
    await useChatStore.getState().refreshChatList(true);
  } catch (error) {
    console.error("Lỗi khi làm mới danh sách chat:", error);
  }

  const { chats, selectedChat } = useChatStore.getState();
  const chatToUpdate = chats.find(chat => chat.chatId === data.chatId);
  
  if (!chatToUpdate) {
    console.error("Không tìm thấy chat với ID:", data.chatId);
    return;
  }

  // Đảm bảo xóa hoàn toàn thành viên
  const updatedParticipants = chatToUpdate.participants.filter(p => {
    const participantId = typeof p === 'object' && p._id ? p._id.toString() : p.toString();
    return participantId !== data.userId.toString();
  });

  const updatedChat = {
    ...chatToUpdate,
    participants: updatedParticipants,
    chatId: chatToUpdate.chatId,
    isGroupChat: true,
    name: chatToUpdate.name,
    groupName: chatToUpdate.groupName,
    avatar: chatToUpdate.avatar,
    admins: chatToUpdate.admins,
    createdBy: chatToUpdate.createdBy,
    updatedAt: new Date().toISOString()
  };

  const updatedChats = chats.map(chat =>
    chat.chatId === data.chatId ? updatedChat : chat
  );

  useChatStore.setState({
    chats: updatedChats,
    selectedChat: selectedChat?.chatId === data.chatId ? updatedChat : selectedChat
  });
});

    
    
    
    
    socket.on("removed_from_group", (data) => {
      console.log("Bạn đã bị xóa khỏi nhóm:", data);
      if (!data || !data.chatId) {
        console.error("Dữ liệu không hợp lệ từ sự kiện removed_from_group:", data);
        return;
      }

      const { chats, selectedChat } = useChatStore.getState();
      const updatedChats = chats.filter(chat => chat.chatId !== data.chatId);

      useChatStore.setState({
        chats: updatedChats,
        selectedChat: selectedChat?.chatId === data.chatId ? null : selectedChat,
      });

      // Làm mới danh sách chat để đảm bảo dữ liệu mới nhất
      useChatStore.getState().refreshChatList(true);

      toast.error(`Bạn đã bị xóa khỏi nhóm "${data.groupName || 'nhóm chat'}"`);
    });
    
    socket.on("group_dissolved", (data) => {
      console.log("Nhóm đã bị giải tán:", data);
      const chatStore = useChatStore.getState();
      const { chats, selectedChat } = chatStore;
      
      // Xóa nhóm khỏi danh sách chat
      const updatedChats = chats.filter(chat => chat.chatId !== data.chatId);
      
      // Hiển thị thông báo
      toast.error(`Nhóm "${data.groupName}" đã bị giải tán bởi người tạo nhóm`);
      
      // Kiểm tra xem người dùng có đang ở trong đoạn chat bị giải tán không
      const isInDissolvedChat = selectedChat?.chatId === data.chatId;
      
      // Cập nhật state
      useChatStore.setState({
        chats: updatedChats,
        selectedChat: isInDissolvedChat ? null : selectedChat
      });
    });
    
    
    
    
    // Thay thế đoạn code lỗi trong sự kiện admin_assigned
socket.on("admin_assigned", (data) => {
  console.log("Quyền admin được gán:", data);
  if (!data || !data.chatId) {
    console.error("Dữ liệu không hợp lệ từ sự kiện admin_assigned:", data);
    return;
  }
  
  const chatStore = useChatStore.getState();
  const { chats, selectedChat } = chatStore;
  
  // Lọc bỏ các phần tử undefined
  const validChats = chats.filter(chat => chat !== undefined && chat !== null);
  
  // Tìm chat cần cập nhật
  const chatToUpdate = validChats.find(chat => chat.chatId === data.chatId);
  if (!chatToUpdate) {
    console.error("Không tìm thấy chat với ID:", data.chatId);
    return;
  }
  
  // Cập nhật danh sách admin
  let updatedAdmins = [...(chatToUpdate.admins || [])];
  if (!updatedAdmins.includes(data.userId) && data.userId) {
    updatedAdmins.push(data.userId);
  }
  
  // Tạo chat mới với admins đã cập nhật
  const updatedChat = {
    ...chatToUpdate,
    admins: updatedAdmins,
    isGroupChat: true
  };
  
  // Cập nhật danh sách chats
  const updatedChats = validChats.map(chat =>
    chat.chatId === data.chatId ? updatedChat : chat
  );
  
  // Cập nhật selectedChat nếu cần
  let updatedSelectedChat = selectedChat;
  if (selectedChat && selectedChat.chatId === data.chatId) {
    updatedSelectedChat = updatedChat;
  }
  
  // Sửa lại cách cập nhật state
  useChatStore.setState({
    chats: updatedChats,
    selectedChat: updatedSelectedChat
  });
  
  // Hiển thị thông báo
  toast.success('Quyền admin đã được cập nhật');
});

    
    
    
    
    socket.on("admin_removed", (data) => {
      console.log("Quyền admin bị xóa:", data);
      if (!data || !data.chatId) {
        console.error("Dữ liệu không hợp lệ từ sự kiện admin_removed:", data);
        return;
      }
      
      const chatStore = useChatStore.getState();
      const { chats, selectedChat } = chatStore;
      
      // Lọc bỏ các phần tử undefined
      const validChats = chats.filter(chat => chat !== undefined && chat !== null);
      
      // Tìm chat cần cập nhật
      const chatToUpdate = validChats.find(chat => chat.chatId === data.chatId);
      
      if (!chatToUpdate) {
        console.error("Không tìm thấy chat với ID:", data.chatId);
        return;
      }
      
      // Cập nhật danh sách admin
      let updatedAdmins = [...(chatToUpdate.admins || [])].filter(adminId => {
        if (typeof adminId === 'object' && adminId._id) {
          return adminId._id.toString() !== data.userId.toString();
        }
        return adminId.toString() !== data.userId.toString();
      });
      
      // Tạo chat mới với admins đã cập nhật
      const updatedChat = {
        ...chatToUpdate,
        admins: updatedAdmins,
        isGroupChat: true
      };
      
      // Cập nhật danh sách chats
      const updatedChats = validChats.map(chat => 
        chat.chatId === data.chatId ? updatedChat : chat
      );
      
      // Cập nhật selectedChat nếu cần
      let updatedSelectedChat = selectedChat;
      if (selectedChat && selectedChat.chatId === data.chatId) {
        updatedSelectedChat = updatedChat;
      }
      
      useChatStore.setState({
        chats: updatedChats,
        selectedChat: updatedSelectedChat
      });
      
      // Hiển thị thông báo
      toast.success('Quyền admin đã được cập nhật');
    });
    
    
    socket.on("group_avatar_updated", (data) => {
      console.log("Avatar nhóm được cập nhật:", data);
      if (!data || !data.chatId || !data.avatar) {
        console.error("Dữ liệu không hợp lệ từ sự kiện group_avatar_updated:", data);
        return;
      }
      
      const chatStore = useChatStore.getState();
      const { chats, selectedChat } = chatStore;
      
      // Tìm chat trong danh sách hiện tại
      const chatToUpdate = chats.find(chat => chat.chatId === data.chatId);
      if (!chatToUpdate) {
        console.error("Không tìm thấy chat với ID:", data.chatId);
        return;
      }
      
      // Cập nhật avatar
      const updatedChat = {
        ...chatToUpdate,
        avatar: data.avatar,
        updatedAt: new Date().toISOString()
      };
      
      // Cập nhật thông tin nhóm trong danh sách chat
      const updatedChats = chats.map(chat =>
        chat.chatId === data.chatId ? updatedChat : chat
      );
      
      useChatStore.setState({
        chats: updatedChats,
        selectedChat: selectedChat?.chatId === data.chatId ? updatedChat : selectedChat
      });
      
      // Hiển thị thông báo
      toast.success('Avatar nhóm đã được cập nhật');
    });
    
    
    
    
    
    
    socket.on("member_left_group", (data) => {
      console.log("Thành viên rời nhóm:", data);
      if (!data || !data.chatId) {
        console.error("Dữ liệu không hợp lệ từ sự kiện member_left_group:", data);
        return;
      }
      
      const chatStore = useChatStore.getState();
      const { chats, selectedChat } = chatStore;
      
      // Tìm chat trong danh sách hiện tại
      const chatToUpdate = chats.find(chat => chat.chatId === data.chatId);
      
      if (!chatToUpdate) {
        console.error("Không tìm thấy chat với ID:", data.chatId);
        return;
      }
      
      // Cập nhật danh sách participants
      const updatedChat = {
        ...chatToUpdate,
        participants: chatToUpdate.participants.filter(p => {
          if (typeof p === 'object' && p._id) {
            return p._id.toString() !== data.userId.toString();
          }
          return p.toString() !== data.userId.toString();
        }),
        // Đảm bảo giữ lại tất cả các thuộc tính quan trọng
        chatId: chatToUpdate.chatId,
        isGroupChat: true,
        name: chatToUpdate.name,
        groupName: chatToUpdate.groupName,
        avatar: chatToUpdate.avatar,
        admins: chatToUpdate.admins,
        createdBy: chatToUpdate.createdBy,
        updatedAt: new Date().toISOString()
      };
      
      // Cập nhật thông tin nhóm trong danh sách chat
      const updatedChats = chats.map(chat =>
        chat.chatId === data.chatId ? updatedChat : chat
      );
      
      chatStore.setState({
        chats: updatedChats,
        selectedChat: selectedChat?.chatId === data.chatId ? updatedChat : selectedChat
      });
    });
    
    
    socket.on("left_group", (data) => {
      console.log("Bạn đã rời nhóm:", data);
      const chatStore = useChatStore.getState();
      const { chats, selectedChat } = chatStore;
      
      // Xóa nhóm khỏi danh sách chat
      const updatedChats = chats.filter(chat => chat.chatId !== data.chatId);
      
      chatStore.setState({ 
        chats: updatedChats,
        selectedChat: selectedChat?.chatId === data.chatId ? null : selectedChat
      });
    });
    
    socket.on("new_group_created", (data) => {
      console.log("Nhóm mới được tạo:", data);
      const chatStore = useChatStore.getState();
      const { chats } = chatStore;
      
      // Tạo đối tượng chat đầy đủ từ dữ liệu nhận được
      const newChat = data.chat || {
        chatId: data.chatId,
        groupName: data.groupName,
        participants: data.participants,
        avatar: data.avatar,
        isGroupChat: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Đảm bảo chat có thuộc tính isGroupChat
      newChat.isGroupChat = true;
      
      // Kiểm tra xem nhóm đã tồn tại trong danh sách chưa
      const existingChat = chats.find(chat => chat.chatId === data.chatId || (data.chat && chat.chatId === data.chat.chatId));
      
      if (!existingChat && data.chat) {
        // Sử dụng hàm setter của store thay vì setState
        useChatStore.setState({
          chats: [data.chat, ...chats]
        });
        
        // Hiển thị thông báo
        toast.success(`Bạn đã được thêm vào nhóm "${newChat.groupName || 'Nhóm chat mới'}"`);
      } else {
        chatStore.refreshChatList(true);
      }
    });
      socket.on("group_ownership_transferred", (data) => {
  console.log("Quyền trưởng nhóm được chuyển:", data);
  
  if (!data || !data.chatId) {
    console.error("Dữ liệu không hợp lệ từ sự kiện group_ownership_transferred:", data);
    return;
  }

  const { chats, selectedChat } = useChatStore.getState();
  const currentUserId = localStorage.getItem("userId");

  // Sử dụng dữ liệu chat đầy đủ từ server
  if (data.chat) {
    const updatedChat = {
      ...data.chat,
      isGroupChat: true,
      chatId: data.chatId,
      // ✅ Đảm bảo tên nhóm được giữ nguyên
      groupName: data.chat.groupName || data.groupName,
      name: data.chat.groupName || data.groupName
    };

    const updatedChats = chats.map(chat =>
      chat.chatId === data.chatId ? updatedChat : chat
    );

    useChatStore.setState({
      chats: updatedChats,
      selectedChat: selectedChat?.chatId === data.chatId ? updatedChat : selectedChat
    });

    // Sử dụng thông tin từ backend
    const groupName = data.groupName || 'nhóm chat';
    const newCreatorName = data.newCreatorName || 'thành viên mới';


    // Hiển thị thông báo với thông tin đúng
    if (data.newCreatorId === currentUserId) {
      toast.success(`Bạn đã trở thành trưởng nhóm "${groupName}"`);
    } else if (data.oldCreatorId === currentUserId) {
      toast.info(`Bạn đã chuyển quyền trưởng nhóm "${groupName}" cho ${newCreatorName}`);
    } 
  }
});
socket.on("message_forwarded", (data) => {
  console.log("📩 Tin nhắn được chuyển tiếp:", data);
  const { forwardedMessage, targetChatId, originalSender } = data;
  
  // Tạo tin nhắn mới với label "Đã chuyển tiếp"
  const newForwardedMessage = {
    ...forwardedMessage,
    messageId: forwardedMessage.messageId || Date.now().toString(),
    isForwarded: true,
    originalMessage: forwardedMessage,
    forwardedFrom: originalSender,
    createdAt: new Date().toISOString(),
    chatId: targetChatId
  };
  
  // Thêm tin nhắn vào chat tương ứng
  const chatStore = useChatStore.getState();
  const { selectedChat } = chatStore;
  
  // Nếu đang ở trong chat được chuyển tiếp đến, hiển thị ngay lập tức
  if (selectedChat && selectedChat.chatId === targetChatId) {
    chatStore.addMessage(newForwardedMessage);
  }
  
  // Cập nhật danh sách chat để hiển thị tin nhắn mới nhất
  chatStore.updateChatLastMessage(targetChatId, newForwardedMessage);
  
  // Hiển thị thông báo
  toast.success("Đã nhận tin nhắn được chuyển tiếp");
});

// Thêm sự kiện xác nhận chuyển tiếp thành công
socket.on("forward_success", (data) => {
  console.log("✅ Chuyển tiếp thành công:", data);
  const { successCount, failedCount } = data;
  
  if (successCount > 0) {
    toast.success(`Đã chuyển tiếp tin nhắn đến ${successCount} cuộc trò chuyện`);
  }
  
  if (failedCount > 0) {
    toast.error(`Không thể chuyển tiếp đến ${failedCount} cuộc trò chuyện`);
  }
});

// Thêm sự kiện lỗi khi chuyển tiếp
socket.on("forward_error", (data) => {
  console.error("❌ Lỗi chuyển tiếp:", data);
  toast.error(data.message || "Không thể chuyển tiếp tin nhắn");
});
   // Xử lý cuộc gọi đến
 socket.on("incoming_call", (data) => {
  console.log("🔔 Cuộc gọi đến:", data);
  const { callId, caller } = data;
  const callStore = useCallStore.getState();
  const { isInCall } = callStore;
  if (isInCall) {
    console.log("📞 Đang trong cuộc gọi, từ chối và thông báo busy");
    
    // Thông báo cho người nhận rằng có người đang gọi
    callStore.setBusyNotification({
      caller: caller,
      timestamp: new Date(),
      callId: callId
    });
    
    // Hiển thị toast notification cho người nhận
    toast(`${caller.name} đang gọi cho bạn`, {
      duration: 4000,
      icon: '📞',
      style: {
        background: '#3B82F6',
        color: 'white',
      }
    });
    
    // Gửi busy signal về cho người gọi
    socket.emit("call_busy", {
      callId,
      callerId: caller._id,
      receiverName: data.receiver?.name || "Người nhận"
    });
    
  } else {
  // Hiển thị thông báo cuộc gọi đến
  try {
    const callStore = useCallStore.getState();
    console.log("CallStore state trước khi set:", callStore);
    callStore.setIncomingCall({
      callId,
      caller,
      isActive: true
    });
    console.log("CallStore state sau khi set:", useCallStore.getState());
  } catch (error) {
    console.error("Lỗi khi xử lý cuộc gọi đến:", error);
  }
}
});
// Thêm xử lý khi nhận được thông báo busy
socket.on("call_busy_response", (data) => {
  console.log("📞 Nhận thông báo busy:", data);
  const { receiverName, message, callId } = data;
  
  // Hiển thị thông báo cho người gọi
  toast.error(`${receiverName} đang bận`, {
    duration: 5000,
    icon: '📞',
    style: {
      background: '#EF4444',
      color: 'white',
    }
  });
  
  // Xử lý cuộc gọi bị busy
  const callStore = useCallStore.getState();
  callStore.handleBusyCall(callId);
  
  // Dispatch event cho CallPage nếu đang ở đó
  if (window.location.pathname.includes('/call/')) {
    const event = new CustomEvent('busyCallReceived', {
      detail: {
        callId,
        receiverName,
        message
      }
    });
    window.dispatchEvent(event);
  }
});

// useSocketStore.jsx - Thay thế logic trong sự kiện call_ended
socket.on("call_ended", (data) => {
    console.log("📞 Cuộc gọi đã kết thúc:", data);
    const { callId, endedBy, timestamp } = data;
    const callStore = useCallStore.getState();
    
    // ✅ Kiểm tra callId khớp
    if (callStore.callId === callId) {
        console.log("✅ CallId khớp, xử lý kết thúc cuộc gọi");
        
        toast.info("Cuộc gọi đã kết thúc");
        
        // ✅ Leave call nếu đang active
        if (callStore.call) {
            const callingState = callStore.call.state.callingState;
            console.log("📊 Current calling state:", callingState);
            
            if (callingState !== 'left' && callingState !== 'idle') {
                callStore.call.leave().catch((error) => {
                    if (!error.message?.includes('already been left')) {
                        console.error("Error leaving call on socket event:", error);
                    }
                });
            }
        }

        // ✅ Reset state
        callStore.setCallState({
            call: null,
            callId: null,
            error: null,
            incomingCall: null
        });

        // ✅ Navigation cho CallPage
        if (window.location.pathname.includes('/call/')) {
            console.log("🔄 Đang ở CallPage, gửi event navigation");
            const event = new CustomEvent('callEndedFromSocket', { 
                detail: { 
                    callId, 
                    endedBy, 
                    timestamp,
                    reason: 'ended_by_peer' 
                } 
            });
            window.dispatchEvent(event);
        }
    } else {
        console.log("⚠️ CallId không khớp:", {
            received: callId,
            current: callStore.callId
        });
    }
});




socket.on("call_rejected", (data) => {
  console.log("📞 Cuộc gọi bị từ chối:", data);
  const { callId, message } = data;
  
  // Hiển thị thông báo rõ ràng cho người gọi
  toast(message || "Cuộc gọi đã bị từ chối");
  
  // Nếu đang chờ cuộc gọi này, chỉ reset state liên quan đến cuộc gọi
  const callStore = useCallStore.getState();
  if (callStore.callId === callId) {
    // Không gọi reset() vì nó có thể gây ra lỗi
    // Chỉ cập nhật state cần thiết
    callStore.setCallState({
      call: null,
      callId: null,
      error: null
    });
  }
});
 
// Thêm xử lý thông báo group call đến
socket.on("incoming_group_call", (data) => {
  console.log("🔔 Group call đến:", data);
  const { callId, caller, groupName, chatId, participants } = data;
  const { authUser } = useAuthStore.getState();
  const currentUserId = authUser?._id.toString();
  
  if (!currentUserId) {
        console.log('Không có userId xác thực, bỏ qua group call');
        return;
      }

      // Debug: In danh sách participants và currentUserId
      console.log('Participants nhận được:', participants);
      console.log('Current userId:', currentUserId);

      // ✅ Cải thiện logic kiểm tra participants
  let isParticipant = false;

  if (Array.isArray(participants)) {
    isParticipant = participants.some((p) => {
      // Xử lý nhiều trường hợp khác nhau
      if (typeof p === 'string') {
        return p === currentUserId;
      }
      if (typeof p === 'object' && p !== null) {
        if (p._id) {
          return p._id.toString() === currentUserId;
        }
        if (p.toString) {
          return p.toString() === currentUserId;
        }
      }
      return false;
    });
  }

  console.log('Is participant check result:', isParticipant);

      if (!isParticipant) {
        console.log('User không trong danh sách participants, bỏ qua cuộc gọi');
        return;
      }
  
  try {
    const callStore = useCallStore.getState();
    callStore.setIncomingCall({
      callId,
      caller,
      isGroupCall: true,
      groupName,
      chatId,
      participants,
      isActive: true,
      userId: currentUserId // ✅ Thêm userId để phân biệt
    });
  } catch (error) {
    console.error("Lỗi khi xử lý group call đến:", error);
  }
});

socket.on("message_pinned", (data) => {
    console.log("📌 NHẬN ĐƯỢC message_pinned:", data);
    const { messageId, chatId, pinnedMessage, pinnedBy } = data;
    const chatStore = useChatStore.getState();
    const { selectedChat } = chatStore;

    if (selectedChat && selectedChat.chatId === chatId) {
        // **CHỈ gọi fetchPinnedMessages để đồng bộ từ server**
        chatStore.fetchPinnedMessages(chatId);
        console.log("✅ Đã fetch lại pinnedMessages cho chatId:", chatId);
    }

    // Hiển thị thông báo
    const pinnerName = pinnedBy?.name || "Ai đó";
    toast.success(`${pinnerName} đã ghim tin nhắn`, {
        icon: '📌',
        duration: 3000,
    });
});

socket.on("message_unpinned", (data) => {
    console.log("📌 NHẬN ĐƯỢC message_unpinned:", data);
    const { messageId, chatId, unpinnedBy } = data;
    const chatStore = useChatStore.getState();
    const { selectedChat } = chatStore;

    // **QUAN TRỌNG: Chỉ xử lý nếu đang ở đúng chat**
    if (selectedChat && selectedChat.chatId === chatId) {
        // Gọi fetchPinnedMessages TRƯỚC
        chatStore.fetchPinnedMessages(chatId).then(() => {
            console.log("✅ Đã fetch lại pinnedMessages cho chatId:", chatId);
            
            // Sau đó mới cập nhật trạng thái local
            chatStore.updatePinnedMessages(messageId, 'unpin');
            chatStore.updateMessagePinStatus(messageId, false, null);
        });
    }

    // Hiển thị thông báo
    const unpinnerName = unpinnedBy?.name || "Ai đó";
    toast.success(`${unpinnerName} đã bỏ ghim tin nhắn`, {
        icon: '📌',
        duration: 3000,
    });
});
  set({ socket });
    return socket;
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