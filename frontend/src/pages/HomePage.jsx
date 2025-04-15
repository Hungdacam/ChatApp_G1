// HomePage.jsx
import ChatContainer from "../components/ChatContainer";
import NoChatSelected from "../components/NoChatSelected";
import Sidebar from "../components/Sidebar";
import { useChatStore } from "../store/useChatStore";
import { useEffect } from "react";

const HomePage = ({ isSocketReady }) => {
  const { selectedChat, fetchChatList } = useChatStore(); // Sử dụng selectedChat thay vì selectedChatId
  
  useEffect(() => {
    if (isSocketReady) {
      console.log("Socket đã sẵn sàng, gọi fetchChatList");
      fetchChatList();
    } else {
      console.log("Socket chưa sẵn sàng, chờ kết nối");
    }
  }, [fetchChatList, isSocketReady]);
  
  if (!isSocketReady) {
    return <div>Đang kết nối...</div>;
  }
  
  return (
    <div className="h-screen bg-base-200">
      <div className="flex items-center justify-center pt-20 px-4">
        <div className="bg-base-100 rounded-lg shadow-cl w-full max-w-6xl h-[calc(100vh-8rem)]">
          <div className="flex h-full rounded-lg overflow-hidden">
            {/* Sidebar chiếm 1/3 hoặc w-72 */}
            <div className="w-72 border-r border-base-300 h-full">
              <Sidebar />
            </div>
            {/* ChatContainer chiếm phần còn lại */}
            <div className="flex-1 h-full">
              {selectedChat ? <ChatContainer /> : <NoChatSelected />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
