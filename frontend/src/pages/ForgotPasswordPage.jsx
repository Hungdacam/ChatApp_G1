import { useState } from "react";
import useAuthStore from "../store/useAuthStore";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AuthImagePattern from "../components/AuthImagePattern";
import toast from "react-hot-toast";

const ForgotPasswordPage = () => {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  const {
    isSendingOTP,
    sendForgotOTP,
    verifyForgotOTP,
    resetPassword,
  } = useAuthStore();

  const formatPhone = (input) =>
    input.startsWith("+") ? input : `+84${input.replace(/^0/, "")}`;

  const handleSendOTP = async () => {
    if (!phone) return toast.error("Vui lòng nhập số điện thoại");
    const formattedPhone = formatPhone(phone);
    try {
      await sendForgotOTP(formattedPhone);
      setPhone(formattedPhone); // lưu lại số sau khi format
      setStep(2);
    } catch (err) {
      toast.error("Không thể gửi OTP");
      console.log(err);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp) return toast.error("Vui lòng nhập mã OTP");
    try {
      await verifyForgotOTP(phone, otp);
      setStep(3);
    } catch (err) {
      toast.error("Xác minh OTP thất bại");
      console.log(err);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      return toast.error("Vui lòng điền đầy đủ thông tin");
    }

    try {
      await resetPassword(newPassword, confirmPassword, navigate);
    } catch (err) {
      toast.error("Đặt lại mật khẩu thất bại");
      console.log(err);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-6">
          <h1 className="text-2xl font-bold text-center">Quên mật khẩu</h1>

          {step === 1 && (
            <>
              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text">Số điện thoại</span>
                </div>
                <input
                  type="text"
                  className="input input-bordered"
                  placeholder="Nhập số điện thoại"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </label>
              <button
                className="btn btn-primary w-full"
                onClick={handleSendOTP}
                disabled={isSendingOTP}
              >
                {isSendingOTP ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  "Gửi OTP"
                )}
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-center">Đã gửi mã OTP đến {phone}</p>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Nhập mã OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <button
                className="btn btn-primary w-full"
                onClick={handleVerifyOTP}
                disabled={isSendingOTP}
              >
                {isSendingOTP ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  "Xác minh OTP"
                )}
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="input input-bordered w-full pr-10"
                  placeholder="Mật khẩu mới"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-2 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="input input-bordered w-full pr-10"
                  placeholder="Xác nhận mật khẩu"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-2 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <button
                className="btn btn-primary w-full"
                onClick={handleResetPassword}
              >
                Đặt lại mật khẩu
              </button>
            </>
          )}
        </div>
      </div>

      <AuthImagePattern
        title="Đặt lại mật khẩu"
        subtitle="Xác thực số điện thoại để khôi phục tài khoản"
      />
    </div>
  );
};

export default ForgotPasswordPage;
