import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.PROD 
    ? "/api"  // Production (Docker)
    : "http://localhost:3000/api", // Development
  withCredentials: true,
  headers: {
    "x-client-type": "web",
  },
});

// Thêm interceptor để gắn token từ localStorage vào header
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Chỉ thiết lập Content-Type: application/json khi không phải FormData
    if (!(config.data instanceof FormData)) {
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
