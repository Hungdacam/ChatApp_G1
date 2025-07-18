import { create } from "zustand";
import axiosInstance from "../lib/axios";
import { toast } from "react-hot-toast";
import { useSocketStore } from "./useSocketStore";
const useAuthStore = create((set) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  isSendingOTP: false,
  tempSignupData: null,
  tempResetToken: null,

  checkAuth: async () => {
    set({ isCheckingAuth: true });
    try {
      console.log("Bắt đầu kiểm tra auth...");
      const res = await axiosInstance.get("/auth/check", {
        withCredentials: true,
      });
      console.log("Phản hồi từ server:", res.data);
      set({ authUser: res.data.user || res.data });
      if (res.data.user?._id) {
        localStorage.setItem("userId", res.data.user._id);
        localStorage.setItem("userName", res.data.user.name || "");
        localStorage.setItem("userAvatar", res.data.user.avatar || "");
        // Kết nối socket
        useSocketStore.getState().connectSocket(res.data.user._id);
      }
    } catch (error) {
      console.log("Lỗi kiểm tra auth:", error.message);
      set({ authUser: null });
      localStorage.removeItem("userId");
      localStorage.removeItem("userName");
      localStorage.removeItem("userAvatar");
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  sendSignupOTP: async (phone, navigate) => {
    set({ isSendingOTP: true });
    try {
      const formattedPhone = `+84${phone.replace(/^0/, "")}`;
      const res = await axiosInstance.post("/auth/send-otp", { phone: formattedPhone });
      set((state) => ({
        tempSignupData: {
          ...state.tempSignupData,
          phone: formattedPhone,
        },
      }));
      toast.success(res.data.message || "Đã gửi OTP thành công");
      navigate("/verify-otp");
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Không thể gửi OTP.";
      toast.error(errorMessage);
    } finally {
      set({ isSendingOTP: false });
    }
  },

  signup: async (data, navigate) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/verify-signup", data);
      // Kiểm tra và lưu token nếu có
      set({ authUser: res.data.user });
      set({ tempSignupData: null });
      toast.success("Tài khoản đã được tạo thành công! Vui lòng đăng nhập để tiếp tục.");
      navigate("/login");
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Không thể đăng ký.";
      toast.error(errorMessage);
    } finally {
      set({ isSigningUp: false });
    }
  },

  storeTempSignupData: (data) => {
    set({ tempSignupData: data });
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const formattedData = {
        ...data,
        phone: data.phone.startsWith("+") ? data.phone : `+84${data.phone.replace(/^0/, "")}`,
      };
      const res = await axiosInstance.post("/auth/login", formattedData, {
        withCredentials: true,
      });
      console.log("Login response:", res.data); // Debug phản hồi từ backend
      // Lưu thông tin user
      if (res.data.user?._id) {
        localStorage.setItem("userId", res.data.user._id);
        localStorage.setItem("userName", res.data.user.name || "");
        localStorage.setItem("userAvatar", res.data.user.avatar || "");
      } else {
        console.warn("Không tìm thấy user._id trong response!");
      }
      // Chỉ lưu token cho mobile
      if (import.meta.env.VITE_CLIENT_TYPE === "mobile" && res.data.token) {
        localStorage.setItem("authToken", res.data.token);
      } else if (import.meta.env.VITE_CLIENT_TYPE === "web") {
        console.log("Web client: Token được lưu trong cookie HTTP-only");
      }

      set({ authUser: res.data.user || res.data });
      // Kết nối socket và fetch chat list
      if (res.data.user?._id) {
        useSocketStore.getState().connectSocket(res.data.user._id);
      }
      toast.success("Đăng nhập thành công");
    } catch (error) {
      toast.error(error.response?.data?.message || "Đăng nhập thất bại");
    } finally {
      set({ isLoggingIn: false });
    }
  },

  // Trong useAuthStore.js
logout: async () => {
  try {
    await axiosInstance.post("/auth/logout");
    
    // ✅ Clear tất cả dữ liệu liên quan
    localStorage.removeItem("authToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userAvatar");
    set({ authUser: null });
    // Clear call store
    if (window.useCallStore) {
      window.useCallStore.getState().resetClient();
    }
    
    set({ authUser: null });
    toast.success("Đăng xuất thành công");
  } catch (error) {
    toast.error(error.response?.data?.message || "Lỗi khi đăng xuất");
  }
},


  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Cập nhật hồ sơ thành công");
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Lỗi khi cập nhật hồ sơ";
      toast.error(errorMessage);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  // 📌 Gửi OTP cho forgot password
  sendForgotOTP: async (phone) => {
    set({ isSendingOTP: true });
    try {
      const res = await axiosInstance.post("/auth/send-forgot-otp", { phone }); // Không format lại
      toast.success(res.data.message || "Đã gửi OTP quên mật khẩu");
    } catch (error) {
      console.error("Lỗi gửi OTP: ", error);
      toast.error(error.response?.data?.message || "Không thể gửi OTP");
    } finally {
      set({ isSendingOTP: false });
    }
  },
  
  
  

  // 📌 Xác minh OTP để nhận reset token
  verifyForgotOTP: async (phone, code) => {
    try {
      const res = await axiosInstance.post("/auth/verify-otp", { phone, code });
      set({ tempResetToken: res.data.resetToken  }); // lưu resetToken tạm
      toast.success("OTP hợp lệ. Nhập mật khẩu mới.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Xác minh OTP thất bại");
    }
  },

  // 📌 Đổi mật khẩu mới
  resetPassword: async (newPassword, confirmPassword, navigate) => {
    try {
      if (newPassword !== confirmPassword) {
        toast.error("Mật khẩu xác nhận không khớp");
        return;
      }

      const { tempResetToken } = useAuthStore.getState(); // lấy resetToken
      console.log("Sending reset with token:", tempResetToken);

      if (!tempResetToken) {
        toast.error("Thiếu token reset");
        return;
      }

      await axiosInstance.post("/auth/reset-password", {
        resetToken: tempResetToken,
        newPassword,
      });

      toast.success("Đổi mật khẩu thành công. Hãy đăng nhập lại.");
      set({ tempResetToken: null });
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi đổi mật khẩu");
    }
  },
  //doi mat khau trong profile
  changePassword: async ({ currentPassword, newPassword, confirmPassword }) => {
    try {
      const response = await axiosInstance.put('/auth/change-password', {
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (response.status === 200) {
        return { success: true, message: response.data.message || "Mật khẩu đã được thay đổi thành công!" };
      } else {
        return { success: false, message: response.data.message || "Đổi mật khẩu thất bại" };
      }
    } catch (error) {
      console.error("Change password failed:", error);
      return { success: false, message: error.response?.data?.message || "Lỗi hệ thống" };
    }
  },
  //find user
  findOneUser: async (identifier) => {
    try {
      const res = await axiosInstance.post("/auth/find-user-by-phone", {
        phone: identifier,
      });
      return res.data;
    } catch (error) {
      console.error("Error in findOneUser:", error);
      const errorMessage = error.response?.data?.message || "Không thể tìm thấy người dùng.";
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  }
  
}));

export default useAuthStore;