import { useState } from "react";
import useAuthStore from "../store/useAuthStore";
import { UserOutlined, MailOutlined, LockOutlined } from "@ant-design/icons";
import { Phone, EyeOff, Eye, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AuthImagePattern from "../components/AuthImagePattern";
import toast from "react-hot-toast";

const SignUpPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formdata, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    dob: "",
    gender: "",
  });

  const [errors, setErrors] = useState({});
  const { sendSignupOTP, storeTempSignupData, isSendingOTP } = useAuthStore();

  const validateField = (name, value) => {
    let error = "";
    switch (name) {
      case "name":
        if (!value.trim()) error = "Vui lòng nhập họ tên";
        else if (value.trim().length < 6) error = "Họ tên phải có ít nhất 6 ký tự";
        break;
      case "email":
        if (!value.trim()) error = "Vui lòng nhập email";
        else if (!/\S+@\S+\.\S+/.test(value)) error = "Email không hợp lệ";
        break;
      case "phone":
        if (!value.trim()) error = "Vui lòng nhập số điện thoại";
        else if (!/^\d{10}$/.test(value)) error = "Số điện thoại phải có 10 chữ số";
        break;
      case "password":
        if (!value) error = "Vui lòng nhập mật khẩu";
        else if (value.length < 6) error = "Mật khẩu phải có ít nhất 6 ký tự";
        break;
      case "dob":
        if (!value) error = "Vui lòng chọn ngày sinh";
        else if (new Date(value) > new Date()) error = "Ngày sinh không được trong tương lai";
        break;
      case "gender":
        if (!value || value === "Chọn giới tính") error = "Vui lòng chọn giới tính";
        break;
      default:
        break;
    }
    setErrors((prev) => ({ ...prev, [name]: error }));
    return error === "";
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    validateField(name, value);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) validateField(name, value);
  };

  const validateForm = () => {
    return (
      validateField("name", formdata.name) &&
      validateField("email", formdata.email) &&
      validateField("phone", formdata.phone) &&
      validateField("password", formdata.password) &&
      validateField("dob", formdata.dob) &&
      validateField("gender", formdata.gender)
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      // Lưu dữ liệu tạm thời
      storeTempSignupData(formdata);
      // Gửi yêu cầu OTP
      sendSignupOTP(formdata.phone, navigate);
    } else {
      toast.error("Vui lòng sửa các lỗi trong biểu mẫu");
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2 group">
              <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Phone className="size-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mt-2">Tạo tài khoản</h1>
              <p className="text-base-content/60">Bắt đầu với tài khoản miễn phí của bạn</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Họ tên */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Họ tên</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-[2]">
                  <UserOutlined className="size-5 text-base-content/40" />
                </div>
                <input
                  type="text"
                  name="name"
                  className="input input-bordered w-full pl-10"
                  placeholder="Nguyễn Văn A"
                  value={formdata.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </div>
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            {/* Email */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Email</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-[2]">
                  <MailOutlined className="size-5 text-base-content/40" />
                </div>
                <input
                  type="email"
                  name="email"
                  className="input input-bordered w-full pl-10"
                  placeholder="example@gmail.com"
                  value={formdata.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </div>
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            {/* Số điện thoại */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Số điện thoại</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-[2]">
                  <Phone className="size-5 text-base-content/40" />
                </div>
                <input
                  type="text"
                  name="phone"
                  className="input input-bordered w-full pl-10"
                  placeholder="0123456789"
                  value={formdata.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </div>
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
            </div>

            {/* Ngày sinh */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Ngày sinh</span>
              </label>
              <input
                type="date"
                name="dob"
                className="input input-bordered w-full"
                value={formdata.dob}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {errors.dob && <p className="text-red-500 text-sm mt-1">{errors.dob}</p>}
            </div>

            {/* Giới tính */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Giới tính</span>
              </label>
              <select
                name="gender"
                className="select select-bordered w-full"
                value={formdata.gender}
                onChange={handleChange}
                onBlur={handleBlur}
              >
                <option value="" disabled>
                  Chọn giới tính
                </option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
              </select>
              {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender}</p>}
            </div>

            {/* Mật khẩu */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Mật khẩu</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-[2]">
                  <LockOutlined className="size-5 text-base-content/40" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className="input input-bordered w-full pl-10"
                  placeholder="*********"
                  value={formdata.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="size-5 text-base-content/40" />
                  ) : (
                    <Eye className="size-5 text-base-content/40" />
                  )}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            {/* Nút gửi */}
            <button type="submit" className="btn btn-primary w-full" disabled={isSendingOTP}>
              {isSendingOTP ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  Đang gửi OTP...
                </>
              ) : (
                "Gửi OTP"
              )}
            </button>
          </form>

          <div className="text-center">
            <p className="text-base-content/60">
              Đã có tài khoản?{" "}
              <Link to="/login" className="link link-primary">
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </div>

      <AuthImagePattern title="Tham gia ngay" subtitle="Xác minh số điện thoại để tiếp tục" />
    </div>
  );
};

export default SignUpPage;