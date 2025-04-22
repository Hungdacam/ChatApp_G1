import { Platform } from "react-native";
import { io } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

const getServerURL = () => {
  if (Platform.OS === "android") {
    return "http://10.0.2.2:3000"; // Android Emulator
  }
  return "http://192.168.1.11:3000"; // iOS hoặc thiết bị thực
};

const socket = io(getServerURL(), {
  transports: ["websocket"],
  forceNew: false, // Thay vì true để duy trì kết nối ổn định
  autoConnect: false, // Không tự động kết nối, chờ xác thực
});

// Hàm để khởi tạo socket với token
const initializeSocket = async () => {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) {
      console.log("❌ Không tìm thấy token, không thể khởi tạo socket");
      return;
    }
    const parsedToken = JSON.parse(token);

    socket.auth = { token: parsedToken.token }; // Gửi token khi kết nối
    socket.connect(); // Kích hoạt kết nối

    socket.on("connect", () => {
      console.log("📡 Đã kết nối đến socket server với ID:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.log("❌ Lỗi kết nối socket:", err.message);
    });
  } catch (error) {
    console.error("Lỗi khởi tạo socket:", error);
  }
};

// Gọi hàm khởi tạo khi ứng dụng khởi động
initializeSocket();

export default socket;