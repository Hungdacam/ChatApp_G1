import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Video, Send, X, Image } from "lucide-react";

const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

const MessageInput = () => {
  const [text, setText] = useState("");
  const [videoPreview, setVideoPreview] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const videoInputRef = useRef(null);

  const { sendMessage, selectedChat } = useChatStore();

  // Xử lý chọn video và đọc base64
  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > MAX_VIDEO_SIZE) {
      alert("Video quá lớn. Vui lòng chọn video dưới 50MB.");
      e.target.value = null;
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setVideoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Xóa video preview
  const removeVideo = () => {
    setVideoPreview(null);
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  // Gửi tin nhắn (có thể kèm video)
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!text.trim() && !videoPreview) || !selectedChat) return;
  
    setIsSending(true);
    try {
      await sendMessage({
        chatId: selectedChat.chatId,
        content: text,
        video: videoPreview,
      });
  
      setText("");
      setVideoPreview(null);
      if (videoInputRef.current) videoInputRef.current.value = "";
    } catch (error) {
      console.error("Lỗi khi gửi tin nhắn:", error);
      alert("Gửi tin nhắn thất bại, vui lòng thử lại.");
    } finally {
      setIsSending(false);
    }
  };  

  return (
    <form onSubmit={handleSendMessage} className="flex items-center p-3 border-t">
       {/* Nút chọn anh */}
       <button
        type="button"
        className="p-2 rounded-full hover:bg-gray-100"
        onClick={() => imageInputRef.current?.click()}
      >
        <Image size={20} />
      </button>
      {/* <input
        type="file"
        ref={videoInputRef}
        onChange={handleVideoChange}
        className="hidden"
        accept="video/*"
      /> */}
      {/* Nút chọn video */}
      <button
        type="button"
        className="p-2 rounded-full hover:bg-gray-100"
        onClick={() => videoInputRef.current?.click()}
      >
        <Video size={20} />
      </button>
     
      {/* Input file ẩn */}
      <input
        type="file"
        ref={videoInputRef}
        onChange={handleVideoChange}
        className="hidden"
        accept="video/*"
      />

      {/* Preview video */}
      {videoPreview && (
        <div className="relative mr-2">
          <video src={videoPreview} controls className="h-20 w-28 rounded" />
          <button
            type="button"
            onClick={removeVideo}
            className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1"
          >
            <X size={12} color="white" />
          </button>
        </div>
      )}

      {/* Input nhập tin nhắn */}
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Nhập tin nhắn..."
        className="flex-1 p-2 border rounded-full mx-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />

      {/* Nút gửi */}
      <button
        type="submit"
        disabled={isSending || (!text.trim() && !videoPreview)}
        className={`p-2 rounded-full ${
          isSending || (!text.trim() && !videoPreview)
            ? "text-gray-400 cursor-not-allowed"
            : "text-blue-500 hover:bg-blue-50"
        }`}
      >
        <Send size={20} />
      </button>
    </form>
  );
};

export default MessageInput;
