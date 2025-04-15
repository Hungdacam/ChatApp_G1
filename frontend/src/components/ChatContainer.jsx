import React, { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import NoChatSelected from "./NoChatSelected";
import MessageItem from "./MessageItem"; // Import component MessageItem

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedChat
  } = useChatStore();
  
  const messageEndRef = useRef(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  
  // Lấy userId từ localStorage khi component mount
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    setCurrentUserId(userId);
  }, []);

  // Lấy tin nhắn khi selectedChat thay đổi
  useEffect(() => {
    if (selectedChat && selectedChat.chatId) {
      console.log("Lấy tin nhắn cho chat:", selectedChat.chatId);
      getMessages(selectedChat.chatId);
    }
  }, [selectedChat, getMessages]);

  // Cuộn xuống cuối danh sách tin nhắn khi có tin nhắn mới
  useEffect(() => {
    if (messageEndRef.current && messages.length > 0) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Hiển thị khi không có chat nào được chọn
  if (!selectedChat) {
    return <NoChatSelected />;
  }

  return (
    <div className="flex flex-col h-full">
      <ChatHeader chat={selectedChat} />
      
      <div className="flex-1 overflow-y-auto p-4">
        {isMessagesLoading ? (
          // Hiển thị skeleton loading khi đang tải tin nhắn
          <div>
            <MessageSkeleton />
            <MessageSkeleton />
            <MessageSkeleton />
          </div>
        ) : messages.length === 0 ? (
          // Hiển thị khi không có tin nhắn
          <div className="flex items-center justify-center h-full text-gray-500">
            Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
          </div>
        ) : (
          // Hiển thị danh sách tin nhắn
          <div>
            {messages.map((message) => (
              <MessageItem 
                key={message.messageId} 
                message={message} 
                currentUserId={currentUserId} 
              />
            ))}
            <div ref={messageEndRef} />
          </div>
        )}
      </div>
      
      <MessageInput />
    </div>
  );
};

export default ChatContainer;
