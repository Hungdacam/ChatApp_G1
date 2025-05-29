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

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

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
  } = useCallStore();

  useEffect(() => {
  let isMounted = true;
  
  const initializeCall = async () => {
    if (!authUser || !authUser._id) {
        console.error("Không có authUser, chuyển hướng về trang chủ");
        if (isMounted) {
          navigate('/');
        }
        return;
      }
    
    const currentUserId = authUser._id.toString();
    console.log(`🚀 Initializing call for user: ${currentUserId}, callId: ${callId}`);
    
    try {
      let streamToken = token;
      if (!streamToken) {
        streamToken = await fetchToken();
        if (!streamToken) {
          throw new Error('Không thể lấy Stream token');
        }
      }

      let streamClient = client;
      if (!streamClient) {
        const user = {
          id: currentUserId,
          name: authUser.name || 'User',
          image: authUser.avatar || '',
        };
        streamClient = initClient(STREAM_API_KEY, user, streamToken);
        if (!streamClient) {
          throw new Error('Không thể khởi tạo Stream client');
        }
      }

      // ✅ Đảm bảo mỗi user join call riêng biệt
      if (!call && isMounted) {
        console.log(`👤 User ${currentUserId} attempting to join call ${callId}`);
        await joinCall(callId);
      }

    } catch (error) {
      console.error(`❌ Error setting up call for user ${currentUserId}:`, error);
      toast.error("Không thể tham gia cuộc gọi: " + error.message);
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

  return () => {
    isMounted = false;
    const callStore = useCallStore.getState();
  if (callStore.call || callStore.callId) {
    callStore.endCall().catch(error => {
      console.error('Error in cleanup endCall:', error);
    });
  }
  };
}, [authUser, callId]);
// CallPage.jsx - Thêm event listener cho socket events
useEffect(() => {
  const handleCallEndedFromSocket = (event) => {
    console.log("📞 Nhận event từ socket:", event.detail);
    // ✅ Cleanup call state trước khi navigate
        const callStore = useCallStore.getState();
        if (callStore.call) {
            callStore.endCall().catch(error => {
                console.error('Error in cleanup endCall:', error);
            });
        }
    // ✅ Sử dụng navigate thay vì window.location để giữ state
    navigate('/', { 
      replace: true,
      state: { 
        preserveAuth: true,
        fromCall: true 
      }
    });
  };

  window.addEventListener('callEndedFromSocket', handleCallEndedFromSocket);
  
  return () => {
    window.removeEventListener('callEndedFromSocket', handleCallEndedFromSocket);
  };
}, [navigate]);


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