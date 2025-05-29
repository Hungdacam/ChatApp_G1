import React, { useState, useEffect } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useFriendStore } from '../store/useFriendStore';
import { X, Upload, Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const CreateGroupModal = ({ onClose }) => {
  const [groupName, setGroupName] = useState('');
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { createGroup } = useChatStore();
  const { friends, fetchFriends } = useFriendStore();
  
  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);
  
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB
        toast.error('Kích thước ảnh không được vượt quá 5MB');
        return;
      }
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };
  
  const toggleFriendSelection = (friendId) => {
    if (selectedFriends.includes(friendId)) {
      setSelectedFriends(selectedFriends.filter(id => id !== friendId));
    } else {
      setSelectedFriends([...selectedFriends, friendId]);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!groupName.trim()) {
      toast.error('Vui lòng nhập tên nhóm');
      return;
    }
    
    if (selectedFriends.length === 0) {
      toast.error('Vui lòng chọn ít nhất một thành viên');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await createGroup(groupName, selectedFriends, avatar);
      toast.success('Tạo nhóm thành công');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi tạo nhóm');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Tạo nhóm chat mới</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Tên nhóm</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full p-2 border rounded-md"
              placeholder="Nhập tên nhóm"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Avatar nhóm (tùy chọn)</label>
            <div className="flex items-center space-x-4">
              {avatarPreview ? (
                <div className="relative">
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setAvatar(null);
                      setAvatarPreview('');
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-16 h-16 bg-gray-100 rounded-full cursor-pointer hover:bg-gray-200">
                  <Upload size={24} className="text-gray-500" />
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                </label>
              )}
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Chọn thành viên</label>
            <div className="border rounded-md p-2 max-h-60 overflow-y-auto">
              {friends.length === 0 ? (
                <p className="text-gray-500 text-center py-2">Không có bạn bè</p>
              ) : (
                friends.map((friend) => (
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
                ))
              )}
            </div>
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
              disabled={isLoading || selectedFriends.length === 0 || !groupName.trim()}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <Loader2 size={18} className="animate-spin mr-2" />
                  Đang tạo...
                </span>
              ) : (
                'Tạo nhóm'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
