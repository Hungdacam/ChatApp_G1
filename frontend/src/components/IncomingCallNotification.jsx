import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useCallStore from '../store/useCallStore';
import { Phone, PhoneOff } from 'lucide-react';
import toast from 'react-hot-toast';

const IncomingCallNotification = () => {
  const { incomingCall, acceptIncomingCall, rejectIncomingCall } = useCallStore();
  const navigate = useNavigate();
  
  useEffect(() => {
    const handleCallAccepted = (event) => {
      const { callId } = event.detail;
      navigate(`/call/${callId}`);
    };
    
    window.addEventListener('callAccepted', handleCallAccepted);
    
    return () => {
      window.removeEventListener('callAccepted', handleCallAccepted);
    };
  }, [navigate]);
  
// Thêm hiệu ứng khi từ chối cuộc gọi
const handleRejectCall = () => {
  console.log('Reject button clicked');
  
  try {
    // Gọi hàm từ chối trước khi hiển thị thông báo
    if (typeof rejectIncomingCall === 'function') {
      rejectIncomingCall();
      // Hiển thị thông báo sau khi đã xử lý từ chối
      toast("Đã từ chối cuộc gọi");
    } else {
      console.error('rejectIncomingCall is not a function');
    }
  } catch (error) {
    console.error('Error rejecting call:', error);
  }
};


  if (!incomingCall) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
            <img 
              src={incomingCall.caller?.avatar} 
              alt="Caller" 
              className="w-16 h-16 rounded-full object-cover"
            />
          </div>
          <h3 className="text-xl font-semibold">{incomingCall.caller?.name}</h3>
          <p className="text-gray-600">đang gọi cho bạn...</p>
        </div>
        
        <div className="flex justify-center gap-6">
          <button 
            onClick={handleRejectCall}
            className="w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center"
          >
            <PhoneOff size={24} />
          </button>
          <button 
            onClick={acceptIncomingCall}
            className="w-14 h-14 rounded-full bg-green-500 text-white flex items-center justify-center"
          >
            <Phone size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallNotification;
