// ChatContainer.jsx
import React, { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import NoChatSelected from "./NoChatSelected";
import MessageItem from "./MessageItem";
import ForwardMessageModal from './ForwardMessageModal';


const ChatContainer = () => {
  const { messages, getMessages, isMessagesLoading, selectedChat, pinnedMessages,fetchPinnedMessages } = useChatStore();
  const messageEndRef = useRef(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    if (selectedChat?.chatId) {
        const socket = window.socketInstance;
        if (socket) {
            // Join phòng chat để nhận sự kiện
            socket.emit("join_chat", selectedChat.chatId);
            console.log("✅ Joined chat room:", selectedChat.chatId);
       }
        
        getMessages(selectedChat.chatId);
        fetchPinnedMessages(selectedChat.chatId);
        
        // Cleanup: leave chat room khi chuyển chat
        return () => {
            if (socket) {
                socket.emit("leave_chat", selectedChat.chatId);
                console.log("Left chat room:", selectedChat.chatId);
            }
        };
    }
}, [selectedChat, getMessages, fetchPinnedMessages]);

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
             {pinnedMessages && pinnedMessages.length > 0 && (
        <div className="bg-yellow-50 border-b border-yellow-200 p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-yellow-700 text-sm">📌 Tin nhắn đã ghim</span>
            <span className="text-xs text-gray-500">({pinnedMessages.length}/3)</span>
          </div>
          <div className="flex flex-col gap-2">
            {pinnedMessages.map(msg => (
              <div key={msg.messageId} className="bg-white rounded-lg p-2 shadow-sm">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-700">
                        {msg.senderId?.name || "Người dùng"}
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">
                        {msg.pinnedBy?.name ? `Ghim bởi ${msg.pinnedBy.name}` : "Đã ghim"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 truncate">
                      {msg.content || "[Media]"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
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
                  isGroupChat={selectedChat?.isGroupChat || false}
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