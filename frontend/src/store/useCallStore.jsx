import { create } from 'zustand';
import toast from 'react-hot-toast';
import axiosInstance from '../lib/axios';
import { StreamVideoClient } from '@stream-io/video-react-sdk';
import useAuthStore from './useAuthStore';
// Không import useSocketStore để tránh circular dependency
// import { useSocketStore } from './useSocketStore';

const useCallStore = create((set, get) => ({
  token: null,
  client: null,
  call: null,
  callId: null,
  isLoading: false,
  error: null,
  callHistory: [],
  incomingCall: null,
  
  // Lấy token Stream từ server
  fetchToken: async () => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.get('/stream/token');
      set({ token: response.data.token, isLoading: false });
      return response.data.token;
    } catch (error) {
      console.error('Error fetching Stream token:', error);
      set({ error: 'Không thể lấy Stream token', isLoading: false });
      toast.error('Không thể kết nối dịch vụ video');
      return null;
    }
  },
  
  // Khởi tạo Stream client
  initClient: (apiKey, user, token) => {
    try {
      console.log("Initializing Stream client with:", { apiKey, user, token });
      
      // Kiểm tra các tham số bắt buộc
      if (!apiKey) throw new Error('API key is required');
      if (!user || !user.id) throw new Error('User with ID is required');
      if (!token) throw new Error('Token is required');
      
      const client = new StreamVideoClient({
        apiKey,
        user,
        token,
      });
      
      console.log("Stream client initialized successfully:", client);
      set({ client });
      return client;
    } catch (error) {
      console.error('Error initializing Stream client:', error);
      set({ error: 'Không thể khởi tạo Stream client' });
      toast.error('Không thể khởi tạo dịch vụ video');
      return null;
    }
  },
  
// 
createGroupCall: async (chatId, callType = 'video') => {
  set({ isLoading: true });
  try {
    const { authUser } = useAuthStore.getState();
      if (!authUser || !authUser._id) {
        throw new Error('Không có thông tin người dùng xác thực');
      }
    const callerId = authUser._id.toString();
    const response = await axiosInstance.post('/stream/group-call', {
      chatId,
      callType
    });
    
    // Gửi thông báo group call qua socket
    const socket = window.socketInstance;
      if (socket) {
        console.log('🔔 Gửi sự kiện start_group_call với dữ liệu:', {
          callId: response.data.callId,
          chatId,
          callerId,
          isGroupCall: true,
        });
        socket.emit('start_group_call', {
          callId: response.data.callId,
          chatId,
          callerId,
          isGroupCall: true,
        });
      }
    
    set({ callId: response.data.callId, isLoading: false });
      return response.data.callId;
    } catch (error) {
      console.error('Lỗi tạo group call:', error);
      set({ error: 'Không thể tạo group call', isLoading: false });
      toast.error('Không thể tạo group call');
      return null;
    }
},

    // Tạo cuộc gọi mới
 createCall: async (participantIds, chatId, callerId) => {
  set({ isLoading: true });
  try {
    const response = await axiosInstance.post('/stream/call', {
      participantIds,
      chatId
    });
    
    // Gửi thông báo cuộc gọi qua socket
    const socket = window.socketInstance;
    if (socket) {
      console.log("🔔 Gửi sự kiện call_user với dữ liệu:", {
        callId: response.data.callId,
        participantIds,
        chatId,
        callerId // Sử dụng callerId được truyền vào
      });
      socket.emit("call_user", {
        callId: response.data.callId,
        participantIds,
        chatId,
        callerId // Sử dụng callerId được truyền vào
      });
    }
    
    set({ callId: response.data.callId, isLoading: false });
    return response.data.callId;
  } catch (error) {
    console.error('Error creating call:', error);
    set({ error: 'Không thể tạo cuộc gọi', isLoading: false });
    toast.error('Không thể tạo cuộc gọi');
    return null;
  }
},
  
  // Tham gia cuộc gọi
  joinCall: async (callId) => {
  const { client } = get();
  set({ isLoading: true });
  
  let retryCount = 0;
  const maxRetries = 2;
  
  const attemptJoin = async () => {
    try {
      if (!client) {
        throw new Error('Client chưa được khởi tạo');
      }
      
      const call = client.call('default', callId);
      await call.join({ create: true });
      
      set({ call, callId, isLoading: false });
      return call;
    } catch (error) {
      if (retryCount < maxRetries) {
        retryCount++;
        console.log(`Thử lại lần ${retryCount}/${maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Đợi 1 giây trước khi thử lại
        return attemptJoin();
      }
      
      console.error('Error joining call after retries:', error);
      set({ error: 'Không thể tham gia cuộc gọi', isLoading: false });
      toast.error('Không thể tham gia cuộc gọi sau nhiều lần thử');
      return null;
    }
  };
  
  return attemptJoin();
},
  
  setIncomingCall: (incomingCallData) => {
    set({ incomingCall: incomingCallData });
  },
  
  // Xử lý khi người dùng chấp nhận cuộc gọi
 acceptIncomingCall: async () => {
  const { incomingCall } = get();
  if (!incomingCall) return;
  
  try {
    // Lấy callId từ incomingCall
    const { callId } = incomingCall;
    
    // Đặt lại incomingCall về null
    set({ incomingCall: null });
    
    // Sử dụng navigate thay vì window.location.href
    // Nhưng vì không thể truy cập navigate từ store,
    // ta sẽ sử dụng một cách tiếp cận khác
    
    // Lưu callId vào localStorage để component có thể lấy và xử lý
    localStorage.setItem('acceptedCallId', callId);
    
    // Kích hoạt một sự kiện tùy chỉnh mà component có thể lắng nghe
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('callAccepted', { detail: { callId } });
      window.dispatchEvent(event);
    }
  } catch (error) {
    console.error('Error accepting call:', error);
    toast.error('Không thể tham gia cuộc gọi');
  }
},
  
// Kết thúc cuộc gọi
// Kết thúc cuộc gọi
endCall: async () => {
  const { call, callId } = get();
  try {
    if (call) {
      await call.leave();
    }
    
    if (callId) {
      await axiosInstance.put(`/stream/call/${callId}/end`);
      
      // Gửi thông báo đến người còn lại
      const socket = window.socketInstance;
      if (socket) {
        console.log("📤 Gửi sự kiện end_call với callId:", callId);
        socket.emit("end_call", { callId });
      }
    }
    
    set({ call: null, callId: null });
  } catch (error) {
    console.error('Error ending call:', error);
    toast.error('Lỗi khi kết thúc cuộc gọi');
  }
},

// Xử lý khi người dùng từ chối cuộc gọi
rejectIncomingCall: async () => {
  const { incomingCall } = get();
  if (!incomingCall) return;
  
  try {
    // Đặt lại incomingCall về null trước khi gửi sự kiện
    // để tránh xử lý trùng lặp
    const callData = { ...incomingCall };
    set({ incomingCall: null });
    
    // Gửi sự kiện từ chối cuộc gọi
    const socket = window.socketInstance;
    if (socket) {
      socket.emit("reject_call", {
        callId: callData.callId,
        callerId: callData.caller._id
      });
    }
  } catch (error) {
    console.error('Error rejecting call:', error);
  }
},
setCallState: (newState) => {
  set(newState);
},
  
  fetchCallHistory: async () => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.get('/stream/calls');
      set({ callHistory: response.data, isLoading: false });
    } catch (error) {
      console.error('Error fetching call history:', error);
      set({ error: 'Không thể lấy lịch sử cuộc gọi', isLoading: false });
    }
  },
  
  // Reset store
  reset: () => {
    const { call } = get();
    if (call) {
      call.leave().catch(console.error);
    }
    set({ token: null, client: null, call: null, callId: null, error: null });
  }
}));

export default useCallStore;