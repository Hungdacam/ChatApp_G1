import { useState } from "react";
import useAuthStore from "../store/useAuthStore";
import { Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AuthImagePattern from "../components/AuthImagePattern";
import toast from "react-hot-toast";

const VerifyOTPPage = () => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const { signup, isSigningUp, tempSignupData } = useAuthStore();

  // Nếu không có dữ liệu tạm, chuyển hướng về trang đăng ký
  if (!tempSignupData) {
    navigate("/signup");
    toast.error("Vui lòng điền thông tin đăng ký trước");
    return null;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      toast.error("Vui lòng nhập mã OTP");
      return;
    }

    // Kết hợp OTP với dữ liệu đăng ký tạm thời
    const signupData = {
      ...tempSignupData,
      code: otp,
    };

    signup(signupData, navigate);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2 group">
              <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <svg
                  className="size-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 11c0-1.1.9-2 2-2s2 .9 2 2-2 4-2 4m-4-2H4m8-6v2m-2 10h4m6-6h-2m-2-6h2m-6 12v-2"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold mt-2">Xác minh OTP</h1>
              <p className="text-base-content/60">
                Nhập mã OTP đã gửi tới {tempSignupData.phone}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Mã OTP</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Nhập mã OTP 6 chữ số"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={isSigningUp}>
              {isSigningUp ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  Đang xác minh...
                </>
              ) : (
                "Xác minh OTP"
              )}
            </button>
          </form>

          <div className="text-center">
            <p className="text-base-content/60">
              Quay lại{" "}
              <Link to="/signup" className="link link-primary">
                Đăng ký
              </Link>
            </p>
          </div>
        </div>
      </div>

      <AuthImagePattern title="Gần hoàn tất" subtitle="Xác minh để tạo tài khoản" />
    </div>
  );
};

export default VerifyOTPPage;