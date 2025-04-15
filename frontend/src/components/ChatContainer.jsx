import React, { useEffect, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import NoChatSelected from "./NoChatSelected";

const ChatContainer = () => {
  const { 
    messages, 
    getMessages, 
    isMessagesLoading, 
    selectedChat 
  } = useChatStore();
  const messageEndRef = useRef(null);

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

  // Hiển thị khung skeleton khi đang tải tin nhắn
  if (isMessagesLoading) {
    return (
      <div className="flex flex-col h-full">
        <ChatHeader />
        <div className="flex-1 overflow-y-auto p-4">
          {[...Array(5)].map((_, index) => (
            <MessageSkeleton key={index} />
          ))}
        </div>
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ChatHeader />
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Chưa có tin nhắn nào</p>
          </div>
        ) : (
          messages.map((message) => {
            const isCurrentUser = message.senderId._id === localStorage.getItem("userId");
            return (
              <div 
                key={message.messageId} 
                className={`message ${isCurrentUser ? "sent" : "received"}`}
              >
                <div className="message-content">
                  {message.content}
                  
                  {/* Hiển thị trạng thái tin nhắn */}
                  {isCurrentUser && (
                    <span className="message-status ml-1 text-xs text-gray-400">
                      {message.isPending && <span title="Đang gửi">⏳</span>}
                      {message.isError && <span title="Lỗi">❌</span>}
                      {!message.isPending && !message.isError && !message.isRead && <span title="Đã gửi">✓</span>}
                      {!message.isPending && !message.isError && message.isRead && <span title="Đã đọc">✓✓</span>}
                    </span>
                  )}
                </div>
                <div className="message-time text-xs text-gray-500">
                  {new Date(message.createdAt).toLocaleTimeString([], { 
                    hour: "2-digit", 
                    minute: "2-digit" 
                  })}
                </div>
              </div>
            );
          })
        )}
        <div ref={messageEndRef} />
      </div>
      <MessageInput />
    </div>
  );
};

export default ChatContainer;
