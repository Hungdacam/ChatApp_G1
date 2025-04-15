import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X, Paperclip, Video, Smile } from "lucide-react";
import Picker from "emoji-picker-react";
import toast from "react-hot-toast";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const { sendMessage, sendFile, selectedChat } = useChatStore();
  
  const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB in bytes
  
  const onEmojiClick = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };
  
  // Kiểm tra kích thước file
  const checkFileSize = (file) => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File quá lớn. Vui lòng chọn file nhỏ hơn 25MB.`);
      return false;
    }
    return true;
  };
  
  // Xử lý khi chọn ảnh
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!checkFileSize(file)) {
      e.target.value = "";
      return;
    }
    
    // Kiểm tra định dạng file
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh hợp lệ');
      e.target.value = "";
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      // Reset các preview khác
      setVideoPreview(null);
      setFileInfo(null);
    };
    reader.readAsDataURL(file);
  };
  
  // Xử lý khi chọn video
  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!checkFileSize(file)) {
      e.target.value = "";
      return;
    }
    
    // Kiểm tra định dạng file
    if (!file.type.startsWith('video/')) {
      toast.error('Vui lòng chọn file video hợp lệ');
      e.target.value = "";
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setVideoPreview({
        url: reader.result,
        file: file
      });
      // Reset các preview khác
      setImagePreview(null);
      setFileInfo(null);
    };
    reader.readAsDataURL(file);
  };
  
  // Xử lý khi chọn file - Đã sửa để gửi ngay lập tức
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedChat) return;
    
    if (!checkFileSize(file)) {
      e.target.value = "";
      return;
    }
    
    // Hiển thị thông tin file đang được gửi
    setFileInfo({
      name: file.name,
      size: file.size,
      type: file.type,
      file: file
    });
    
    // Gửi file ngay lập tức
    setIsSending(true);
    try {
      await sendFile({
        chatId: selectedChat.chatId,
        file: file
      });
      
      // Reset form sau khi gửi thành công
      setFileInfo(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      toast.success("Đã gửi file thành công");
    } catch (error) {
      console.error("Lỗi khi gửi file:", error);
      toast.error("Không thể gửi file. Vui lòng thử lại sau.");
    } finally {
      setIsSending(false);
    }
  };
  
  // Xóa preview
  const removeMedia = () => {
    setImagePreview(null);
    setVideoPreview(null);
    setFileInfo(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (videoInputRef.current) videoInputRef.current.value = "";
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  
  // Gửi tin nhắn - Đã sửa để không xử lý file
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!text.trim() && !imagePreview && !videoPreview) || !selectedChat) return;
    
    setIsSending(true);
    try {
      // Chỉ gửi tin nhắn văn bản, ảnh hoặc video
      await sendMessage({
        chatId: selectedChat.chatId,
        content: text,
        image: imagePreview ? imageInputRef.current.files[0] : null,
        video: videoPreview ? videoInputRef.current.files[0] : null
      });
      
      // Reset form
      setText("");
      setImagePreview(null);
      setVideoPreview(null);
      if (imageInputRef.current) imageInputRef.current.value = "";
      if (videoInputRef.current) videoInputRef.current.value = "";
    } catch (error) {
      console.error("Lỗi khi gửi tin nhắn:", error);
      toast.error("Không thể gửi tin nhắn. Vui lòng thử lại sau.");
    } finally {
      setIsSending(false);
    }
  };
  
  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };
  
  // Bật/tắt emoji picker
  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };
  
  return (
    <div className="message-input-container p-4 border-t relative">
      {/* Preview ảnh */}
      {imagePreview && (
        <div className="image-preview mb-2 relative">
          <img src={imagePreview} alt="Preview" className="max-h-[150px] rounded-lg" />
          <button 
            onClick={removeMedia}
            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
          >
            <X size={16} />
          </button>
        </div>
      )}
      
      {/* Preview video */}
      {videoPreview && (
        <div className="video-preview mb-2 relative">
          <video 
            src={videoPreview.url} 
            controls 
            className="max-h-[150px] rounded-lg"
          ></video>
          <button 
            onClick={removeMedia}
            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
          >
            <X size={16} />
          </button>
        </div>
      )}
      
      {/* Preview file */}
      {fileInfo && (
        <div className="file-preview mb-2 p-2 bg-gray-100 rounded-lg flex items-center justify-between">
          <div className="file-info flex items-center">
            <Paperclip size={16} className="mr-2" />
            <div>
              <div className="file-name font-medium">{fileInfo.name}</div>
              <div className="file-size text-xs text-gray-500">{formatFileSize(fileInfo.size)}</div>
            </div>
          </div>
          <button 
            onClick={removeMedia}
            className="bg-red-500 text-white rounded-full p-1"
          >
            <X size={16} />
          </button>
        </div>
      )}
      
      {/* Form nhập tin nhắn */}
      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        {/* Nút chọn ảnh */}
        <button
          type="button"
          onClick={() => imageInputRef.current.click()}
          className="p-2 rounded-full hover:bg-gray-100"
          disabled={isSending}
        >
          <Image size={20} />
          <input
            type="file"
            ref={imageInputRef}
            onChange={handleImageChange}
            accept="image/*"
            className="hidden"
            disabled={isSending}
          />
        </button>
        
        {/* Nút chọn video */}
        <button
          type="button"
          onClick={() => videoInputRef.current.click()}
          className="p-2 rounded-full hover:bg-gray-100"
          disabled={isSending}
        >
          <Video size={20} />
          <input
            type="file"
            ref={videoInputRef}
            onChange={handleVideoChange}
            accept="video/*"
            className="hidden"
            disabled={isSending}
          />
        </button>
        
        {/* Nút chọn file */}
        <button
          type="button"
          onClick={() => fileInputRef.current.click()}
          className="p-2 rounded-full hover:bg-gray-100"
          disabled={isSending}
        >
          <Paperclip size={20} />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            disabled={isSending}
          />
        </button>
        
        {/* Nút chọn emoji */}
        <button
          type="button"
          onClick={toggleEmojiPicker}
          className="p-2 rounded-full hover:bg-gray-100"
          disabled={isSending}
        >
          <Smile size={20} />
        </button>
        
        {/* Input nhập tin nhắn */}
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Nhập tin nhắn..."
          className="flex-1 p-2 border rounded-lg"
          disabled={isSending}
        />
        
        {/* Nút gửi tin nhắn */}
        <button
          type="submit"
          className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
          disabled={isSending || (!text.trim() && !imagePreview && !videoPreview)}
        >
          <Send size={20} />
        </button>
      </form>
      
      {/* Emoji picker */}
      {showEmojiPicker && (
        <div className="emoji-picker-container absolute bottom-16 right-4 z-10">
          <Picker onEmojiClick={onEmojiClick} />
        </div>
      )}
    </div>
  );
};

export default MessageInput;
