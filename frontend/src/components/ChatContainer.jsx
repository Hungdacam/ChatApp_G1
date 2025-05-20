// ChatContainer.jsx
import React, { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import NoChatSelected from "./NoChatSelected";
import MessageItem from "./MessageItem";


const ChatContainer = () => {
  const { messages, getMessages, isMessagesLoading, selectedChat } = useChatStore();
  const messageEndRef = useRef(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    console.log("Tất cả các key trong localStorage:", Object.keys(localStorage));
    const userId = localStorage.getItem("userId");
    console.log("userId từ localStorage:", userId);
    setCurrentUserId(userId);
  }, []);
  console.log("currentUserId khi render:", currentUserId);
  useEffect(() => {
    if (selectedChat && selectedChat.chatId) {
      getMessages(selectedChat.chatId);
    }
  }, [selectedChat, getMessages]);

  useEffect(() => {
    if (messageEndRef.current && messages.length > 0) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (!selectedChat) {
    return <NoChatSelected />;
  }

  return (
    
    <div className="chat-container flex flex-col h-full">
             {selectedChat && <ChatHeader chat={selectedChat} />}
      <div className="messages-container flex-1 overflow-y-auto p-4">
        {isMessagesLoading ? (
          <div className="loading-messages">
            <MessageSkeleton />
            <MessageSkeleton />
            <MessageSkeleton />
          </div>
        ) : (
          <>
            {messages
              // Lọc bỏ tin nhắn tạm thời nếu đã có tin nhắn thực từ server
              .filter(msg => {
                // Bỏ qua tin nhắn không hợp lệ
                if (!msg) return false;
                
               // Nếu là tin nhắn tạm thời và đã có tin nhắn thực tương ứng, không hiển thị
              if (msg.isTemp || msg.isPending) {
                const hasSentMessage = messages.some(m => 
                  m && m.content === msg.content && 
                  m.senderId && msg.senderId && 
                  m.senderId._id === msg.senderId._id &&
                  !m.isTemp && !m.isPending
                );
                return !hasSentMessage;
              }
              
              // Nếu là tin nhắn rỗng không có nội dung, không hiển thị
              if (!msg.content && !msg.image && !msg.video && !msg.fileUrl) {
                return false;
              }
              
              return true;
            })
              .map((message) => (
                <MessageItem
                  key={message.messageId || message._id}
                  message={message}
                  currentUserId={currentUserId}
                  isGroupChat={selectedChat.isGroupChat} 
                />
              ))}
            <div ref={messageEndRef} />
          </>
        )}
      </div>
      {selectedChat && <MessageInput />}
    </div>
  );
};

export default ChatContainer;