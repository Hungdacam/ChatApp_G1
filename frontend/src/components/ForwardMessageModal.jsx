import React, { useState, useEffect } from 'react';
import { useChatStore } from '../store/useChatStore';
import { X, Search, Users, User } from 'lucide-react';
import toast from 'react-hot-toast';

const ForwardMessageModal = ({ isOpen, onClose, messageToForward }) => {
  const { chats, sendMessage } = useChatStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChats, setSelectedChats] = useState([]);
  const [isForwarding, setIsForwarding] = useState(false);

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
        const forwardedContent = `📩 Tin nhắn được chuyển tiếp:\n\n${messageToForward.content}`;
        
        await sendMessage({
          chatId: chat.chatId,
          content: forwardedContent,
          isForwarded: true,
          originalMessage: messageToForward
        });
      }
      
      toast.success(`Đã chuyển tiếp tin nhắn đến ${selectedChats.length} cuộc trò chuyện`);
      onClose();
      setSelectedChats([]);
      setSearchTerm('');
    } catch (error) {
      console.error('Lỗi khi chuyển tiếp tin nhắn:', error);
      toast.error('Không thể chuyển tiếp tin nhắn');
    } finally {
      setIsForwarding(false);
    }
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

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm cuộc trò chuyện..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Selected chats count */}
        {selectedChats.length > 0 && (
          <div className="px-4 py-2 bg-blue-50 text-blue-700 text-sm">
            Đã chọn {selectedChats.length}/5 cuộc trò chuyện
          </div>
        )}

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto">
          {filteredChats.map((chat) => {
            const isSelected = selectedChats.some(c => c.chatId === chat.chatId);
            return (
              <div
                key={chat.chatId}
                onClick={() => handleChatSelect(chat)}
                className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer ${
                  isSelected ? 'bg-blue-50 border-r-4 border-blue-500' : ''
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
