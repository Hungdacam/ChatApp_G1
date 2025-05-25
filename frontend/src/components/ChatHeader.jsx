import { useChatStore } from "../store/useChatStore";
import React, { useState } from 'react';
import { ArrowLeft, MoreVertical, Phone, Video,Users  } from "lucide-react";
import GroupChatInfo from './GroupChatInfo';
import StartCallButton from './StartCallButton';
import StartGroupCallButton from './StartGroupCallButton';
const ChatHeader = () => {
  const { selectedChat } = useChatStore();
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  // Kiểm tra kỹ hơn để tránh lỗi
  if (!selectedChat || !selectedChat.participants) {
    console.log("selectedChat không hợp lệ:", selectedChat);
    return null;
  }
  const isGroupChat = selectedChat.isGroupChat;
  // Tìm người dùng khác trong cuộc trò chuyện
  const otherUser = selectedChat.participants.find(
    (p) => p._id !== selectedChat.currentUserId
  );
  // Nếu là chat nhóm, hiển thị thông tin nhóm
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

      {/* Thêm phần này cho các nút action */}
      <div className="flex items-center gap-2">
        {/* Icon phone cho group video call */}
        <StartGroupCallButton 
          chatId={selectedChat.chatId}
          className="text-gray-600 hover:text-blue-600 p-2 rounded-full hover:bg-gray-100"
        />
        
        {/* Icon thông tin group */}
        <button 
          onClick={() => setShowGroupInfo(true)}
          className="text-gray-600 hover:text-blue-600 p-2 rounded-full hover:bg-gray-100"
        >
          <MoreVertical size={20} />
        </button>
      </div>

      {/* Modal thông tin group */}
      {showGroupInfo && (
        <GroupChatInfo onClose={() => setShowGroupInfo(false)} />
      )}
    </div>
  );
}
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
         <div className="flex items-center gap-4">

        {/* Thay thế nút Video bằng StartCallButton */}
        <StartCallButton 
           chatId={selectedChat.chatId}
          className="text-gray-600 hover:text-blue-500"
        />
      </div>
        <button className="p-2 rounded-full hover:bg-gray-100">
          <MoreVertical size={20} />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
