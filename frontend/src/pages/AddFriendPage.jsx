import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Phone, User, Calendar, Heart, MessageCircle } from "lucide-react";
import useAuthStore from "../store/useAuthStore";
import { toast } from "react-hot-toast";
import { useFriendStore } from "../store/useFriendStore";

const AddFriendPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { authUser } = useAuthStore();
  const { sendFriendRequest, cancelFriendRequest, fetchSentRequests, sentRequests } = useFriendStore();

  const friend = location.state?.friend;
  const [alreadySent, setAlreadySent] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImg, setSelectedImg] = useState(friend?.avatar);

  useEffect(() => {
    fetchSentRequests();
  }, []);

  useEffect(() => {
    setAlreadySent(sentRequests.some((req) => req.userId2?._id === friend?._id));
  }, [sentRequests, friend]);

  const handleAddOrCancel = async () => {
    setIsLoading(true);
    try {
      if (alreadySent) {
        const success = await cancelFriendRequest(friend._id);
        if (success) toast.success("Đã hủy lời mời kết bạn");
      } else {
        const success = await sendFriendRequest(friend._id);
        if (success) toast.success("Đã gửi lời mời kết bạn");
      }
    } catch (err) {
      toast.error("Lỗi khi xử lý lời mời kết bạn");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartChat = () => {
    navigate("/chat", { state: { friend } });
  };

  return (
    <div className="profile-page h-screen overflow-y-auto">
      <div className="max-w-2xl mx-auto p-4 py-8">
        <div className="bg-base-300 rounded-xl p-6 space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold">Thông tin người dùng</h1>
            <p className="mt-2 text-zinc-500">Chi tiết người bạn muốn kết bạn</p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img
                src={selectedImg || "/avatar.png"}
                alt="Profile"
                className="size-32 rounded-full object-cover border-4"
              />
            </div>
            <p className="text-sm text-zinc-400">Ảnh đại diện</p>
          </div>

          <div className="space-y-4">
            <InfoRow icon={<User className="w-4 h-4" />} label="Full Name" value={friend.name} />
            <InfoRow icon={<Phone className="w-4 h-4" />} label="Phone" value={friend.phone} />
            <InfoRow icon={<Calendar className="w-4 h-4" />} label="Date of Birth" value={friend.dob ? new Date(friend.dob).toLocaleDateString() : "—"} />
            <InfoRow icon={<Heart className="w-4 h-4" />} label="Gender" value={friend.gender || "—"} />
          </div>

          <div className="space-y-2">
            <button
              disabled={isLoading || isFriend || !friend._id}
              onClick={handleAddOrCancel}
              className={`w-full py-2.5 rounded-lg text-white transition-colors ${
                isFriend
                  ? "bg-gray-500 cursor-not-allowed"
                  : alreadySent
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-primary hover:bg-primary-dark"
              }`}
            >
              {isFriend ? "Đã là bạn" : alreadySent ? "Hủy lời mời" : "Gửi lời mời kết bạn"}
            </button>

            {isFriend && (
              <button
                onClick={handleStartChat}
                className="w-full py-2.5 rounded-lg text-white bg-blue-500 hover:bg-blue-600 transition-colors"
              >
                <MessageCircle className="w-4 h-4 inline mr-2" />
                Nhắn tin
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({ icon, label, value }) => (
  <div className="space-y-1.5">
    <div className="text-sm text-zinc-400 flex items-center gap-2">
      {icon}
      {label}
    </div>
    <div className="w-full px-4 py-2.5 bg-base-200 rounded-lg border text-zinc-800">
      {value || "—"}
    </div>
  </div>
);

export default AddFriendPage;
