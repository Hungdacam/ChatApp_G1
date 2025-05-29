import React, { useState } from 'react';
import { useChatStore } from '../store/useChatStore';
import useAuthStore from '../store/useAuthStore';
import { X, Upload, UserPlus, UserMinus, Shield, ShieldOff, LogOut, Trash2, Loader2, Crown } from 'lucide-react';
import toast from 'react-hot-toast';
import AddMemberModal from './AddMemberModal';
import { useMemo } from 'react';
import { useEffect } from 'react';

const GroupChatInfo = ({ onClose }) => {
  const { selectedChat, leaveGroup, removeGroupMember, assignAdmin, removeAdmin, dissolveGroup, updateGroupAvatar, transferGroupOwnership } = useChatStore();
  const { authUser } = useAuthStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [showTransferOwnership, setShowTransferOwnership] = useState(null);

  useEffect(() => {
    console.log("Selected chat updated:", selectedChat);
  }, [selectedChat]);

  const isCreator = useMemo(() => {
  if (!selectedChat || !authUser?._id || !selectedChat.createdBy) return false;
  const creatorId = typeof selectedChat.createdBy === 'object' && selectedChat.createdBy._id
    ? selectedChat.createdBy._id.toString()
    : selectedChat.createdBy.toString();
  return creatorId === authUser._id.toString();
}, [selectedChat, authUser]);
  const isAdmin = useMemo(() => {
  if (!selectedChat || !authUser?._id) return false;
  if (isCreator) return true;
  if (!selectedChat.admins || !Array.isArray(selectedChat.admins)) return false;
  return selectedChat.admins.some(adminId => {
    const adminIdStr = typeof adminId === 'object' && adminId._id
      ? adminId._id.toString()
      : adminId.toString();
    return adminIdStr === authUser._id.toString();
  });
}, [selectedChat, authUser, isCreator]);
  
  

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước ảnh không được vượt quá 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error('Vui lòng chọn file ảnh');
        return;
      }
      
      setIsLoading(true);
      try {
        await updateGroupAvatar(selectedChat.chatId, file);
        toast.success('Cập nhật avatar nhóm thành công');
      } catch (error) {
        console.error("Chi tiết lỗi:", error);
        toast.error(error.response?.data?.message || 'Lỗi khi cập nhật avatar nhóm');
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const handleRemoveMember = async (userId) => {
    setIsLoading(true);
    try {
      await removeGroupMember(selectedChat.chatId, userId);
      toast.success('Đã xóa thành viên khỏi nhóm');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi xóa thành viên');
    } finally {
      setIsLoading(false);
      setConfirmAction(null);
    }
  };
  
  const handleAssignAdmin = async (userId) => {
    setIsLoading(true);
    try {
      await assignAdmin(selectedChat.chatId, userId);
      toast.success('Đã gán quyền admin');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi gán quyền admin');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRemoveAdmin = async (userId) => {
    setIsLoading(true);
    try {
      console.log("Bắt đầu xóa quyền admin cho:", userId);
      console.log("Chat hiện tại:", selectedChat);
      let isUserCreator = false;
      if (selectedChat.createdBy) {
        if (typeof selectedChat.createdBy === 'object' && selectedChat.createdBy._id) {
          isUserCreator = selectedChat.createdBy._id.toString() === userId.toString();
        } else if (typeof selectedChat.createdBy === 'string') {
          isUserCreator = selectedChat.createdBy === userId.toString();
        } else {
          isUserCreator = selectedChat.createdBy.toString() === userId.toString();
        }
      }
      
      if (isUserCreator) {
        toast.error('Không thể xóa quyền admin của người tạo nhóm');
        return;
      }

      await removeAdmin(selectedChat.chatId, userId);
      toast.success('Đã xóa quyền admin');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi xóa quyền admin');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCheckBeforeLeave = () => {
  if (isCreator) {
    toast.error('Trưởng nhóm không thể rời nhóm. Vui lòng chuyển quyền trưởng nhóm hoặc giải tán nhóm.');
    return;
  }
  if (isAdmin) {
    const creatorId = typeof selectedChat.createdBy === 'object' && selectedChat.createdBy._id
      ? selectedChat.createdBy._id.toString()
      : selectedChat.createdBy.toString();
    const creatorStillInGroup = selectedChat.participants.some(p => {
      const participantId = typeof p === 'object' && p._id ? p._id.toString() : p.toString();
      return participantId === creatorId;
    });
    if (!creatorStillInGroup && selectedChat.admins.length <= 1) {
      toast.error('Bạn là phó nhóm cuối cùng và trưởng nhóm đã rời. Vui lòng gán admin khác trước khi rời.');
      return;
    }
  }
  setConfirmAction({ type: 'leave' });
};
  
  const handleLeaveGroup = async () => {
    setIsLoading(true);
    try {
      await leaveGroup(selectedChat.chatId);
      toast.success('Đã rời khỏi nhóm');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi rời nhóm');
    } finally {
      setIsLoading(false);
      setConfirmAction(null);
    }
  };
  
  const handleDissolveGroup = async () => {
    setIsLoading(true);
    try {
      await dissolveGroup(selectedChat.chatId);
      toast.success('Đã giải tán nhóm');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi giải tán nhóm');
    } finally {
      setIsLoading(false);
      setConfirmAction(null);
    }
  };
  
  const handleTransferOwnership = async (userId) => {
    setIsLoading(true);
    try {
      await transferGroupOwnership(selectedChat.chatId, userId);
      toast.success('Đã chuyển quyền trưởng nhóm');
      setShowTransferOwnership(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi chuyển quyền trưởng nhóm');
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedChat || !selectedChat.isGroupChat) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Thông tin nhóm</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        
        <div className="flex flex-col items-center mb-6">
          <div className="relative mb-2">
            <img
              src={selectedChat.avatar || '/default-group.png'}
              alt={selectedChat.name}
              className="w-24 h-24 rounded-full object-cover"
            />
            {isAdmin && (
              <label className="absolute bottom-0 right-0 bg-gray-100 rounded-full p-1 cursor-pointer hover:bg-gray-200">
                <Upload size={16} className="text-gray-700" />
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  disabled={isLoading}
                />
              </label>
            )}
          </div>
          <h3 className="text-lg font-semibold">{selectedChat.name}</h3>
          <p className="text-gray-500">{selectedChat.participants.length} thành viên</p>
        </div>
        
        {isAdmin && (
          <div className="mb-4">
            <button
              onClick={() => setShowAddMember(true)}
              className="w-full flex items-center justify-center gap-2 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
              disabled={isLoading}
            >
              <UserPlus size={18} />
              Thêm thành viên
            </button>
          </div>
        )}
        
        <div className="mb-4">
          <h4 className="font-medium mb-2">Thành viên nhóm</h4>
          <div className="border rounded-md divide-y">
            {selectedChat.participants.map((member) => (
              <div key={member._id} className="flex items-center p-3">
                <img
                  src={member.avatar || '/default-avatar.png'}
                  alt={member.name}
                  className="w-10 h-10 rounded-full mr-3"
                />
                <div className="flex-1">
                  <div className="font-medium">{member.name}</div>
                  <div className="text-sm text-gray-500">
                    {(() => {
                      if (typeof selectedChat.createdBy === 'object' && selectedChat.createdBy._id) {
                        if (selectedChat.createdBy._id.toString() === member._id.toString()) {
                          return 'Trưởng nhóm';
                        }
                      } else if (selectedChat.createdBy?.toString() === member._id.toString()) {
                        return 'Trưởng nhóm';
                      }
                      
                      if (selectedChat.admins && Array.isArray(selectedChat.admins)) {
                        const isAdmin = selectedChat.admins.some(adminId => {
                          if (typeof adminId === 'object' && adminId._id) {
                            return adminId._id.toString() === member._id.toString();
                          }
                          return adminId?.toString() === member._id.toString();
                        });
                        
                        if (isAdmin) return 'Phó nhóm';
                      }
                      
                      return '';
                    })()}
                  </div>
                </div>
                
                {isAdmin && member._id !== authUser._id && (
                  <div className="flex gap-1">
                    {isCreator && (
                      (() => {
                        const isMemberAdmin = selectedChat.admins?.some(adminId => {
                          const adminIdStr = typeof adminId === 'object' && adminId._id
                            ? adminId._id.toString()
                            : adminId.toString();
                          return adminIdStr === member._id.toString();
                        });

                        return isMemberAdmin ? (
                          <button
                            onClick={() => handleRemoveAdmin(member._id)}
                            className="p-1 text-gray-500 hover:text-gray-700"
                            title="Xóa quyền admin"
                            disabled={isLoading}
                          >
                            <ShieldOff size={18} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAssignAdmin(member._id)}
                            className="p-1 text-gray-500 hover:text-gray-700"
                            title="Gán quyền admin"
                            disabled={isLoading}
                          >
                            <Shield size={18} />
                          </button>
                        );
                      })()
                    )}
                    {(isCreator || (!isCreator && !selectedChat.admins?.some(adminId => {
                      const adminIdStr = typeof adminId === 'object' && adminId._id
                        ? adminId._id.toString()
                        : adminId.toString();
                      return adminIdStr === member._id.toString();
                    }) && !(
                      typeof selectedChat.createdBy === 'object' && selectedChat.createdBy._id
                        ? selectedChat.createdBy._id.toString() === member._id.toString()
                        : selectedChat.createdBy.toString() === member._id.toString()
                    ))) && (
                      <button
                        onClick={() => setConfirmAction({ type: 'remove', userId: member._id, name: member.name })}
                        className="p-1 text-red-500 hover:text-red-700"
                        title="Xóa khỏi nhóm"
                        disabled={isLoading}
                      >
                        <UserMinus size={18} />
                      </button>
                    )}
                    {isCreator && member._id !== authUser._id && (
                      <button
                        onClick={() => setShowTransferOwnership({ userId: member._id, name: member.name })}
                        className="p-1 text-yellow-500 hover:text-yellow-600 transfer-ownership-btn"
                        title="Chuyển quyền trưởng nhóm"
                        disabled={isLoading}
                      >
                        <Crown size={18} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-6">
          {isCreator ? (
            <button
              onClick={() => setConfirmAction({ type: 'dissolve' })}
              className="w-full flex items-center justify-center gap-2 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
              disabled={isLoading}
            >
              <Trash2 size={18} />
              Giải tán nhóm
            </button>
          ) : (
            <button
              onClick={handleCheckBeforeLeave}
              className="w-full flex items-center justify-center gap-2 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
              disabled={isLoading}
            >
              <LogOut size={18} />
              Rời khỏi nhóm
            </button>
          )}
        </div>
        
        {showAddMember && (
          <AddMemberModal
            chatId={selectedChat.chatId}
            existingMembers={selectedChat.participants}
            onClose={() => setShowAddMember(false)}
          />
        )}
        
        {confirmAction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-4 max-w-sm w-full">
              <h3 className="text-lg font-semibold mb-2">Xác nhận</h3>
              
              {confirmAction.type === 'remove' && (
                <p>Bạn có chắc muốn xóa {confirmAction.name} khỏi nhóm?</p>
              )}
              
              {confirmAction.type === 'leave' && (
                <p>Bạn có chắc muốn rời khỏi nhóm này?</p>
              )}
              
              {confirmAction.type === 'dissolve' && (
                <p>Bạn có chắc muốn giải tán nhóm này? Hành động này không thể hoàn tác.</p>
              )}
              
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="px-3 py-1 border rounded-md"
                  disabled={isLoading}
                >
                  Hủy
                </button>
                
                <button
                  onClick={() => {
                    if (confirmAction.type === 'remove') {
                      handleRemoveMember(confirmAction.userId);
                    } else if (confirmAction.type === 'leave') {
                      handleLeaveGroup();
                    } else if (confirmAction.type === 'dissolve') {
                      handleDissolveGroup();
                    }
                  }}
                  className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    'Xác nhận'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {showTransferOwnership && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-4 max-w-sm w-full">
              <h3 className="text-lg font-semibold mb-2">Xác nhận chuyển quyền</h3>
              <p>Bạn có chắc muốn chuyển quyền trưởng nhóm cho {showTransferOwnership.name}?</p>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setShowTransferOwnership(null)}
                  className="px-3 py-1 border rounded-md"
                  disabled={isLoading}
                >
                  Hủy
                </button>
                <button
                  onClick={() => handleTransferOwnership(showTransferOwnership.userId)}
                  className="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:opacity-50 transfer-ownership-confirm-btn"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Xác nhận'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default GroupChatInfo;