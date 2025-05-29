import React, { memo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Paperclip, MoreVertical, Reply, Copy, Trash2, Forward } from 'lucide-react';
import { useMemo } from 'react';
import ForwardMessageModal from './ForwardMessageModal';
import toast from 'react-hot-toast';

const MessageItem = memo(({ message, currentUserId, isGroupChat }) => {
  const [showActions, setShowActions] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content);
    toast.success('Đã sao chép tin nhắn');
    setShowActions(false);
  };

  const handleForwardMessage = () => {
    setShowForwardModal(true);
    setShowActions(false);
  };
  
  const isSentByMe = useMemo(() => {
    if (!message.senderId || !currentUserId) return false;
    console.log(message.senderId);
    console.log(currentUserId);
    // Trường hợp senderId là một đối tượng có thuộc tính _id
    if (typeof message.senderId === 'object' && message.senderId._id) {
      return message.senderId._id === currentUserId;
    }
    
    // Trường hợp senderId là một chuỗi ID
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

  return (
    <div className={`flex mb-4 ${isSentByMe ? 'justify-end' : 'justify-start'} group relative`}>
      {!isSentByMe && (
        <img
          src={typeof message.senderId === 'object' ? message.senderId.avatar || '/default-avatar.png' : '/default-avatar.png'}
          alt={typeof message.senderId === 'object' ? message.senderId.name || "User" : "User"}
          className="w-8 h-8 rounded-full mr-2 self-end"
        />
      )}

      <div className="relative">
        <div className={`max-w-xs rounded-lg p-3 ${
          isSentByMe
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {/* Chỉ hiển thị tên người gửi trong chat nhóm và không phải tin nhắn của mình */}
          {!isSentByMe && isGroupChat && (
            <div className="text-xs font-medium mb-1 text-gray-600">
              {typeof message.senderId === 'object' ? message.senderId.name || "User" : "User"}
            </div>
          )}
          
          {/* Hiển thị label "Đã chuyển tiếp" nếu là tin nhắn được chuyển tiếp */}
          {message.isForwarded && (
            <div className="text-xs opacity-75 mb-1 flex items-center gap-1">
              <Forward size={12} />
              Đã chuyển tiếp
            </div>
          )}

          {message.content && (
            <p className="break-words">{message.content}</p>
          )}
          
          {renderMedia()}

          {renderStatus() && renderStatus() !== "Đang tải nội dung..." && (
            <div className="message-status">{renderStatus()}</div>
          )}

          <p className="text-xs text-right mt-1 opacity-70">{formattedTime}</p>
        </div>

        {/* Menu actions */}
        <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-1 rounded-full hover:bg-gray-200"
          >
            <MoreVertical size={16} />
          </button>
          
          {showActions && (
            <div className="absolute right-0 top-8 bg-white border rounded-lg shadow-lg py-1 z-10">
              <button
                onClick={handleForwardMessage}
                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full text-left"
              >
                <Forward size={16} />
                Chuyển tiếp
              </button>
              <button
                onClick={handleCopyMessage}
                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full text-left"
              >
                <Copy size={16} />
                Sao chép
              </button>
              {isSentByMe && (
                <button
                  onClick={() => {/* Handle delete */}}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full text-left text-red-600"
                >
                  <Trash2 size={16} />
                  Xóa
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Forward Modal */}
      <ForwardMessageModal
        isOpen={showForwardModal}
        onClose={() => setShowForwardModal(false)}
        messageToForward={message}
      />
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.message.messageId === nextProps.message.messageId &&
         prevProps.message.isPending === nextProps.message.isPending &&
         prevProps.message.isError === nextProps.message.isError &&
         prevProps.message.image === nextProps.message.image &&
         prevProps.message.video === nextProps.message.video;
});

MessageItem.displayName = 'MessageItem';
export default MessageItem;