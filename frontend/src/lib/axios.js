import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL;

const axiosInstance = axios.create({
  baseURL,  // sử dụng trực tiếp VITE_API_URL
  withCredentials: true,
  headers: { "x-client-type": "web" },
});

axiosInstance.interceptors.request.use(
  config => {
    const token = localStorage.getItem("authToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (!(config.data instanceof FormData)) config.headers["Content-Type"] = "application/json";
    return config;
  },
  error => Promise.reject(error)
);

export default axiosInstance;
