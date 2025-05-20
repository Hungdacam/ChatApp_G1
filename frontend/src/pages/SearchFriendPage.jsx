import { useState } from "react";
import { Search } from "lucide-react";
import useAuthStore from "../store/useAuthStore";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom"; // <-- THÊM DÒNG NÀY

const SearchFriendPage = () => {
  const { findOneUser } = useAuthStore();
  const [friendPhone, setFriendPhone] = useState("");
  const navigate = useNavigate(); // <-- HOOK CHUYỂN TRANG

  const handleSearchFriend = async () => {
    try {
      if (!friendPhone) {
        toast.error("Vui lòng nhập số điện thoại để tìm kiếm.");
        return;
      }

      const result = await findOneUser(friendPhone);
      console.log(result);
      if (!result || !result.id || !result.phone) {
      toast.error("Không tìm thấy người dùng.");
      return;
}
      

      const user = {
        ...result,
        _id: result.id, // Chuyển id thành _id
      };
      toast.success("Tìm kiếm thành công!");
      toast.success("Tìm kiếm thành công!");

      // Chuyển sang AddFriendPage và truyền user
      navigate("/add-friend", { state: { friend: user } });

    } catch (error) {
      console.error("Search failed:", error);
      toast.error("Đã xảy ra lỗi khi tìm kiếm.");
    }
  };

  return (
    <div className="min-h-screen h-auto overflow-y-auto pt-20">
      <div className="max-w-2xl mx-auto p-4 py-8">
        <div className="bg-base-300 rounded-xl p-6 space-y-6 overflow-hidden">
          <div className="text-center">
            <h1 className="text-2xl font-semibold">Add Friend</h1>
            <p className="mt-2">Enter the phone number of your friend</p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <input
              type="text"
              placeholder="Friend's Phone Number"
              value={friendPhone}
              onChange={(e) => setFriendPhone(e.target.value)}
              className="input input-bordered w-full max-w-xs"
            />
            <button
              onClick={handleSearchFriend}
              className="btn btn-primary flex items-center gap-2"
            >
              <Search className="w-5 h-5" />
              Search
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchFriendPage;
