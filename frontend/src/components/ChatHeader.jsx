import { useChatStore } from "../store/useChatStore";
import { useFriendStore } from "../store/useFriendStore";
import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, MoreVertical, Users } from "lucide-react";
import GroupChatInfo from './GroupChatInfo';
import StartCallButton from './StartCallButton';
import StartGroupCallButton from './StartGroupCallButton';

const ChatHeader = () => {
  const { selectedChat } = useChatStore();
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
  const otherUser = selectedChat.participants.find(
    (p) => p._id !== selectedChat.currentUserId
  );

  if (isGroupChat) {
    return (
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button onClick={() => window.history.back()} className="text-gray-600">
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
              <Users size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold">{selectedChat.groupName}</h3>
              <p className="text-sm text-gray-500">
                {selectedChat.participants.length} thành viên
              </p>
              <p className="text-xs text-gray-400">
                {selectedChat.isOnline ? "Đang hoạt động" : "Không hoạt động"}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StartGroupCallButton 
            chatId={selectedChat.chatId}
            className="text-gray-600 hover:text-blue-600 p-2 rounded-full hover:bg-gray-100"
          />
          <button 
            onClick={() => setShowGroupInfo(true)}
            className="text-gray-600 hover:text-blue-600 p-2 rounded-full hover:bg-gray-100"
          >
            <MoreVertical size={20} />
          </button>
        </div>
        {showGroupInfo && (
          <GroupChatInfo onClose={() => setShowGroupInfo(false)} />
        )}
      </div>
    );
  }

  if (!otherUser) {
    console.log("Không tìm thấy người dùng khác trong participants");
    return null;
  }

  // Hàm xử lý hủy kết bạn
  const handleUnfriend = async () => {
    setShowMenu(false);
    await unfriend(otherUser._id);
    // Có thể thêm logic chuyển màn hình hoặc reload chat list nếu cần
  };

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
      <div className="flex items-center relative">
        <div className="flex items-center gap-4">
          <StartCallButton 
            chatId={selectedChat.chatId}
            className="text-gray-600 hover:text-blue-500"
          />
        </div>
        <button
          className="p-2 rounded-full hover:bg-gray-100"
          onClick={() => setShowMenu((v) => !v)}
        >
          <MoreVertical size={20} />
        </button>
        {showMenu && (
          <div
            ref={menuRef}
            className="absolute right-0 top-12 bg-white border rounded shadow-md z-10 min-w-[140px]"
          >
            <button
              onClick={handleUnfriend}
              className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
            >
              Hủy kết bạn
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHeader;