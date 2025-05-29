// src/pages/FriendRequestsPage.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFriendStore } from "../store/useFriendStore";
import { toast } from "react-hot-toast";

const FriendRequestsPage = () => {
  const navigate = useNavigate();
  const { receivedRequests, fetchReceivedRequests, acceptFriendRequest, rejectFriendRequest } = useFriendStore();

  useEffect(() => {
    fetchReceivedRequests();
  }, []);

  const handleAccept = async (senderId) => {
    const chatId = await acceptFriendRequest(senderId);
    if (chatId) {
      toast.success("Đã tạo cuộc trò chuyện mới!");
      // Có thể điều hướng tới trang chat nếu muốn
      // navigate("/chat", { state: { chatId } });
    }
  };

  const handleReject = async (senderId) => {
    await rejectFriendRequest(senderId);
  };

  return (
    <div className="friend-requests-page h-screen overflow-y-auto">
      <div className="max-w-2xl mx-auto p-4 py-8">
        <div className="bg-base-300 rounded-xl p-6 space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-semibold">Lời mời kết bạn</h1>
            <p className="mt-2 text-zinc-500">Quản lý các lời mời bạn nhận được</p>
          </div>

          {receivedRequests.length === 0 ? (
            <p className="text-center text-zinc-500">Không có lời mời kết bạn nào.</p>
          ) : (
            <div className="space-y-4">
              {receivedRequests.map((request) => (
                <div
                  key={request._id}
                  className="flex items-center justify-between bg-base-200 p-4 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={request.userId1.avatar || "/avatar.png"}
                      alt="Avatar"
                      className="size-12 rounded-full object-cover border-2"
                    />
                    <div>
                      <p className="font-semibold">{request.userId1.name}</p>
                      <p className="text-sm text-zinc-500">{request.userId1.phone || "—"}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAccept(request.userId1._id)}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      Chấp nhận
                    </button>
                    <button
                      onClick={() => handleReject(request.userId1._id)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Từ chối
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendRequestsPage;