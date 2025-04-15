import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X } from "lucide-react";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef(null);
  
  const { sendMessage, selectedChat } = useChatStore();
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!text.trim() && !imagePreview) || !selectedChat) return;
    
    setIsSending(true);
    try {
      // Gửi tin nhắn qua API - backend sẽ tự động phát sóng qua socket
      await sendMessage({
        chatId: selectedChat.chatId,
        content: text,
        // Nếu có xử lý ảnh, thêm vào đây
        // image: imagePreview
      });
      
      setText("");
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Lỗi khi gửi tin nhắn:", error);
    } finally {
      setIsSending(false);
    }
  };
  
  return (
    <form onSubmit={handleSendMessage} className="flex items-center p-3 border-t">
      <button 
        type="button" 
        className="p-2 rounded-full hover:bg-gray-100"
        onClick={() => fileInputRef.current?.click()}
      >
        <Image size={20} />
      </button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageChange}
        className="hidden"
        accept="image/*"
      />
      
      {imagePreview && (
        <div className="relative mr-2">
          <img src={imagePreview} alt="Preview" className="h-12 w-12 object-cover rounded" />
          <button 
            type="button"
            onClick={removeImage}
            className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1"
          >
            <X size={12} color="white" />
          </button>
        </div>
      )}
      
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Nhập tin nhắn..."
        className="flex-1 p-2 border rounded-full mx-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      
      <button 
        type="submit"
        disabled={isSending || (!text.trim() && !imagePreview)}
        className={`p-2 rounded-full ${
          isSending || (!text.trim() && !imagePreview) 
            ? 'text-gray-400 cursor-not-allowed' 
            : 'text-blue-500 hover:bg-blue-50'
        }`}
      >
        <Send size={20} />
      </button>
    </form>
  );
};

export default MessageInput;
