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

  if (isMessagesLoading) {
    return (
      <div className="flex flex-col h-full w-full">
        <ChatHeader />
        <div className="flex-1 overflow-y-auto p-4 w-full">
          {[...Array(5)].map((_, index) => (
            <MessageSkeleton key={index} />
          ))}
        </div>
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-white-900">
      <ChatHeader />
      <div className="flex-1 overflow-y-auto p-4 w-full">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Chưa có tin nhắn nào</p>
          </div>
        ) : (
          messages.map((message) => {
            const isCurrentUser = message.senderId._id === localStorage.getItem("userId");
            return (
              <div key={message.messageId} className={`message ${isCurrentUser ? "sent" : "received"} w-full`}>
                <div className="message-content">
                  {message.video ? (
                    <video src={message.video} controls className="w-full max-w-2xl rounded mb-1" />
                  ) : null}
                  {message.content && (
                    <div className="whitespace-pre-wrap break-words">{message.content}</div>
                  )}

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
