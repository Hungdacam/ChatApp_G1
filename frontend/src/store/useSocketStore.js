// src/store/useSocketStore.js
import { io } from "socket.io-client";
import { create } from "zustand";

export const useSocketStore = create((set) => ({
  socket: null,

  connectSocket: (token, userId) => {
    if (useSocketStore.getState().socket?.connected) {
      console.log("Socket đã kết nối, bỏ qua kết nối mới");
      return;
    }

    const socket = io("http://localhost:3000", {
      auth: { token },
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("✅ Socket connected", socket.id);
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
    });

    set({ socket });
  },

  disconnectSocket: () => {
    set((state) => {
      state.socket?.disconnect();
      return { socket: null };
    });
  },
}));