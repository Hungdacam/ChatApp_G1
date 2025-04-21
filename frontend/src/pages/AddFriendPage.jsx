import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Phone, User, Calendar, Heart, MessageCircle } from "lucide-react";
import useAuthStore from "../store/useAuthStore";
import { toast } from "react-hot-toast";
import { useFriendStore } from "../store/useFriendStore";

const AddFriendPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { authUser } = useAuthStore();
  const { 
    sendFriendRequest, 
    cancelFriendRequest, 
    fetchSentRequests, 
    fetchFriends,
    sentRequests,
    friends,
    checkFriendshipStatus
  } = useFriendStore();
  
  const friend = location.state?.friend;
  const [friendshipStatus, setFriendshipStatus] = useState('none'); // 'none', 'pending', 'friend'
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImg, setSelectedImg] = useState(friend?.avatar);

  useEffect(() => {
    // Tải cả danh sách bạn bè và lời mời đã gửi
    fetchSentRequests();
    fetchFriends();
  }, []);

  useEffect(() => {
    if (friend?._id) {
      const status = checkFriendshipStatus(friend._id);
      setFriendshipStatus(status);
    }
  }, [sentRequests, friends, friend]);

  const handleAddOrCancel = async () => {
    setIsLoading(true);
    try {
      if (friendshipStatus === 'pending') {
        const success = await cancelFriendRequest(friend._id);
        if (success) {
          toast.success("Đã hủy lời mời kết bạn");
          setFriendshipStatus('none');
        }
      } else if (friendshipStatus === 'none') {
        const success = await sendFriendRequest(friend._id);
        if (success) {
          toast.success("Đã gửi lời mời kết bạn");
          setFriendshipStatus('pending');
        }
      }
    } catch (err) {
      toast.error("Lỗi khi xử lý lời mời kết bạn");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartChat = () => {
    navigate("/chat", { state: { friend } });
  };

  // Render button dựa vào trạng thái friendship
  const renderActionButton = () => {
    if (friendshipStatus === 'friend') {
      return (
        <div className="flex gap-3">
          <button 
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium"
            disabled
          >
            Đã kết bạn
          </button>
          <button 
            onClick={handleStartChat}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
          >
            <MessageCircle size={18} /> Nhắn tin
          </button>
        </div>
      );
    } else if (friendshipStatus === 'pending') {
      return (
        <button 
          onClick={handleAddOrCancel}
          disabled={isLoading}
          className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-medium"
        >
          {isLoading ? "Đang xử lý..." : "Hủy lời mời"}
        </button>
      );
    } else {
      return (
        <button 
          onClick={handleAddOrCancel}
          disabled={isLoading}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium"
        >
          {isLoading ? "Đang xử lý..." : "Kết bạn"}
        </button>
      );
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl m-4">
      <div className="p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Chi tiết người dùng</h2>
        </div>
        
        <div className="flex flex-col items-center mb-6">
          <img 
            src={selectedImg || "/default-avatar.png"} 
            alt="Avatar" 
            className="w-32 h-32 rounded-full object-cover border-4 border-blue-500"
          />
          <h3 className="mt-4 text-xl font-semibold">{friend?.name}</h3>
        </div>
        
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-3">
            <Phone className="text-blue-500" />
            <span>{friend?.phone || "Chưa cập nhật"}</span>
          </div>
          <div className="flex items-center gap-3">
            <User size={20} className="text-primary" />
            <span>{friend?.gender || "Không xác định"}</span>
          </div>
          {friend?.dob && (
            <div className="flex items-center gap-3">
              <Calendar size={20} className="text-primary" />
              <span>{new Date(friend.dob).toLocaleDateString('vi-VN')}</span>
            </div>
          )}
        </div>
        
        <div className="flex justify-center">
          {renderActionButton()}
        </div>
      </div>
    </div>
  );
};

export default AddFriendPage;
