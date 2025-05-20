import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useCallStore from '../store/useCallStore';
import { useChatStore } from '../store/useChatStore';
import useAuthStore from '../store/useAuthStore';
import toast from 'react-hot-toast';
import { Video } from 'lucide-react';

const StartCallButton = ({ chatId, className }) => {
  const [isCreating, setIsCreating] = useState(false);
  const { createCall } = useCallStore();
  const { selectedChat } = useChatStore();
  const { authUser } = useAuthStore();
  const navigate = useNavigate();

const handleStartCall = async () => {
  setIsCreating(true);
  try {
    // Lấy ID người dùng hiện tại
    const currentUserId = authUser?._id || localStorage.getItem("userId");
    
    // Lấy danh sách ID người tham gia trừ người dùng hiện tại
    const participantIds = selectedChat.participants
      .filter(p => p._id !== currentUserId)
      .map(p => p._id);
    
    // Truyền currentUserId vào hàm createCall
    const callId = await createCall(participantIds, chatId, currentUserId);
    if (callId) {
      navigate(`/call/${callId}`);
    }
  } catch (error) {
    console.error('Error creating call:', error);
    toast.error('Không thể tạo cuộc gọi');
  } finally {
    setIsCreating(false);
  }
};
return (
  <button
    className={`flex items-center gap-2 ${className}`}
    onClick={handleStartCall}
    disabled={isCreating}
  >
    <Video size={20} />
    {isCreating ? 'Đang tạo...' : ''}
  </button>
);
};

export default StartCallButton;
