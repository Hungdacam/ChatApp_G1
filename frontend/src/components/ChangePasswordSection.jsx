import { useState } from "react";
import { toast } from "react-hot-toast";
import { Lock, Eye, EyeOff } from "lucide-react"; // Thêm icon Eye và EyeOff
import useAuthStore from "../store/useAuthStore";

const ChangePasswordSection = () => {
  const { changePassword } = useAuthStore(); // Gọi hàm changePassword từ useAuthStore
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [showCurrentPassword, setShowCurrentPassword] = useState(false); // Trạng thái hiện/ẩn mật khẩu hiện tại
  const [showNewPassword, setShowNewPassword] = useState(false); // Trạng thái hiện/ẩn mật khẩu mới
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // Trạng thái hiện/ẩn mật khẩu xác nhận

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const newErrors = {};
    if (!form.currentPassword) newErrors.currentPassword = "Vui lòng nhập mật khẩu hiện tại";
    if (!form.newPassword || form.newPassword.length < 6) newErrors.newPassword = "Mật khẩu mới tối thiểu 6 ký tự";
    if (form.newPassword !== form.confirmPassword) newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      const result = await changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      });

      if (result.success) {
        toast.success(result.message);  // Hiển thị thông báo thành công
        setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        toast.error(result.message);  // Hiển thị thông báo lỗi
      }
    } catch (err) {
      toast.error(err.message || "Đổi mật khẩu thất bại");
    }
  };

  return (
    <div className="bg-base-300 p-6 rounded-xl shadow space-y-4">
      <h2 className="text-xl font-semibold">Đổi mật khẩu</h2>

      <div className="space-y-2">
        <label>Mật khẩu hiện tại</label>
        <div className="relative">
          <input
            type={showCurrentPassword ? "text" : "password"}
            name="currentPassword"
            value={form.currentPassword}
            onChange={handleChange}
            className="input input-bordered w-full"
          />
          <button
            type="button"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
          >
            {showCurrentPassword ? <EyeOff /> : <Eye />}
          </button>
        </div>
        {errors.currentPassword && <p className="text-red-500 text-sm">{errors.currentPassword}</p>}
      </div>

      <div className="space-y-2">
        <label>Mật khẩu mới</label>
        <div className="relative">
          <input
            type={showNewPassword ? "text" : "password"}
            name="newPassword"
            value={form.newPassword}
            onChange={handleChange}
            className="input input-bordered w-full"
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
          >
            {showNewPassword ? <EyeOff /> : <Eye />}
          </button>
        </div>
        {errors.newPassword && <p className="text-red-500 text-sm">{errors.newPassword}</p>}
      </div>

      <div className="space-y-2">
        <label>Xác nhận mật khẩu</label>
        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            className="input input-bordered w-full"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
          >
            {showConfirmPassword ? <EyeOff /> : <Eye />}
          </button>
        </div>
        {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword}</p>}
      </div>

      <button onClick={handleSubmit} className="btn btn-accent mt-4">
        Cập nhật mật khẩu
      </button>
    </div>
  );
};

export default ChangePasswordSection;
