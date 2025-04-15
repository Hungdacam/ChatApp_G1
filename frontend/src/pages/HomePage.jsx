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
    <div className="flex h-screen">
      <div className="w-1/3 border-r">
        <Sidebar />
      </div>
      <div className="w-2/3">
        {selectedChat ? <ChatContainer /> : <NoChatSelected />}
      </div>
    </div>
  );
};

export default HomePage;
