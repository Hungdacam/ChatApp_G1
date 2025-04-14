// App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import VerifyOTPPage from "./pages/VerifyOTPPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import useAuthStore from "./store/useAuthStore";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import SearchFriendPage from "./pages/SearchFriendPage";
import AddFriendPage from "./pages/AddFriendPage";
import { useSocketStore } from "./store/useSocketStore";
import { useFriendStore } from "./store/useFriendStore";
import FriendRequestsPage from "./pages/FriendRequestsPage";
const App = () => {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
  const { socket, connectSocket } = useSocketStore();
  const { setupSocketListeners } = useFriendStore();

  useEffect(() => {
    if (authUser) {
      console.log(authUser.token,'.....', authUser._id)
      connectSocket(authUser.token, authUser._id); // Truyền userId
    }
  }, [authUser]);

  useEffect(() => {
    if (socket) {
      setupSocketListeners(); // Chỉ gọi khi socket sẵn sàng
    }
  }, [socket]);

  return (
    <div>
      <Navbar />
      <Routes>
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" replace />} />
        <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" replace />} />
        <Route path="/verify-otp" element={!authUser ? <VerifyOTPPage /> : <Navigate to="/" replace />} />
        <Route path="/forgot-password" element={!authUser ? <ForgotPasswordPage /> : <Navigate to="/login" replace />} />
        <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" replace />} />
        <Route path="/settings" element={authUser ? <SettingsPage /> : <Navigate to="/login" replace />} />
        <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" replace />} />
        <Route path="/search" element={authUser ? <SearchFriendPage /> : <Navigate to="/login" replace />} />
        <Route path="/add-friend" element={authUser ? <AddFriendPage /> : <Navigate to="/login" replace />} />
        <Route path="/friend-requests" element={authUser ? <FriendRequestsPage /> : <Navigate to="/login" replace />} />
      </Routes>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: {
            background: "#333",
            color: "#fff",
          },
        }}
      />
    </div>
  );
};

export default App;