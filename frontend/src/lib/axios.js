// Thêm interceptor vào file axios.js để tự động gắn token vào mỗi request
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:3000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "x-client-type": "web",
  },
});

// Thêm interceptor để gắn token từ localStorage vào header
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // hoặc từ nơi bạn lưu token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
