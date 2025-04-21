// MessageItem.jsx
import React, { memo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Paperclip } from 'lucide-react';

const MessageItem = memo(({ message, currentUserId }) => {
  const isSentByMe = message.senderId && message.senderId._id === currentUserId;
  const formattedTime = message.createdAt 
    ? formatDistanceToNow(new Date(message.createdAt), { addSuffix: true, locale: vi }) 
    : '';

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const renderStatus = () => {
    if (message.isPending) return "Đang gửi...";
    if (message.isError) return "Lỗi gửi tin nhắn";
    if (message.isRecalled) return "Đã thu hồi";
    if (!message.content && !message.image && !message.video && !message.fileUrl && !message.fileName) {
      return "đang tải nội dung"; // Placeholder nếu tin nhắn rỗng
    }
    return null;
  };

  const renderMedia = () => {
    if (message.image) {
      return (
        <div className="mb-2">
          <img 
            src={message.image} 
            alt="Hình ảnh" 
            className="rounded-md max-w-[250px] max-h-[250px] object-contain"
            onError={(e) => {
              console.error("Lỗi khi tải ảnh:", e);
              e.target.src = "/images/image-error.png";
            }}
          />
        </div>
      );
    }

    if (message.video) {
      return (
        <div className="mb-2">
          <video 
            src={message.video} 
            controls 
            className="rounded-md max-w-[250px] max-h-[250px]"
            onError={(e) => {
              console.error("Lỗi khi tải video:", e);
            }}
          />
        </div>
      );
    }

    if (message.fileUrl || message.fileName) {
      return (
        <div className="flex items-center gap-2 mb-2 p-2 bg-gray-100 rounded-md">
          <Paperclip size={16} />
          <div>
            <a 
              href={message.fileUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              {message.fileName || "Tải xuống tệp"}
            </a>
            {message.fileSize && (
              <p className="text-xs text-gray-500">{formatFileSize(message.fileSize)}</p>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className={`flex mb-4 ${isSentByMe ? 'justify-end' : 'justify-start'}`}>
      {!isSentByMe && message.senderId && (
        <div className="mr-2">
          <img 
            src={message.senderId.avatar || "https://via.placeholder.com/40"} 
            alt={message.senderId.name || "User"} 
            className="w-10 h-10 rounded-full"
          />
        </div>
      )}

      <div className={`max-w-[70%] ${isSentByMe ? 'bg-blue-500 text-white' : 'bg-gray-200'} rounded-lg p-3`}>
        {!isSentByMe && message.senderId && (
          <p className="text-xs font-medium mb-1">{message.senderId.name || "User"}</p>
        )}

        {renderMedia()}

        {message.content && !message.content.includes('[Image]') && !message.content.includes('[Video]') && (
          <p>{message.content}</p>
        )}

        {renderStatus() && renderStatus() !== "Đang tải nội dung..." && (
          <div className="message-status">{renderStatus()}</div>
        )}


        <p className="text-xs text-right mt-1 opacity-70">{formattedTime}</p>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.message.messageId === nextProps.message.messageId &&
         prevProps.message.isPending === nextProps.message.isPending &&
         prevProps.message.isError === nextProps.message.isError &&
         prevProps.message.image === nextProps.message.image &&
         prevProps.message.video === nextProps.message.video;
});

export default MessageItem;