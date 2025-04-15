// Sidebar.jsx
import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { useChatStore } from "../store/useChatStore";
import { useSocketStore } from "../store/useSocketStore";
import toast from "react-hot-toast";

const Sidebar = () => {
  const { chats, isChatsLoading, selectChat, selectedChat, error, fetchChatList } = useChatStore();
  const { onlineUsers } = useSocketStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

  // Fetch chat list nếu cần
  useEffect(() => {
    if (chats.length === 0 && !isChatsLoading) {
      fetchChatList();
    }
  }, [fetchChatList, chats.length, isChatsLoading]);

  useEffect(() => {
    console.log("Trạng thái chats trong Sidebar:", chats);
    console.log("Trạng thái onlineUsers:", onlineUsers);
    console.log("selectedChat hiện tại:", selectedChat);
    
    if (error) {
      toast.error(error);
    }
  }, [error, chats, onlineUsers, selectedChat]);

  // Đảm bảo chats và onlineUsers là mảng
  const safeChats = Array.isArray(chats) ? chats : [];
  const safeOnlineUsers = Array.isArray(onlineUsers) ? onlineUsers : [];

  const filteredChats = showOnlineOnly
    ? safeChats.filter((chat) => {
        const otherParticipant = chat.participants?.find(
          (p) => p._id?.toString() !== chat.currentUserId?.toString()
        );
        return otherParticipant && safeOnlineUsers.includes(otherParticipant._id);
      })
    : safeChats;

  console.log("filteredChats:", filteredChats);

  const onlineChatsCount = safeChats.filter((chat) => {
    const otherParticipant = chat.participants?.find(
      (p) => p._id?.toString() !== chat.currentUserId?.toString()
    );
    return otherParticipant && safeOnlineUsers.includes(otherParticipant._id);
  }).length;

  const handleSelectChat = (chat) => {
    console.log("Đã chọn chat:", chat);
    selectChat(chat); // Truyền toàn bộ đối tượng chat
  };

  if (isChatsLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2">
          <Users className="size-6" />
          <span className="font-medium hidden lg:block">Chats</span>
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
          filteredChats.map((chat) => {
            console.log("Đang render chat:", chat);
            const otherParticipant = chat.participants?.find(
              (p) => p._id?.toString() !== chat.currentUserId?.toString()
            );

            return (
              <button
                key={chat.chatId}
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
                    src={chat.avatar || "/avatar.png"}
                    alt={chat.name}
                    className="size-12 object-cover rounded-full"
                  />
                  {otherParticipant && safeOnlineUsers.includes(otherParticipant._id) && (
                    <span
                      className="absolute bottom-0 right-0 size-3 bg-green-500 
                      rounded-full ring-2 ring-zinc-900"
                    />
                  )}
                </div>

                <div className="hidden lg:block text-left min-w-0">
                  <div className="font-medium truncate">{chat.name}</div>
                  <div className="text-sm text-zinc-400 truncate">
                    {chat.lastMessage ? chat.lastMessage : "No messages yet"}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {otherParticipant && safeOnlineUsers.includes(otherParticipant._id)
                      ? "Online"
                      : "Offline"}
                  </div>
                </div>
              </button>
            );
          })
        ) : (
          <div className="text-center text-zinc-500 py-4">
            {showOnlineOnly ? "No online chats" : "No chats found"}
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
