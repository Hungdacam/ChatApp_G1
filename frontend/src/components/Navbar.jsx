// src/components/Navbar.jsx
import { Link, useNavigate } from "react-router-dom";
import { LogOut, MessageSquare, Settings, UserPlus, Users } from "lucide-react";
import useAuthStore from "../store/useAuthStore";
import { useFriendStore } from "../store/useFriendStore";
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
    <header className="bg-base-100 border-b border-base-300 fixed w-full top-0 z-40 backdrop-blur-lg bg-base-100/80">
      <div className="container mx-auto px-4 h-16">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="flex items-center gap-2.5 hover:opacity-80 transition-all"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-lg font-bold">Shiba Talk</h1>
            </Link>
          </div>

          {authUser ? (
            <div className="flex items-center gap-2">
              <Link to="/settings" className="btn btn-sm gap-2 transition-colors">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </Link>

              <Link to="/search" className="btn btn-sm gap-2">
                <UserPlus className="size-5" />
                <span className="hidden sm:inline">Add Friend</span>
              </Link>

              <Link to="/friend-requests" className="btn btn-sm gap-2 relative">
                <Users className="size-5" />
                <span className="hidden sm:inline">Friend Requests</span>
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

              <button className="flex gap-2 items-center" onClick={handleLogout}>
                <LogOut className="size-5" />
                <span className="hidden sm:inline">Logout</span>
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
      </div>
    </header>
  );
};

export default Navbar;
