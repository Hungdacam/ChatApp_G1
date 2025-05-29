import React, { useState } from 'react';
import { useChatStore } from '../store/useChatStore';
import { X, Search, Users, User, Image, Video, File } from 'lucide-react';
import toast from 'react-hot-toast';

const ForwardMessageModal = ({ isOpen, onClose, messageToForward }) => {
  const { chats, sendMessage } = useChatStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChats, setSelectedChats] = useState([]);
  const [isForwarding, setIsForwarding] = useState(false);
  const [includeCaption, setIncludeCaption] = useState(true); // Tùy chọn bao gồm caption

  const filteredChats = chats.filter(chat => 
    chat.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.groupName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleChatSelect = (chat) => {
    setSelectedChats(prev => {
      const isSelected = prev.some(c => c.chatId === chat.chatId);
      if (isSelected) {
        return prev.filter(c => c.chatId !== chat.chatId);
      } else {
        if (prev.length >= 5) {
          toast.error('Chỉ có thể chuyển tiếp tối đa 5 cuộc trò chuyện');
          return prev;
        }
        return [...prev, chat];
      }
    });
  };

const handleForward = async () => {
  if (selectedChats.length === 0) {
    toast.error('Vui lòng chọn ít nhất một cuộc trò chuyện');
    return;
  }

  setIsForwarding(true);
  try {
    for (const chat of selectedChats) {
      // Chuẩn bị nội dung chuyển tiếp
      let forwardContent = "";
      
      if (includeCaption && messageToForward.content) {
        forwardContent = messageToForward.content;
      }

      console.log("Chuyển tiếp đến chat:", chat.chatId);
      console.log("Message to forward:", messageToForward);

      await sendMessage({
        chatId: chat.chatId,
        content: forwardContent,
        isForwarded: true,
        originalMessage: messageToForward
      });
    }
    
    toast.success(`Đã chuyển tiếp tin nhắn đến ${selectedChats.length} cuộc trò chuyện`);
    onClose();
    setSelectedChats([]);
    setSearchTerm('');
  } catch (error) {
    console.error('Lỗi chi tiết khi chuyển tiếp:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    toast.error('Không thể chuyển tiếp tin nhắn: ' + (error.response?.data?.message || error.message));
  } finally {
    setIsForwarding(false);
  }
};



  // Hiển thị preview của tin nhắn sẽ chuyển tiếp
  const renderMessagePreview = () => {
    return (
      <div className="bg-gray-50 p-3 rounded-lg mb-4">
        <div className="text-sm text-gray-600 mb-2">Tin nhắn sẽ chuyển tiếp:</div>
        <div className="border-l-4 border-blue-500 pl-3">
          {/* Hiển thị media */}
          {messageToForward.image && (
            <div className="mb-2">
              <img 
                src={messageToForward.image} 
                alt="Preview" 
                className="w-16 h-16 object-cover rounded"
              />
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                <Image size={12} />
                <span>Hình ảnh</span>
              </div>
            </div>
          )}
          
          {messageToForward.video && (
            <div className="mb-2">
              <video 
                src={messageToForward.video} 
                className="w-16 h-16 object-cover rounded"
              />
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                <Video size={12} />
                <span>Video</span>
              </div>
            </div>
          )}
          
          {messageToForward.fileUrl && (
            <div className="mb-2">
              <div className="flex items-center gap-2 p-2 bg-gray-100 rounded">
                <File size={16} />
                <span className="text-sm">{messageToForward.fileName || "File"}</span>
              </div>
            </div>
          )}

          {/* Hiển thị nội dung text */}
          {messageToForward.content && (
            <p className="text-sm text-gray-800">{messageToForward.content}</p>
          )}
        </div>

        {/* Tùy chọn bao gồm caption cho media */}
        {(messageToForward.image || messageToForward.video) && messageToForward.content && (
          <div className="mt-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={includeCaption}
                onChange={(e) => setIncludeCaption(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Bao gồm chú thích</span>
            </label>
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Chuyển tiếp tin nhắn</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          {/* Message Preview */}
          {renderMessagePreview()}

          {/* Search */}
          <div className="relative mb-4">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm cuộc trò chuyện..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Selected chats count */}
          {selectedChats.length > 0 && (
            <div className="px-4 py-2 bg-blue-50 text-blue-700 text-sm mb-4 rounded">
              Đã chọn {selectedChats.length}/5 cuộc trò chuyện
            </div>
          )}

          {/* Chat list */}
          <div className="space-y-2">
            {filteredChats.map((chat) => {
              const isSelected = selectedChats.some(c => c.chatId === chat.chatId);
              return (
                <div
                  key={chat.chatId}
                  onClick={() => handleChatSelect(chat)}
                  className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50 border-2 border-blue-500' : 'hover:bg-gray-50 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      {chat.isGroupChat ? (
                        <Users size={20} className="text-gray-600" />
                      ) : (
                        <img
                          src={chat.avatar || "/avatar.png"}
                          alt={chat.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">
                        {chat.isGroupChat ? chat.groupName : chat.name}
                      </h4>
                      {chat.isGroupChat && (
                        <p className="text-sm text-gray-500">
                          {chat.participants.length} thành viên
                        </p>
                      )}
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Hủy
          </button>
          <button
            onClick={handleForward}
            disabled={selectedChats.length === 0 || isForwarding}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isForwarding ? 'Đang chuyển tiếp...' : `Chuyển tiếp (${selectedChats.length})`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForwardMessageModal;
