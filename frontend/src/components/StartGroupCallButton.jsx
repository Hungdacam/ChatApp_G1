import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useCallStore from '../store/useCallStore';
import { useChatStore } from '../store/useChatStore';
import useAuthStore from '../store/useAuthStore';
import toast from 'react-hot-toast';
import { Video, Users } from 'lucide-react';

const StartGroupCallButton = ({ chatId, className }) => {
  const [isCreating, setIsCreating] = useState(false);
  const { createGroupCall } = useCallStore();
  const { selectedChat } = useChatStore();
  const { authUser } = useAuthStore();
  const navigate = useNavigate();

const handleStartGroupCall = async () => {
  // Kiểm tra xem có phải group chat không
  if (!selectedChat?.isGroupChat) {
    toast.error('Chỉ có thể tạo group call trong group chat');
    return;
  }

  // Kiểm tra số lượng thành viên
  if (selectedChat.participants.length < 2) {
    toast.error('Group cần có ít nhất 2 thành viên để tạo cuộc gọi');
    return;
  }

  setIsCreating(true);
  try {
    const callId = await createGroupCall(chatId, 'video');
    if (callId) {
      navigate(`/call/${callId}`);
    }
  } catch (error) {
    console.error('Error creating group call:', error);
    toast.error('Không thể tạo group call');
  } finally {
    setIsCreating(false);
  }
};


  // Chỉ hiển thị nút nếu là group chat
  if (!selectedChat?.isGroupChat) {
    return null;
  }

  return (
  <button
    className={`flex items-center gap-2 ${className}`}
    onClick={handleStartGroupCall}
    disabled={isCreating}
    title="Bắt đầu group video call"
  >
    {/* Sử dụng Video icon cho video call */}
    <Video size={20} />
    {isCreating ? 'Đang tạo...' : ''}
  </button>
);
};

export default StartGroupCallButton;
