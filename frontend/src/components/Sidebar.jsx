// Sidebar.jsx
import { useEffect, useState } from "react";
import { Users, UserPlus } from "lucide-react";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { useChatStore } from "../store/useChatStore";
import { useSocketStore } from "../store/useSocketStore";
import toast from "react-hot-toast";
import CreateGroupModal from "./CreateGroupModal";

const Sidebar = () => {
  const { chats, isChatsLoading, selectChat, selectedChat, error, fetchChatList } = useChatStore();
  const { onlineUsers } = useSocketStore();

  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  
  // Fetch chat list nếu cần
  useEffect(() => {
    if (chats.length === 0 && !isChatsLoading && !hasAttemptedFetch) {
      console.log("Sidebar: Không có chats, gọi fetchChatList lần đầu");
      fetchChatList();
      setHasAttemptedFetch(true);
    }
  }, [fetchChatList, chats.length, isChatsLoading, hasAttemptedFetch]);

  useEffect(() => {
    console.log("Trạng thái chats trong Sidebar:", chats);
    console.log("Trạng thái onlineUsers:", onlineUsers);
    console.log("selectedChat hiện tại:", selectedChat);
    
    if (error) {
      toast.error(error);
    }
  }, [error, chats, onlineUsers, selectedChat]);

  useEffect(() => {
    console.log("Danh sách chats thay đổi, cập nhật Sidebar:", chats);
  }, [chats, selectedChat]);
  // Đảm bảo chats và onlineUsers là mảng
  const safeChats = Array.isArray(chats) ? chats : [];
  const safeOnlineUsers = Array.isArray(onlineUsers) ? onlineUsers : [];

  const filteredChats = showOnlineOnly
    ? safeChats.filter((chat, index, self) => {
      if (!chat || chat.isGroupChat === undefined || chat.isGroupChat) return false;
        const otherParticipant = chat.participants?.find(
          (p) => p._id?.toString() !== chat.currentUserId?.toString()
        );
        return otherParticipant && 
        safeOnlineUsers.includes(otherParticipant._id) && 
        index === self.findIndex(c => c.chatId === chat.chatId);
})
: safeChats.filter((chat, index, self) => 
 // Chỉ lọc để loại bỏ trùng lặp
 index === self.findIndex(c => c.chatId === chat.chatId)
);

  console.log("filteredChats:", filteredChats);

  const onlineChatsCount = safeChats.filter((chat) => {
    if (!chat || chat.isGroupChat) return false; 
    const otherParticipant = chat.participants?.find(
      (p) => p._id?.toString() !== chat.currentUserId?.toString()
    );
    return otherParticipant && safeOnlineUsers.includes(otherParticipant._id);
  }).length;

  const handleSelectChat = (chat) => {
    console.log("Đã chọn chat:", chat);
    selectChat(chat); // Truyền toàn bộ đối tượng chat
  };

  // Hàm để lấy tên và avatar cho chat (xử lý cả chat đơn và chat nhóm)
  const getChatDisplayInfo = (chat) => {
    if (!chat) {
      return {
        name: "Không có dữ liệu",
        avatar: "/avatar.png",
        isOnline: false
      };
    }
    if (chat.isGroupChat) {
      return {
        name: chat.groupName || chat.name || "Nhóm chat",
        avatar: chat.avatar || "/group-avatar.png",
        isOnline: false // Nhóm không có trạng thái online
      };
    } else {
      const otherParticipant = chat.participants?.find(
        (p) => p._id?.toString() !== chat.currentUserId?.toString()
      );
      
      return {
        name: otherParticipant?.name || "Người dùng",
        avatar: otherParticipant?.avatar || "/avatar.png",
        isOnline: otherParticipant && safeOnlineUsers.includes(otherParticipant._id)
      };
    }
  };

  if (isChatsLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2">
          <Users className="size-6" />
          <span className="font-medium hidden lg:block">Chats</span>
          <button
            onClick={() => setShowCreateGroup(true)}
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 ml-auto"
            title="Tạo nhóm mới"
          >
            <UserPlus size={20} />
          </button>
        </div>
        <div className="mt-3 hidden lg:flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="text-sm">Show online only</span>
          </label>
          <span className="text-xs text-zinc-500">({onlineChatsCount} online)</span>
        </div>
      </div>

      <div className="overflow-y-auto w-full py-3">
      {filteredChats.length > 0 ? (
        filteredChats
          .filter(chat => chat !== undefined && chat !== null)
          .map((chat) => {
            console.log("Đang render chat:", chat);
            const { name, avatar, isOnline } = getChatDisplayInfo(chat);

            return (
              <button
                key={chat.chatId || `temp-${Math.random()}`}
                onClick={() => handleSelectChat(chat)}
                className={`
                  w-full p-3 flex items-center gap-3
                  hover:bg-base-300 transition-colors
                  ${
                    selectedChat?.chatId === chat.chatId
                      ? "bg-base-300 ring-1 ring-base-300"
                      : ""
                  }
                `}
              >
                <div className="relative mx-auto lg:mx-0">
                  <img
                    src={avatar}
                    alt={name}
                    className="size-12 object-cover rounded-full"
                  />
                  {isOnline && (
                    <span
                      className="absolute bottom-0 right-0 size-3 bg-green-500 
                      rounded-full ring-2 ring-zinc-900"
                    />
                  )}
                  {chat.isGroupChat && (
                    <span
                      className="absolute bottom-0 right-0 size-4 bg-blue-500 
                      rounded-full ring-2 ring-zinc-900 flex items-center justify-center"
                    >
                      <Users size={10} className="text-white" />
                    </span>
                  )}
                </div>

                <div className="hidden lg:block text-left min-w-0">
                  <div className="font-medium truncate">
                    {name}
                    {chat.isGroupChat && <span className="text-xs text-zinc-500 ml-1">
                      ({chat.participants?.length || 0})
                    </span>}
                  </div>
                  <div className="text-sm text-zinc-400 truncate">
                    {chat.lastMessage ? chat.lastMessage : "No messages yet"}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {chat.isGroupChat 
                      ? `${chat.participants?.length || 0} thành viên` 
                      : (isOnline ? "Online" : "Offline")}
                  </div>
                </div>
              </button>
            ) ;
          })
        ).filter(Boolean) : (
          <div className="text-center text-zinc-500 py-4">
            {showOnlineOnly ? "No online chats" : "No chats found"}
          </div>
        )}
      </div>
      
      {showCreateGroup && (
        <CreateGroupModal onClose={() => setShowCreateGroup(false)} />
      )}
    </aside>
  );
};

export default Sidebar;
