import { useState } from "react";
import { Camera, Mail, Phone, User, Calendar, Heart } from "lucide-react";
import useAuthStore from "../store/useAuthStore";
import { toast } from "react-hot-toast";
import ChangePasswordSection from "../components/ChangePasswordSection";
const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    name: authUser?.name || "",
    phone: authUser?.phone || "",
    email: authUser?.email || "",
    dob: authUser?.dob ? new Date(authUser.dob).toISOString().split("T")[0] : "",
    gender: authUser?.gender || "",
  });

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    validateField(name, value);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size too large. Please select an image under 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      try {
        await updateProfile({ avatar: base64Image });
        toast.success("Profile picture updated successfully!");
      } catch (error) {
        toast.error("Failed to update profile picture.");
        setSelectedImg(null);
      }
    };
  };

  const handleUpdateProfile = async () => {
    let isValid = true;
    Object.entries(formData).forEach(([key, value]) => {
      if (key === "phone") return; // Không validate phone nếu không cho sửa
      const valid = validateField(key, value);
      if (!valid) isValid = false;
    });
    

    if (!isValid) {
      toast.error("Vui lòng điền đầy đủ thông tin hợp lệ");
      return;
    }

    try {
      await updateProfile(formData);
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error("Failed to update profile.");
    }
  };

  if (!authUser) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="h-screen pt-20">
      <div className="max-w-2xl mx-auto p-4 py-8">
        <div className="bg-base-300 rounded-xl p-6 space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold">Profile</h1>
            <p className="mt-2">Edit your profile information</p>
          </div>

          {/* Avatar upload */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img
                src={selectedImg || authUser.avatar || "/avatar.png"}
                alt="Profile"
                className="size-32 rounded-full object-cover border-4"
              />
              <label
                htmlFor="avatar-upload"
                className={`
                  absolute bottom-0 right-0 
                  bg-base-content hover:scale-105
                  p-2 rounded-full cursor-pointer 
                  transition-all duration-200
                  ${isUpdatingProfile ? "animate-pulse pointer-events-none" : ""}
                `}
              >
                <Camera className="w-5 h-5 text-base-200" />
                <input
                  type="file"
                  id="avatar-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUpdatingProfile}
                />
              </label>
            </div>
            <p className="text-sm text-zinc-400">
              {isUpdatingProfile ? "Uploading..." : "Click the camera icon to update your photo"}
            </p>
          </div>

          {/* Personal Info */}
          <div className="space-y-6">
            <h2 className="text-lg font-medium">Personal Information</h2>
            <div className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <div className="text-sm text-zinc-400 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Full Name
                </div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-base-200 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter your name"
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <div className="text-sm text-zinc-400 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone
                </div>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-base-200 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter your phone"
                  readOnly
                />
               
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <div className="text-sm text-zinc-400 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-base-200 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter your email"
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
              </div>

              {/* Date of Birth */}
              <div className="space-y-1.5">
                <div className="text-sm text-zinc-400 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date of Birth
                </div>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-base-200 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {errors.dob && <p className="text-sm text-red-500">{errors.dob}</p>}
              </div>

              {/* Gender */}
              <div className="space-y-1.5">
                <div className="text-sm text-zinc-400 flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Gender
                </div>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-base-200 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Chọn giới tính</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                </select>
                {errors.gender && <p className="text-sm text-red-500">{errors.gender}</p>}
              </div>
            </div>

            {/* Update Button */}
            <button
              onClick={handleUpdateProfile}
              disabled={isUpdatingProfile}
              className={`
                w-full py-2.5 bg-primary text-white rounded-lg 
                hover:bg-primary-dark transition-colors
                ${isUpdatingProfile ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              {isUpdatingProfile ? "Updating..." : "Update Profile"}
            </button>

            <ChangePasswordSection />
          </div>

          {/* Account Info */}
          <div className="mt-6 bg-base-300 rounded-xl p-6">
            <h2 className="text-lg font-medium mb-4">Account Information</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-zinc-700">
                <span>Member Since</span>
                <span>{authUser.createdAt ? new Date(authUser.createdAt).toLocaleDateString() : "N/A"}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span>Account Status</span>
                <span className="text-green-500">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
