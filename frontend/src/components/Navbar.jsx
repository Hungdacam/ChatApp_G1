// src/components/Navbar.jsx
import { Link, useNavigate } from "react-router-dom";
import { LogOut, Search, Users } from "lucide-react";
import useAuthStore from "../store/useAuthStore";
import {useFriendStore} from "../store/useFriendStore";
import { useEffect } from "react";

const Navbar = () => {
  const navigate = useNavigate();
  const { authUser, logout } = useAuthStore();
  const { receivedRequests, fetchReceivedRequests } = useFriendStore();

  useEffect(() => {
    if (authUser) {
      fetchReceivedRequests();
    }
  }, [authUser]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-base-200 p-4 shadow-md">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-primary">
          Chat App
        </Link>

        {authUser ? (
          <div className="flex items-center gap-4">
            <Link to="/search" className="relative">
              <Search className="w-6 h-6 text-zinc-500 hover:text-primary transition-colors" />
            </Link>

            <Link to="/friend-requests" className="relative">
              <Users className="w-6 h-6 text-zinc-500 hover:text-primary transition-colors" />
              {receivedRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {receivedRequests.length}
                </span>
              )}
            </Link>

            <Link to="/profile">
              <img
                src={authUser.avatar || "/avatar.png"}
                alt="Avatar"
                className="size-8 rounded-full object-cover border-2 border-primary"
              />
            </Link>

            <button onClick={handleLogout}>
              <LogOut className="w-6 h-6 text-zinc-500 hover:text-red-500 transition-colors" />
            </button>
          </div>
        ) : (
          <div className="flex gap-4">
            <Link to="/login" className="text-zinc-500 hover:text-primary">
              Đăng nhập
            </Link>
            <Link to="/signup" className="text-zinc-500 hover:text-primary">
              Đăng ký
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;