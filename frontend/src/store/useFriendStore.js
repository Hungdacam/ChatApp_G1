// src/store/useFriendStore.js
import { create } from "zustand";
import axios from "../lib/axios";
import { useSocketStore } from "./useSocketStore";
import { toast } from "react-hot-toast";

export const useFriendStore = create((set, get) => {
  const setupSocketListeners = () => {
    const { socket } = useSocketStore.getState();
    if (!socket) {
      console.warn("Socket chưa sẵn sàng");
      return;
    }

    const registerFriendRequestListener = () => {
      socket.off("new_friend_request");
      socket.on("new_friend_request", ({ request }) => {
        console.log("Nhận lời mời kết bạn:", request);
        if (request?.userId1?.name) {
          toast.success(`📬 Bạn nhận được lời mời kết bạn từ ${request.userId1.name}`);
          get().fetchReceivedRequests();
        } else {
          console.error("Dữ liệu lời mời không hợp lệ:", request);
        }
      });

      // Thêm listener cho sự kiện friend_request_rejected (nếu User A nhận thông báo từ chối)
      socket.off("friend_request_rejected");
      socket.on("friend_request_rejected", ({ receiver }) => {
        if (receiver?.name) {
          toast.info(`🚫 ${receiver.name} đã từ chối lời mời kết bạn của bạn`);
          get().fetchSentRequests(); // Cập nhật danh sách lời mời đã gửi
        }
      });
    };

    registerFriendRequestListener();

    socket.on("connect", () => {
      console.log("Socket kết nối hoặc reconnect:", socket.id);
      registerFriendRequestListener();
    });

    socket.on("disconnect", () => {
      console.log("Socket ngắt kết nối");
    });
  };

  return {
    sentRequests: [],
    receivedRequests: [],
    friends: [],
    fetchSentRequests: async () => {
      try {
        const res = await axios.get("/friends/sent-requests", { withCredentials: true });
        set({ sentRequests: res.data.requests });
      } catch (err) {
        console.error("❌ Error fetching sent requests:", err);
        toast.error("Không thể tải danh sách lời mời đã gửi");
      }
    },
    fetchReceivedRequests: async () => {
      try {
        const res = await axios.get("/friends/requests", { withCredentials: true });
        set({ receivedRequests: res.data.requests });
        console.log("Danh sách lời mời nhận được:", res.data.requests);
      } catch (err) {
        console.error("❌ Error fetching received requests:", err);
        toast.error("Không thể tải danh sách lời mời nhận được");
      }
    },
    sendFriendRequest: async (receiverId) => {
      try {
        await axios.post("/friends/send-request", { receiverId }, { withCredentials: true });
        const { socket } = useSocketStore.getState();
        socket?.emit("send-friend-request", { to: receiverId });
        get().fetchSentRequests();
        return true;
      } catch (err) {
        console.error("❌ Error sending request:", err);
        return false;
      }
    },
    cancelFriendRequest: async (receiverId) => {
      try {
        await axios.post("/friends/cancel-request", { receiverId }, { withCredentials: true });
        toast.success("Đã hủy lời mời kết bạn");
        get().fetchSentRequests();
        return true;
      } catch (err) {
        console.error("❌ Error canceling request:", err);
        toast.error("Không thể hủy lời mời");
        return false;
      }
    },
    acceptFriendRequest: async (senderId) => {
      try {
        const res = await axios.post("/friends/accept-request", { senderId }, { withCredentials: true });
        toast.success("Đã chấp nhận lời mời kết bạn");
        get().fetchReceivedRequests();
        return res.data.chatId;
      } catch (err) {
        console.error("❌ Error accepting friend request:", err);
        toast.error("Không thể chấp nhận lời mời");
        return null;
      }
    },
    rejectFriendRequest: async (senderId) => {
      try {
        // Gọi API mới /friends/reject-request để từ chối lời mời
        await axios.post("/friends/reject-request", { senderId }, { withCredentials: true });
        toast.success("Đã từ chối lời mời kết bạn");
        get().fetchReceivedRequests();
      } catch (err) {
        console.error("❌ Error rejecting friend request:", err);
        toast.error("Không thể từ chối lời mời");
      }
    },
    setupSocketListeners,
  };
});