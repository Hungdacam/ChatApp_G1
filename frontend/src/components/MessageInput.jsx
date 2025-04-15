import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X } from "lucide-react";
import Picker from "emoji-picker-react";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);

  const { sendMessage, selectedChat } = useChatStore();

  const onEmojiClick = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };
  

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
      await sendMessage({
        chatId: selectedChat.chatId,
        content: text,
        // image: imagePreview (nếu có xử lý ảnh)
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
    <form onSubmit={handleSendMessage} className="flex items-center p-3 border-t bg-white shadow-sm relative">
      <button
        type="button"
        className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
        onClick={() => setShowEmojiPicker((val) => !val)}
      >
        😀
      </button>
      {showEmojiPicker && (
        <div className="absolute bottom-14 left-3 z-50">
          <Picker onEmojiClick={onEmojiClick} />
        </div>
      )}

      <button
        type="button"
        className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors ml-2"
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
          <img src={imagePreview} alt="Preview" className="h-12 w-12 object-cover rounded-md border border-gray-300" />
          <button
            type="button"
            onClick={removeImage}
            className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1 shadow-sm hover:bg-red-600 transition-colors"
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
        className="flex-1 p-2 pl-4 pr-10 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent mx-2"
      />

      <button
        type="submit"
        disabled={isSending || (!text.trim() && !imagePreview)}
        className={`p-2 rounded-full transition-colors ${
          isSending || (!text.trim() && !imagePreview)
            ? "text-gray-400 cursor-not-allowed bg-gray-100"
            : "text-white bg-blue-500 hover:bg-blue-600"
        }`}
      >
        <Send size={18} />
      </button>
    </form>
  );
};

export default MessageInput;
