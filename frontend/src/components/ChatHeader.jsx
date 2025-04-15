import { useChatStore } from "../store/useChatStore";
import { ArrowLeft, MoreVertical, Phone, Video } from "lucide-react";

const ChatHeader = () => {
  const { selectedChat } = useChatStore();

  // Kiểm tra kỹ hơn để tránh lỗi
  if (!selectedChat || !selectedChat.participants) {
    console.log("selectedChat không hợp lệ:", selectedChat);
    return null;
  }

  // Tìm người dùng khác trong cuộc trò chuyện
  const otherUser = selectedChat.participants.find(
    (p) => p._id !== selectedChat.currentUserId
  );

  // Thêm kiểm tra cho otherUser
  if (!otherUser) {
    console.log("Không tìm thấy người dùng khác trong participants");
    return null;
  }

  return (
    <div className="flex items-center justify-between p-3 border-b">
      <div className="flex items-center">
        <button className="p-1 mr-2 rounded-full hover:bg-gray-100 md:hidden">
          <ArrowLeft size={20} />
        </button>
        <img
          src={otherUser.avatar || "https://via.placeholder.com/40"}
          alt={otherUser.name || "User"}
          className="w-10 h-10 rounded-full mr-3"
        />
        <div>
          <h3 className="font-medium">{otherUser.name || "User"}</h3>
          <p className="text-xs text-gray-500">
            {selectedChat.isOnline ? "Đang hoạt động" : "Không hoạt động"}
          </p>
        </div>
      </div>
      <div className="flex items-center">
        <button className="p-2 rounded-full hover:bg-gray-100">
          <Phone size={20} />
        </button>
        <button className="p-2 rounded-full hover:bg-gray-100">
          <Video size={20} />
        </button>
        <button className="p-2 rounded-full hover:bg-gray-100">
          <MoreVertical size={20} />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
