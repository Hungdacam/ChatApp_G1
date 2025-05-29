// components/AddMemberModal.jsx
import React, { useState, useEffect } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useFriendStore } from '../store/useFriendStore';
import { X, Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const AddMemberModal = ({ chatId, existingMembers, onClose }) => {
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const { addGroupMember } = useChatStore();
  const { friends, fetchFriends  } = useFriendStore();
  
  const [availableFriends, setAvailableFriends] = useState([]);
  
  useEffect(() => {
    // Gọi fetchFriends thay vì getFriends
    fetchFriends();
  }, [fetchFriends]);
  
  useEffect(() => {
    // Lọc ra những người bạn chưa là thành viên nhóm
    const memberIds = existingMembers.map(member => member._id);
    setAvailableFriends(friends.filter(friend => !memberIds.includes(friend._id)));
  }, [friends, existingMembers]);
  
  const toggleFriendSelection = (friendId) => {
    if (selectedFriends.includes(friendId)) {
      setSelectedFriends(selectedFriends.filter(id => id !== friendId));
    } else {
      setSelectedFriends([...selectedFriends, friendId]);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedFriends.length === 0) {
      toast.error('Vui lòng chọn ít nhất một thành viên');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Thêm từng thành viên một
      for (const friendId of selectedFriends) {
        await addGroupMember(chatId, friendId);
      }
      toast.success('Thêm thành viên thành công');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi thêm thành viên');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Thêm thành viên</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Chọn thành viên</label>
            
            {availableFriends.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Tất cả bạn bè của bạn đã là thành viên nhóm</p>
            ) : (
              <div className="border rounded-md p-2 max-h-60 overflow-y-auto">
                {availableFriends.map((friend) => (
                  <div
                    key={friend._id}
                    className={`flex items-center p-2 rounded-md cursor-pointer ${
                      selectedFriends.includes(friend._id) ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => toggleFriendSelection(friend._id)}
                  >
                    <img
                      src={friend.avatar || '/default-avatar.png'}
                      alt={friend.name}
                      className="w-10 h-10 rounded-full mr-3"
                    />
                    <span className="flex-1">{friend.name}</span>
                    {selectedFriends.includes(friend._id) && (
                      <Check size={20} className="text-green-500" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md"
              disabled={isLoading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
              disabled={isLoading || selectedFriends.length === 0 || availableFriends.length === 0}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <Loader2 size={18} className="animate-spin mr-2" />
                  Đang thêm...
                </span>
              ) : (
                'Thêm thành viên'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMemberModal;
