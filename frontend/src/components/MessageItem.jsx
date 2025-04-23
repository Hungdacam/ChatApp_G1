import React, { memo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Paperclip } from 'lucide-react';
import { useMemo } from 'react';
import { useChatStore } from '../store/useChatStore'; // Import store để gọi API
import toast from 'react-hot-toast';

const MessageItem = memo(({ message, currentUserId, isGroupChat }) => {
  const [showOptions, setShowOptions] = useState(false);
  const { recallMessage } = useChatStore(); // Hàm gọi API thu hồi tin nhắn

  const isSentByMe = useMemo(() => {
    if (!message.senderId || !currentUserId) return false;
    if (typeof message.senderId === 'object' && message.senderId._id) {
      return message.senderId._id === currentUserId;
    }
    if (typeof message.senderId === 'string') {
      return message.senderId === currentUserId;
    }
    return false;
  }, [message.senderId, currentUserId]);

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

  const handleRecallMessage = async () => {
    try {
      await recallMessage(message.messageId); // Gọi API thu hồi tin nhắn
      toast.success('Tin nhắn đã được thu hồi');
    } catch (error) {
      console.error('Lỗi khi thu hồi tin nhắn:', error);
      toast.error('Không thể thu hồi tin nhắn');
    }
  };

  return (
    <div
      className={`flex mb-4 ${isSentByMe ? 'justify-end' : 'justify-start'}`}
      onClick={() => setShowOptions(!showOptions)} // Hiển thị tùy chọn khi nhấn vào tin nhắn
    >
      {!isSentByMe && (
        <img
          src={
            typeof message.senderId === 'object'
              ? message.senderId.avatar || '/default-avatar.png'
              : '/default-avatar.png'
          }
          alt={
            typeof message.senderId === 'object'
              ? message.senderId.name || 'User'
              : 'User'
          }
          className="w-8 h-8 rounded-full mr-2 self-end"
        />
      )}

      <div className="relative">
        <div
          className={`max-w-xs rounded-lg p-3 ${
            isSentByMe ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'
          }`}
        >
          {!isSentByMe && isGroupChat && (
            <div className="text-xs font-medium mb-1 text-gray-600">
              {typeof message.senderId === 'object'
                ? message.senderId.name || 'User'
                : 'User'}
            </div>
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

        {/* Hiển thị tùy chọn thu hồi */}
        {showOptions && isSentByMe && (
          <div className="absolute top-0 right-0 mt-2 bg-white border rounded shadow-lg z-10">
            <button
              onClick={handleRecallMessage}
              className="block px-4 py-2 text-sm text-red-500 hover:bg-gray-100"
            >
              Thu hồi tin nhắn
            </button>
          </div>
        )}
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