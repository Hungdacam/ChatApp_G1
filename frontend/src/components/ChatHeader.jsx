import { useChatStore } from "../store/useChatStore";
import { useSocketStore } from "../store/useSocketStore"; // Thêm import này
import { useFriendStore } from "../store/useFriendStore";
import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, MoreVertical, Users } from "lucide-react";
import GroupChatInfo from './GroupChatInfo';
import StartCallButton from './StartCallButton';
import StartGroupCallButton from './StartGroupCallButton';

const ChatHeader = () => {
  const { selectedChat, setSelectedChat } = useChatStore();
  const { onlineUsers } = useSocketStore(); // Thêm dòng này
  const { unfriend } = useFriendStore();
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  if (!selectedChat || !selectedChat.participants) {
    console.log("selectedChat không hợp lệ:", selectedChat);
    return null;
  }

  const isGroupChat = selectedChat.isGroupChat;
  const currentUserId = localStorage.getItem("userId"); // ✅ Lấy từ localStorage
  
  // ✅ Sửa logic lấy otherUser
  const otherUser = selectedChat.participants.find(
    (p) => p._id !== currentUserId
  );
  
  // ✅ Kiểm tra trạng thái online từ onlineUsers store
  const isUserOnline = otherUser && onlineUsers.includes(otherUser._id);

  if (isGroupChat) {
    return (
      <div className="w-full p-3 border-b border-base-300">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedChat(null)} className="lg:hidden">
            <ArrowLeft size={24} />
          </button>
          
          <div className="flex items-center gap-3 flex-1">
            <div className="avatar">
              <div className="size-10 rounded-full">
                <img
                  src={selectedChat.avatar || "/group-avatar.png"}
                  alt={selectedChat.groupName || selectedChat.name || "Group"}
                />
              </div>
            </div>
            
            <div>
              {/* ✅ Thêm fallback cho tên nhóm */}
              <h3 className="font-medium">
                {selectedChat.groupName || selectedChat.name || "Nhóm chat"}
              </h3>
              <p className="text-sm text-base-content/70">
                {selectedChat.participants?.length || 0} thành viên
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <StartGroupCallButton />
            <button
              onClick={() => setShowGroupInfo(true)}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <Users size={20} />
            </button>
          </div>
        </div>
        
        {showGroupInfo && (
          <GroupChatInfo 
            chat={selectedChat} 
            onClose={() => setShowGroupInfo(false)} 
          />
        )}
      </div>
    );
  }

  return (
    <div className="w-full p-3 border-b border-base-300">
      <div className="flex items-center gap-3">
        <button onClick={() => setSelectedChat(null)} className="lg:hidden">
          <ArrowLeft size={24} />
        </button>
        
        <div className="flex items-center gap-3 flex-1">
          <div className="avatar">
            <div className="size-10 rounded-full">
              <img
                src={otherUser?.avatar || "/avatar.png"}
                alt={otherUser?.name || "User"}
              />
            </div>
          </div>
          
          <div>
            <h3 className="font-medium">{otherUser?.name || "User"}</h3>
            <p className="text-sm text-base-content/70">
              {/* ✅ Sử dụng isUserOnline thay vì selectedChat.isOnline */}
              {isUserOnline ? "Đang hoạt động" : "Không hoạt động"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <StartCallButton otherUser={otherUser} />
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <MoreVertical size={20} />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-base-100 rounded-lg shadow-lg border border-base-300 z-50">
                <button
                  onClick={() => {
                    unfriend(otherUser._id);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-base-200 text-error rounded-lg"
                >
                  Hủy kết bạn
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;