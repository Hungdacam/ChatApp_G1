// MessageItem.jsx
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Paperclip } from 'lucide-react';

const MessageItem = ({ message, currentUserId }) => {
  const isSentByMe = message.senderId._id === currentUserId;
  
  // Format thời gian
  const formattedTime = message.createdAt 
    ? formatDistanceToNow(new Date(message.createdAt), { addSuffix: true, locale: vi }) 
    : '';
  
  // Format kích thước file
  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };
  
  // Hiển thị trạng thái tin nhắn
  const renderStatus = () => {
    if (message.isPending) return "Đang gửi...";
    if (message.isError) return "Lỗi gửi tin nhắn";
    if (message.isRecalled) return "Đã thu hồi";
    return null;
  };

  return (
    <div className={`message-item flex flex-col ${isSentByMe ? 'items-end' : 'items-start'} mb-4`}>
      <div className={`message-content max-w-[70%] ${isSentByMe ? 'bg-blue-500 text-white' : 'bg-gray-200'} rounded-lg px-3 py-2`}>
        {/* Nội dung tin nhắn */}
        {message.content && <div className="message-text">{message.content}</div>}
        
        {/* Hiển thị ảnh nếu có */}
        {message.image && (
          <div className="message-image mt-2">
            <img 
              src={message.image} 
              alt="Hình ảnh" 
              className="rounded-lg max-w-[300px] max-h-[300px] object-contain"
              onLoad={() => console.log("Ảnh đã tải xong")}
              onError={(e) => {
                console.error("Lỗi tải ảnh:", e);
                e.target.onerror = null;
                e.target.src = "https://via.placeholder.com/300?text=Lỗi+tải+ảnh";
              }}
            />
          </div>
        )}
        
        {/* Hiển thị video nếu có */}
        {message.video && (
          <div className="message-video mt-2">
            <video 
              src={message.video} 
              controls 
              className="rounded-lg max-w-[300px] max-h-[300px]"
              onLoadedData={() => console.log("Video đã tải xong")}
              onError={(e) => console.error("Lỗi tải video:", e)}
            >
              Trình duyệt của bạn không hỗ trợ video.
            </video>
          </div>
        )}
        
        {/* Hiển thị file nếu có */}
        {message.fileUrl && (
          <div className="message-file mt-2 flex items-center">
            <Paperclip size={16} className="mr-2" />
            <a 
              href={message.fileUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="file-link underline"
            >
              {message.fileName || "Tải xuống file"}
              {message.fileSize && ` (${formatFileSize(message.fileSize)})`}
            </a>
          </div>
        )}
        
        {/* Hiển thị trạng thái tin nhắn */}
        {renderStatus() && (
          <div className="message-status text-xs mt-1 italic">
            {renderStatus()}
          </div>
        )}
      </div>
      
      {/* Hiển thị thời gian */}
      <div className="message-time text-xs text-gray-500 mt-1">
        {formattedTime}
      </div>
    </div>
  );
};

export default MessageItem;
