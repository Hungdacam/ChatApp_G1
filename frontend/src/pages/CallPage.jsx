import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";
import useCallStore from "../store/useCallStore";
import PageLoader from "../components/PageLoader";
import toast from "react-hot-toast";

import {
  StreamVideo,
  StreamCall,
  CallControls,
  SpeakerLayout,
  StreamTheme,
  CallingState,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";

import "@stream-io/video-react-sdk/dist/css/styles.css";

const STREAM_API_KEY = "8xpuuh264zb6";

const CallPage = () => {
  const { id: callId } = useParams();
  const [isConnecting, setIsConnecting] = useState(true);
  const navigate = useNavigate();

  const { authUser, isLoading: isAuthLoading } = useAuthStore();
  const {
    token,
    client,
    call,
    isLoading: isStreamLoading,
    fetchToken,
    initClient,
    joinCall,
    reset
  } = useCallStore();

  useEffect(() => {
    let isMounted = true; // Thêm biến này để tránh cập nhật state sau khi component unmount
    
    const initializeCall = async () => {
      if (!authUser) return;

      try {
        // 1. Lấy token nếu chưa có
        let streamToken = token;
        if (!streamToken) {
          streamToken = await fetchToken();
          if (!streamToken) {
            throw new Error('Không thể lấy Stream token');
          }
        }

        // 2. Khởi tạo client nếu chưa có
        let streamClient = client;
        if (!streamClient) {
          const user = {
            id: authUser._id,
            name: authUser.name || 'User',
            image: authUser.avatar || '',
          };
          
          streamClient = initClient(STREAM_API_KEY, user, streamToken);
          if (!streamClient) {
            throw new Error('Không thể khởi tạo Stream client');
          }
        }

        // 3. Tham gia cuộc gọi
        if (!call && isMounted) {
          await joinCall(callId);
        }
      } catch (error) {
        console.error("Error setting up call:", error);
        toast.error("Không thể tham gia cuộc gọi: " + error.message);
        
        // Chuyển hướng về trang chủ sau khi báo lỗi
        if (isMounted) {
          navigate('/');
        }
      } finally {
        if (isMounted) {
          setIsConnecting(false);
        }
      }
    };

    initializeCall();

    // Cleanup khi component unmount
    return () => {
      isMounted = false;
      reset();
    };
  }, [authUser, callId]); // Giảm số lượng dependencies để tránh re-render không cần thiết


 // Tạo biến isLoading từ các trạng thái loading khác nhau
const isLoading = isAuthLoading || isStreamLoading || isConnecting;

if (isLoading) return <PageLoader />;

if (!client || !call) {
  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <p>Người nhận đã từ chối cuộc gọi </p>
      <button 
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        onClick={() => navigate("/")}
      >
        Quay lại trang chủ
      </button>
    </div>
  );
}

return (
  <div className="h-screen flex flex-col items-center justify-center">
    <div className="relative w-full h-full">
      <StreamVideo client={client}>
        <StreamCall call={call}>
          <CallContent />
        </StreamCall>
      </StreamVideo>
    </div>
  </div>
);

};

const CallContent = () => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const navigate = useNavigate();
  const { endCall } = useCallStore();

  useEffect(() => {
    // Xử lý khi trạng thái cuộc gọi thay đổi
    if (callingState === CallingState.LEFT) {
      console.log("Trạng thái cuộc gọi đã chuyển sang LEFT");
      endCall().then(() => navigate("/"));
    }
    
    // Lắng nghe sự kiện kết thúc cuộc gọi từ socket
    const handleCallEnded = (event) => {
      console.log("Nhận sự kiện call_ended:", event.detail);
      navigate("/");
    };
    
    window.addEventListener('call_ended', handleCallEnded);
    
    return () => {
      window.removeEventListener('call_ended', handleCallEnded);
    };
  }, [callingState, navigate, endCall]);

  return (
    <StreamTheme>
      <SpeakerLayout />
      <CallControls />
    </StreamTheme>
  );
};


export default CallPage;