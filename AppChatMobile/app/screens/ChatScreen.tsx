import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  Alert,
  StyleSheet,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Linking,
  PanResponder,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import socket from "../config/socket";
import { Ionicons } from "@expo/vector-icons";
import { BASE_URL } from "../config/config";
import EmojiModal from "react-native-emoji-modal";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import Modal from "react-native-modal";
import ImageViewer from "react-native-image-zoom-viewer";
import { Video, ResizeMode } from "expo-av";
import { WebView } from "react-native-webview";
import * as Clipboard from 'expo-clipboard';
import styles from "../style/ChatScreenStyle";
import ParsedText from 'react-native-parsed-text';

interface Message {
  messageId: string;
  chatId: string;
  senderId: { _id: string; name?: string; avatar?: string };
  content: string;
  fileUrl?: string;
  fileName?: string;
  image?: string;
  video?: string;
  isDelivered: boolean;
  isRead: boolean;
  isRecalled?: boolean;
  createdAt: string;
  replyToMessageId?: string;
}

interface Chat {
  chatId: string;
  name: string;
  avatar?: string;
  isGroupChat?: boolean;
}

interface CallData {
  callId: string;
  callType: string;
  isGroupCall: boolean;
  participants?: string[];
  groupName?: string;
}

export default function ChatScreen({ route }) {
  const { chatId, receiverId, name, currentUserId, avatar: initialAvatar, isGroupChat } = route.params;
  const [messages, setMessages]= useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<Array<{ name: string; uri: string; mimeType: string }>>([]);
  const [avatar, setAvatar] = useState(initialAvatar || "https://via.placeholder.com/50");
  const flatListRef = useRef<FlatList>(null);
  const [showEmojiModal, setShowEmojiModal] = useState(false);
  const navigation = useNavigation();
  const [visible, setIsVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [forwardModalVisible, setForwardModalVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [availableChats, setAvailableChats] = useState<Chat[]>([]);
  const [incomingCall, setIncomingCall] = useState<CallData | null>(null);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [streamToken, setStreamToken] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<{ messageId: string; senderName: string; content: string } | null>(null);
const [pinnedModalVisible, setPinnedModalVisible] = useState(false);
const [pinNotification, setPinNotification] = useState<{ senderName: string; content: string; messageId: string } | null>(null);
  const imageMessages = messages
    .filter((msg) => typeof msg.image === "string" && !!msg.image)
    .map((msg) => ({ url: msg.image as string }));
 const pinnedMessages = messages.filter(msg => msg.isPinned);
    useEffect(() => {
  // Join phòng chat khi vào màn hình
  socket.emit("join_chat", chatId); // chatId phải là string

  return () => {
    // Rời phòng chat khi thoát màn hình
    socket.emit("leave_chat", chatId);
  };
}, [chatId]);
  // Lấy Stream token
  useEffect(() => {
    const initializeStream = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) throw new Error("Không tìm thấy token");
        const parsedToken = JSON.parse(token);

        const response = await axios.get(`${BASE_URL}/api/stream/token`, {
          headers: { Authorization: `Bearer ${parsedToken.token}` },
        });

        setStreamToken(response.data.token);
      } catch (error) {
        console.error("Lỗi lấy Stream token:", error);
        Alert.alert("Lỗi", "Không thể lấy token video.");
      }
    };

    initializeStream();
  }, [currentUserId]);

  useEffect(() => {
    fetchMessages();
    fetchAvailableChats();

    socket.on("incoming_call", (data: { callId: string; caller: { _id: string; name: string; avatar: string } }) => {
      setIncomingCall({ callId: data.callId, callType: "video", isGroupCall: false });
      Alert.alert(
        "Cuộc gọi đến",
        `Cuộc gọi video từ ${data.caller.name}`,
        [
          { text: "Chấp nhận", onPress: () => handleAcceptCall(data.callId) },
          { text: "Từ chối", onPress: () => handleRejectCall(data.callId), style: "destructive" },
        ]
      );
    });

    socket.on("call_ended", (data: { callId: string }) => {
      if (incomingCall?.callId === data.callId || activeCallId === data.callId) {
        setIncomingCall(null);
        setActiveCallId(null);
        Alert.alert("Thông báo", "Cuộc gọi đã kết thúc.");
      }
    });

    socket.on("call_rejected", (data: { callId: string; message: string }) => {
      if (incomingCall?.callId === data.callId) {
        setIncomingCall(null);
        Alert.alert("Thông báo", data.message);
      }
    });

    socket.on("new_message", (data: { message: Message }) => {
      if (data.message.chatId === chatId) {
        setMessages((prev) => {
          if (prev.some((msg) => msg.messageId === data.message.messageId)) {
            return prev.map((msg) =>
              msg.messageId === data.message.messageId ? { ...msg, ...data.message } : msg
            );
          }
          const updatedMessages = [...prev, data.message];
          const sortedMessages = updatedMessages.sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
          return sortedMessages;
        });
      }
    });

    socket.on("group_member_added", fetchMessages);
    socket.on("group_member_removed", fetchMessages);
    socket.on("group_dissolved", () => {
      Alert.alert("Thông báo", "Nhóm đã được giải tán.");
      navigation.navigate("HomeTabs", { screen: "Inbox" });
    });
    socket.on("group_avatar_updated", (data: { chatId: string; avatar: string }) => {
      if (data.chatId === chatId) {
        setAvatar(data.avatar ? `${data.avatar}?t=${Date.now()}` : "https://via.placeholder.com/50");
      }
    });
    socket.on("group_ownership_transferred", (data: { chatId: string; newCreatorId: string }) => {
      if (data.chatId === chatId) {
        Alert.alert("Thông báo", "Quyền trưởng nhóm đã được chuyển.");
        fetchMessages();
        fetchGroupDetails();
      }
    });
    socket.on("left_group", (data: { chatId: string; groupName: string }) => {
      if (data.chatId === chatId) {
        Alert.alert("Thông báo", `Bạn đã rời khỏi nhóm ${data.groupName}.`);
        navigation.navigate("HomeTabs", { screen: "Inbox" });
      }
    });
socket.on("message_pinned", ({ messageId, senderName, content, fileName }) => {
  // Nếu là file, ưu tiên hiển thị tên file đẹp
  let displayContent = content;
  if (fileName) {
    displayContent = decodeURIComponent(fileName);
  }
  setPinNotification({ senderName, content: displayContent, messageId });
  fetchMessages();
  setTimeout(() => setPinNotification(null), 5000);
});

socket.on("message_unpinned", ({ messageId }) => {
    fetchMessages();
  });
    markMessageAsRead();

    return () => {
      socket.off("new_message");
      socket.off("group_member_added");
      socket.off("group_member_removed");
      socket.off("group_dissolved");
      socket.off("group_avatar_updated");
      socket.off("group_ownership_transferred");
      socket.off("left_group");
      socket.off("incoming_call");
      socket.off("call_ended");
      socket.off("call_rejected");
      socket.off("message_pinned");
      socket.off("message_unpinned");
    };
  }, [chatId, incomingCall, activeCallId, navigation]);

  const fetchGroupDetails = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Không tìm thấy token");
      const parsedToken = JSON.parse(token);

      const response = await axios.get(`${BASE_URL}/api/chat/${chatId}`, {
        headers: { Authorization: `Bearer ${parsedToken.token}` },
      });

      const chat = response.data;
      setAvatar(chat.avatar || "https://via.placeholder.com/50");
    } catch (error) {
      console.error("Lỗi lấy chi tiết nhóm:", error);
      Alert.alert("Lỗi", "Không thể tải chi tiết nhóm.");
    }
  };

  const fetchMessages = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Không tìm thấy token");
      const parsedToken = JSON.parse(token);

      const response = await axios.get(`${BASE_URL}/api/chat/messages/${chatId}`, {
        headers: { Authorization: `Bearer ${parsedToken.token}` },
      });

      let allMessages = response.data.sort(
        (a: Message, b: Message) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      const hidden = await AsyncStorage.getItem("hiddenMessages");
      const hiddenList = hidden ? JSON.parse(hidden) : [];
      const filteredMessages = allMessages.filter(
        (msg: Message) => !hiddenList.includes(msg.messageId)
      );

      setMessages(filteredMessages);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error("Lỗi lấy tin nhắn:", error);
      Alert.alert("Lỗi", "Không thể tải tin nhắn.");
    }
  };

  const fetchAvailableChats = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Không tìm thấy token");
      const parsedToken = JSON.parse(token);

      const response = await axios.get(`${BASE_URL}/api/chat/list`, {
        headers: { Authorization: `Bearer ${parsedToken.token}` },
      });

      const chats = response.data.chats.map((chat: any) => ({
        chatId: chat.chatId,
        name: chat.name || (chat.isGroupChat ? "Nhóm không tên" : "Unknown"),
        avatar: chat.avatar || "https://via.placeholder.com/50",
        isGroupChat: chat.isGroupChat,
      }));

      setAvailableChats(chats.filter((chat) => chat.chatId !== chatId));
    } catch (error) {
      console.error("Lỗi lấy danh sách chat:", error);
    }
  };

  const pickImage = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true, // Cho phép chọn nhiều ảnh
        allowsEditing: false,
        quality: 1,
      });

      if (res.canceled) return;

      const files = res.assets.map(file => ({
        name: file.fileName || "image.jpg",
        uri: file.uri,
        mimeType: file.mimeType || "image/jpeg",
      }));

      setSelectedFiles(files);
    } catch (error) {
      Alert.alert("Lỗi", "Không thể chọn ảnh.");
    }
  };

  const pickVideo = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsMultipleSelection: true, // Cho phép chọn nhiều video
        allowsEditing: false,
        quality: 1,
      });

      if (res.canceled) return;

      const files = res.assets.map(file => ({
        name: file.fileName || "video.mp4",
        uri: file.uri,
        mimeType: file.mimeType || "video/mp4",
      }));

      setSelectedFiles(files);
    } catch (error) {
      Alert.alert("Lỗi", "Không thể chọn video.");
    }
  };

  const pickFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (res.canceled) return;


      const file = res.assets[0];
      if (!file) {
        Alert.alert("Lỗi", "Không thể lấy thông tin tệp.");
        return;
      }

      const fileSizeLimit = 25 * 1024 * 1024;
      if (file.size && file.size > fileSizeLimit) {
        Alert.alert("Lỗi", "Tệp vượt quá giới hạn 25MB.");
        return;
      }

      setSelectedFiles([{
        name: file.name,
        uri: file.uri,
        mimeType: file.mimeType || "application/octet-stream",
      }]);
    } catch (error) {
      console.error("Lỗi chọn tệp:", error);
      Alert.alert("Lỗi", "Không thể chọn tệp.");
    }
  };

  const sendMessage = async () => {
    if (isSending) return;
    setIsSending(true);

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Không tìm thấy token");
      const parsedToken = JSON.parse(token);
      console.log("Selected file:", selectedFiles[0]);
      if (selectedFiles.length > 0) {
        const formData = new FormData();
        formData.append("chatId", chatId);
        if (receiverId) formData.append("receiverId", receiverId);

        const isAllVideo = selectedFiles.every(f => f.mimeType?.startsWith("video/"));
        const isAllImage = selectedFiles.every(f => f.mimeType?.startsWith("image/"));

        if (isAllVideo) {
          selectedFiles.forEach((vid, idx) => {
            formData.append("videos", {
              uri: Platform.OS === "android" && !vid.uri.startsWith("file://")
                ? `file://${vid.uri}`
                : vid.uri,
              type: vid.mimeType || "video/mp4",
              name: vid.name || `video-${idx}.mp4`,
            });
          });
          formData.append("content", replyTo ? `@${replyTo.senderName} [Videos]` : "[Videos]");
        } else if (isAllImage) {
          selectedFiles.forEach((img, idx) => {
            formData.append("images", {
              uri: Platform.OS === "android" && !img.uri.startsWith("file://")
                ? `file://${img.uri}`
                : img.uri,
              type: img.mimeType || "image/jpeg",
              name: img.name || `image-${idx}.jpg`,
            });
          });
          formData.append("content", replyTo ? `@${replyTo.senderName} [Images]` : "[Images]");
        } else {
          // Gửi file (PDF, Word, ...)
          const file = selectedFiles[0]; // Thêm dòng này
          formData.append("file", {
            uri: Platform.OS === "android" && !file.uri.startsWith("file://")
              ? `file://${file.uri}`
              : file.uri,
            type: file.mimeType || "application/octet-stream",
            name: file.name || "file",
          });
          formData.append("content", replyTo ? `@${replyTo.senderName} [File]` : "[File]");
        }

        await axios.post(`${BASE_URL}/api/chat/send`, formData, {
          headers: {
            Authorization: `Bearer ${parsedToken.token}`,
            "Content-Type": "multipart/form-data",
          },
        });

        setSelectedFiles([]);
      } else if (content.trim()) {
        let finalContent = content.trim();
        if (replyTo) {
          const mention = `@${replyTo.senderName}`;
          if (finalContent.startsWith(mention)) {
            // Đã có mention ở đầu, giữ nguyên
          } else {
            // Không có mention, cũng không thêm nữa
          }
        }
        await axios.post(
          `${BASE_URL}/api/chat/send`,
          { chatId, content: finalContent, receiverId, replyToMessageId: replyTo?.messageId },
          {
            headers: { Authorization: `Bearer ${parsedToken.token}` },
          }
        );
      } else {
        return;
      }

      setContent("");
      setReplyTo(null);
      fetchMessages();
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      if (error.response) {
        console.log("Lỗi gửi file:", error.response.data);
        Alert.alert("Lỗi", error.response.data.message || "Không thể gửi tin nhắn hoặc tệp.");
      } else {
        console.log("Lỗi gửi file:", error);
        Alert.alert("Lỗi", "Không thể gửi tin nhắn hoặc tệp.");
      }
    } finally {
      setIsSending(false);
    }
  };

  const markMessageAsRead = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Không tìm thấy token");
      const parsedToken = JSON.parse(token);

      await axios.post(
        `${BASE_URL}/api/chat/mark-read`,
        { chatId },
        {
          headers: { Authorization: `Bearer ${parsedToken.token}` },
        }
      );
      fetchMessages();
    } catch (error) {
      console.error("Lỗi đánh dấu đã đọc:", error);
    }
  };

  const recallMessage = async (messageId: string) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Không tìm thấy token");
      const parsedToken = JSON.parse(token);

      await axios.post(
        `${BASE_URL}/api/chat/recall`,
        { messageId },
        {
          headers: { Authorization: `Bearer ${parsedToken.token}` },
        }
      );

      fetchMessages();
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error("Lỗi thu hồi tin nhắn:", error);
      Alert.alert("Lỗi", "Không thể thu hồi tin nhắn.");
    }
  };

  const deleteMessageLocally = async (messageId: string) => {
    try {
      const hidden = await AsyncStorage.getItem("hiddenMessages");
      const hiddenList = hidden ? JSON.parse(hidden) : [];

      if (!hiddenList.includes(messageId)) {
        hiddenList.push(messageId);
        await AsyncStorage.setItem("hiddenMessages", JSON.stringify(hiddenList));
      }

      const updatedMessages = messages.filter((msg) => msg.messageId !== messageId);
      setMessages(updatedMessages);

      if (updatedMessages.length === 0) {
        const hiddenChats = await AsyncStorage.getItem("hiddenChats");
        const hiddenChatsList = hiddenChats ? JSON.parse(hiddenChats) : [];

        if (!hiddenChatsList.includes(chatId)) {
          hiddenChatsList.push(chatId);
          await AsyncStorage.setItem("hiddenChats", JSON.stringify(hiddenChatsList));
        }
      }
    } catch (error) {
      console.error("Lỗi khi ẩn tin nhắn:", error);
      Alert.alert("Lỗi", "Không thể xóa tin nhắn khỏi giao diện.");
    }
  };

  const forwardMessage = async (targetChatId: string) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Không tìm thấy token");
      const parsedToken = JSON.parse(token);

      if (!selectedMessage) return;

      // Tạo dữ liệu chuyển tiếp đúng loại
      let forwardData: any = {
        chatId: targetChatId,
        isForwarded: true,
      };

      if (selectedMessage.image) {
        forwardData.image = selectedMessage.image;
        forwardData.content = "[Images]";
      } else if (selectedMessage.video) {
        forwardData.video = selectedMessage.video;
        forwardData.content = "[Videos]";
      } else if (selectedMessage.fileUrl) {
        forwardData.fileUrl = selectedMessage.fileUrl;
        forwardData.fileName = selectedMessage.fileName;
        forwardData.content = selectedMessage.fileName || "[File]";
      } else {
        forwardData.content = selectedMessage.content;
      }

      await axios.post(`${BASE_URL}/api/chat/send`, forwardData, {
        headers: { Authorization: `Bearer ${parsedToken.token}` },
      });

      setForwardModalVisible(false);
      setSelectedMessage(null);
      Alert.alert("Thành công", "Tin nhắn đã được chuyển tiếp.");
    } catch (error) {
      console.error("Lỗi chuyển tiếp tin nhắn:", error);
      Alert.alert("Lỗi", "Không thể chuyển tiếp tin nhắn.");
    }
  };

  const createCall = async (isGroup: boolean) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Không tìm thấy token");
      const parsedToken = JSON.parse(token);

      const endpoint = isGroup ? `${BASE_URL}/api/stream/group-call` : `${BASE_URL}/api/stream/call`;
      const body = isGroup
        ? { chatId, callType: "video" }
        : { participantIds: [receiverId], chatId };

      const response = await axios.post(endpoint, body, {
        headers: { Authorization: `Bearer ${parsedToken.token}` },
      });

      const { callId, participants } = response.data;

      setActiveCallId(callId);

      socket.emit("call_user", {
        callId,
        participantIds: isGroup ? participants : [receiverId],
        chatId,
        callerId: currentUserId,
      });

      Alert.alert("Thành công", `Cuộc gọi video đã được khởi tạo với ID: ${callId}`);
    } catch (error) {
      console.error("Lỗi tạo cuộc gọi:", error);
      Alert.alert("Lỗi", "Không thể tạo cuộc gọi.");
    }
  };

  const handleAcceptCall = async (callId: string) => {
    setActiveCallId(callId);
    setIncomingCall(null);
  };

  const handleRejectCall = (callId: string) => {
    socket.emit("reject_call", { callId, callerId: incomingCall?.callId });
    setIncomingCall(null);
  };

  const endCall = async (callId: string) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Không tìm thấy token");
      const parsedToken = JSON.parse(token);

      await axios.put(`${BASE_URL}/api/stream/call/${callId}/end`, {}, {
        headers: { Authorization: `Bearer ${parsedToken.token}` },
      });

      socket.emit("end_call", { callId });
      setActiveCallId(null);
      Alert.alert("Thành công", "Cuộc gọi đã kết thúc.");
    } catch (error) {
      console.error("Lỗi kết thúc cuộc gọi:", error);
      Alert.alert("Lỗi", "Không thể kết thúc cuộc gọi.");
    }
  };
const pinMessage = async (messageId: string) => {
  try {
    const token = await AsyncStorage.getItem("token");
    const parsedToken = JSON.parse(token);
    await axios.post(`${BASE_URL}/api/chat/pin`, { messageId }, {
      headers: { Authorization: `Bearer ${parsedToken.token}` },
    });
  } catch (error) {
    const msg = error.response?.data?.message;
    Alert.alert("Lỗi", msg || "Không thể ghim tin nhắn.");
  }
};

const unpinMessage = async (messageId: string) => {
  try {
    const token = await AsyncStorage.getItem("token");
    const parsedToken = JSON.parse(token);
    await axios.post(`${BASE_URL}/api/chat/unpin`, { messageId }, {
      headers: { Authorization: `Bearer ${parsedToken.token}` },
    });
  } catch (error) {
    Alert.alert("Lỗi", error.response?.data?.message || "Không thể bỏ ghim.");
  }
};

const scrollToMessage = (messageId: string) => {
  const index = messages.findIndex(m => m.messageId === messageId);
  if (index !== -1) {
    flatListRef.current?.scrollToIndex({ index, animated: true });
  }
};
  const renderMessage = ({ item }: { item: Message }) => {
  console.log("Rendering item:", item);

  const handleReply = () => {
    setReplyTo({ messageId: item.messageId, senderName: item.senderId.name || "Unknown", content: item.content });
    setContent(`@${item.senderId.name || "Unknown"} `);
  };

  const isRecalled = item.isRecalled || item.content === "Tin nhắn đã được thu hồi";
  const isCurrentUser = item.senderId._id === currentUserId;

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return gestureState.dx > 30;
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dx > 30 && !isCurrentUser && !isRecalled) {
        handleReply();
      }
    },
  });

  const handleLongPress = () => {
    const buttons = [];
    buttons.push({ text: "Hủy", style: "cancel" });

    if (!isCurrentUser && !isRecalled) {
      buttons.push({
        text: "Trả lời",
        onPress: handleReply,
        style: "default",
      });
    }

    buttons.push({
      text: "Xóa tin nhắn",
      onPress: () => deleteMessageLocally(item.messageId),
      style: "destructive",
    });

    // Ẩn nút ghim nếu là tin nhắn đã được thu hồi
    if (!isRecalled) {
      if (item.isPinned) {
        buttons.push({
          text: "Bỏ ghim",
          onPress: () => unpinMessage(item.messageId),
          style: "default",
        });
      } else {
        buttons.push({
          text: "Ghim tin nhắn",
          onPress: () => pinMessage(item.messageId),
          style: "default",
        });
      }
    }

    if (isCurrentUser && !isRecalled) {
      buttons.push({
        text: "Thu hồi",
        onPress: () => recallMessage(item.messageId),
        style: "destructive",
      });
    }

    if (!isRecalled) {
      buttons.push({
        text: "Chuyển tiếp",
        onPress: () => {
          setSelectedMessage(item);
          setForwardModalVisible(true);
        },
        style: "default",
      });
    }

    if (buttons.length > 3 && Platform.OS === "android") {
      const moreButtons = buttons.splice(2, buttons.length - 2);
      buttons.push({
        text: "Thêm",
        onPress: () => {
          Alert.alert(
            "Tùy chọn tin nhắn",
            "Chọn hành động khác:",
            [{ text: "Hủy", style: "cancel" }, ...moreButtons]
          );
        },
        style: "default",
      });
    }

    Alert.alert("Tùy chọn tin nhắn", "Chọn hành động cho tin nhắn này:", buttons);
  };

  // Kiểm tra xem tin nhắn này có phải là tin nhắn trả lời không
  const isReply = !!item.replyToMessageId;
const repliedMessage = messages.find(msg => msg.messageId === item.replyToMessageId);

let repliedSenderName = "";
let replyContent = item.content;
  let repliedText = "";
if (repliedMessage) {
  repliedSenderName = repliedMessage.senderId.name || "Không rõ";
  replyContent = item.content.replace(`@${repliedSenderName}`, "").trim();
}
  if (!repliedMessage) {
        repliedText = item.content.split(" ").slice(1).join(" ") || "Tin nhắn gốc không tìm thấy";
      } else {
        repliedText = repliedMessage.content;
      }

  return (

    <TouchableOpacity
      onLongPress={handleLongPress}
      {...panResponder.panHandlers}
      activeOpacity={0.8}
    >
      <View
  style={[
    styles.messageContainer,
    { alignSelf: isCurrentUser ? "flex-end" : "flex-start" },
  ]}
>
  <View style={[
    styles.messageRow,
    { flexDirection: isCurrentUser ? "row-reverse" : "row" }
  ]}>
    {!isCurrentUser && (
      <Image
        source={{ uri: item.senderId.avatar || "https://via.placeholder.com/30" }}
        style={styles.messageAvatar}
      />
    )}
    <View>
      {/* Reply box */}
      {!isRecalled && isReply && repliedMessage && (
        <View style={[
          styles.replyBox,
          isCurrentUser && { alignSelf: "flex-end" } // Nếu là tin nhắn của mình thì sát phải
        ]}>
          <Text style={styles.replySenderName}>@{repliedMessage.senderId.name || "Không rõ"}</Text>
          <Text style={styles.replyText}>{repliedMessage.content}</Text>
        </View>
      )}
      {/* Nội dung tin nhắn */}
      <View style={[
        styles.messageContent,
        isRecalled
          ? { backgroundColor: "#ececec" }
          : { backgroundColor: isCurrentUser ? "#007AFF" : "#f0f0f0" }
      ]}>
        {isRecalled ? (
          <Text style={[styles.messageText, { color: "#888", fontStyle: "italic", textAlign: "center" }]}>
            Tin nhắn đã được thu hồi
          </Text>
        ) : item.image ? (
          <TouchableOpacity onPress={() => {
            const idx = imageMessages.findIndex(img => img.url === item.image);
            setCurrentImageIndex(idx !== -1 ? idx : 0);
            setIsVisible(true);
          }}>
            <Image
              source={{ uri: item.image }}
              style={{ width: 180, height: 180, borderRadius: 10, marginBottom: 4 }}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ) : item.video ? (
          <Video
            source={{ uri: item.video }}
            style={{ width: 200, height: 200, borderRadius: 10, marginBottom: 4 }}
            useNativeControls
            resizeMode="contain"
            shouldPlay={false}
          />
        ) : item.fileUrl ? (
          <TouchableOpacity
            onPress={() => {
              Linking.openURL(item.fileUrl);
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: isCurrentUser ? "#e3f2fd" : "#f5f5f5",
              borderRadius: 10,
              padding: 10,
              marginVertical: 4,
              maxWidth: 260,
              minWidth: 120,
              borderWidth: 1,
              borderColor: "#b3c6e7",
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name="document-attach-outline"
              size={32}
              color="#1976d2"
              style={{ marginRight: 10 }}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: "#1976d2",
                  fontWeight: "bold",
                  fontSize: 15,
                  textDecorationLine: "underline",
                }}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {item.fileName ? decodeURIComponent(item.fileName) : "Tệp đính kèm"}
              </Text>
              <Text style={{ color: "#888", fontSize: 12, marginTop: 2 }}>
                {item.fileName?.split(".").pop()?.toUpperCase() || "FILE"}
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          <Text
            style={[
              styles.messageText,
              { color: isCurrentUser ? "#fff" : "#222" }
            ]}
          >
            {item.content}
          </Text>
        )}
        {/* Footer: giờ gửi */}
        <View style={styles.messageFooter}>
          <Text style={[
            styles.messageTime,
            !isRecalled && isCurrentUser && { color: "#e0e0e0" }
          ]}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    </View>
  </View>
</View>
    </TouchableOpacity>
  );
};
  const handleShowEmoji = () => {
    setShowEmojiModal((prev) => !prev);
  };

  const onEmojiSelect = (emoji: string) => {
    setContent((prevContent) => prevContent + emoji);
    setShowEmojiModal(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 10 }}>
    <Ionicons name="arrow-back" size={28} color="#007AFF" />
  </TouchableOpacity>
  <Image
    source={{ uri: avatar }}
    style={styles.headerAvatar}
  />
  <TouchableOpacity
    onPress={() =>
      navigation.navigate("ChatInfoScreen", {
        chatId,
        name,
        avatar,
        isGroupChat,
        currentUserId,
        receiverId,
      })
    }
  >
    <Text style={styles.headerText}>{name}</Text>
  </TouchableOpacity>
          {isGroupChat ? (
            <TouchableOpacity
              onPress={() => createCall(true)}
              style={{ marginLeft: "auto" }}
            >
              <Ionicons name="videocam-outline" size={24} color="#007AFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => createCall(false)}
              style={{ marginLeft: "auto" }}
            >
              <Ionicons name="videocam-outline" size={24} color="#007AFF" />
            </TouchableOpacity>
          )}
          {isGroupChat && (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("GroupManagement", {
                  chatId,
                  groupName: name,
                  currentUserId,
                })
              }
              style={{ marginLeft: 10 }}
            >
              <Ionicons name="settings-outline" size={24} color="#007AFF" />
            </TouchableOpacity>
          )}
        </View>
        {activeCallId && streamToken && (
          <View style={styles.callContainer}>
            <WebView
              source={{
                uri: `https://453d-171-248-108-160.ngrok-free.app/call.html?callId=${activeCallId}&userId=${currentUserId}&token=${streamToken}`,
              }}
              userAgent="Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
              style={{ flex: 1 }}
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.warn("WebView error: ", nativeEvent);
                Alert.alert("Lỗi", "Không thể tải cuộc gọi. Vui lòng kiểm tra kết nối hoặc CSP.");
              }}
              onMessage={(event) => {
                if (event.nativeEvent.data === "call_ended") {
                  endCall(activeCallId);
                }
              }}
            />
            <TouchableOpacity
              style={styles.endCallButton}
              onPress={() => endCall(activeCallId)}
            >
              <Text style={styles.endCallButtonText}>Kết thúc cuộc gọi</Text>
            </TouchableOpacity>
          </View>
        )}
      

{pinnedMessages.length > 0 && (
  <TouchableOpacity
    onPress={() => setPinnedModalVisible(true)}
    style={styles.pinnedBanner}
    activeOpacity={0.8}
  >
    <Text style={styles.pinnedText}>
      📌 {pinnedMessages.length} tin nhắn đã ghim
    </Text>
  </TouchableOpacity>
)}
{pinNotification && (
  <View style={styles.pinNotification}>
    <Text>
      <Text style={{ color: "#ff9800" }}>📌 </Text>
      Bạn đã ghim tin nhắn <Text style={{ fontWeight: "bold" }}>{pinNotification.content}</Text>.{" "}
      <Text
        style={{ color: "#1976d2" }}
        onPress={() => {
          scrollToMessage(pinNotification.messageId);
          setPinNotification(null);
        }}
      >
        Xem
      </Text>
    </Text>
  </View>
)}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.messageId}
          renderItem={renderMessage}
          style={styles.messageList}
          extraData={messages}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }}
        />
        <View style={styles.inputContainer}>
  {selectedFiles.length > 0 && (
    <ScrollView horizontal style={{ flexDirection: "row", marginBottom: 8 }}>
      {selectedFiles.map((file, idx) => (
        <View key={idx} style={styles.filePreview}>
          <Image source={{ uri: file.uri }} style={{ width: 60, height: 60, borderRadius: 8 }} />
          <TouchableOpacity onPress={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== idx))}>
            <Ionicons name="close-circle-outline" size={20} color="#333" />
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  )}
  {replyTo && (
    <View style={styles.replyPreview}>
      <Text style={styles.replyText}>
        Trả lời @{replyTo.senderName}: {replyTo.content}
      </Text>
    </View>
  )}
  <View style={styles.inputRow}>
    <TextInput
      value={content}
      onChangeText={setContent}
      placeholder="Nhập tin nhắn..."
      style={styles.input}
      editable={selectedFiles.length === 0}
    />
    <TouchableOpacity onPress={handleShowEmoji} style={styles.iconButton}>
      <Ionicons name="happy-outline" size={24} color="#333" />
    </TouchableOpacity>
    <TouchableOpacity onPress={pickImage} style={styles.iconButton}>
      <Ionicons name="image-outline" size={24} color="#333" />
    </TouchableOpacity>
    <TouchableOpacity onPress={pickVideo} style={styles.iconButton}>
      <Ionicons name="videocam-outline" size={24} color="#333" />
    </TouchableOpacity>
    <TouchableOpacity onPress={pickFile} style={styles.iconButton}>
      <Ionicons name="attach-outline" size={24} color="#333" />
    </TouchableOpacity>
    <Button
      title="Gửi"
      onPress={sendMessage}
      disabled={!content.trim() && selectedFiles.length === 0}
    />
  </View>
</View>

        {showEmojiModal && (
          <EmojiModal
            visible={showEmojiModal}
            onEmojiSelected={onEmojiSelect}
            onClose={() => setShowEmojiModal(false)}
            modalStyle={styles.emojiModal}
            emojiSize={30}
          />
        )}

        <Modal
          isVisible={forwardModalVisible}
          onBackdropPress={() => setForwardModalVisible(false)}
          onBackButtonPress={() => setForwardModalVisible(false)}
          style={styles.forwardModal}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chọn cuộc trò chuyện để chuyển tiếp</Text>
            <FlatList
              data={availableChats}
              keyExtractor={(item) => item.chatId}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.chatItem}
                  onPress={() => forwardMessage(item.chatId)}
                >
                  <Image
                    source={{ uri: item.avatar }}
                    style={styles.chatAvatar}
                  />
                  <Text style={styles.chatName}>{item.name}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Không có cuộc trò chuyện nào.</Text>
              }
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setForwardModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </Modal>

        {visible && (
          <Modal
            isVisible={visible}
            onBackdropPress={() => setIsVisible(false)}
            onBackButtonPress={() => setIsVisible(false)}
            style={{ margin: 0 }}
          >
            <ImageViewer
              imageUrls={imageMessages}
              index={currentImageIndex}
              onSwipeDown={() => setIsVisible(false)}
              enableSwipeDown
              onCancel={() => setIsVisible(false)}
              saveToLocalByLongPress={false}
            />
          </Modal>
        )}
      <Modal isVisible={pinnedModalVisible} onBackdropPress={() => setPinnedModalVisible(false)}>
  <View style={styles.modalContent}>
    <Text style={styles.modalTitle}>📌 Danh sách tin nhắn đã ghim</Text>
    <FlatList
      data={pinnedMessages}
      keyExtractor={(item) => item.messageId}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => {
            setPinnedModalVisible(false);
            scrollToMessage(item.messageId);
          }}
          style={styles.pinnedItemLarge}
        >
          <Text style={styles.pinnedSender}>{item.senderId.name}</Text>
          {/* Hiển thị nội dung ghim đúng kiểu */}
      {item.image ? (
        <Image
          source={{ uri: item.image }}
          style={{ width: 180, height: 180, borderRadius: 10, marginBottom: 4 }}
          resizeMode="cover"
        />
      ) : item.video ? (
        <Video
          source={{ uri: item.video }}
          style={{ width: 200, height: 200, borderRadius: 10, marginBottom: 4 }}
          useNativeControls
          resizeMode="contain"
          shouldPlay={false}
        />
      ) : item.fileUrl ? (
        <TouchableOpacity
          onPress={() => Linking.openURL(item.fileUrl)}
          style={styles.fileBlock}
          activeOpacity={0.7}
        >
          <Ionicons
            name="document-attach-outline"
            size={32}
            color="#1976d2"
            style={styles.fileIcon}
          />
          <View style={{ flex: 1 }}>
            <Text
              style={styles.fileName}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {item.fileName ? decodeURIComponent(item.fileName) : "Tệp đính kèm"}
            </Text>
            <Text style={styles.fileType}>
              {item.fileName?.split(".").pop()?.toUpperCase() || "FILE"}
            </Text>
          </View>
        </TouchableOpacity>
      ) : (
        <Text style={styles.pinnedContent}>{item.content}</Text>
      )}
      <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
        {/* Ẩn nút Copy nếu là file, ảnh, video */}
        {!(item.image || item.video || item.fileUrl) && (
          <TouchableOpacity
            onPress={() => Clipboard.setStringAsync(item.content)}
            style={[styles.unpinButton, { marginRight: 8, backgroundColor: "#1976d2" }]}
          >
            <Text style={styles.unpinButtonText}>Copy</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => unpinMessage(item.messageId)} style={styles.unpinButton}>
          <Text style={styles.unpinButtonText}>Bỏ ghim</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )}
  ListEmptyComponent={<Text style={styles.emptyText}>Chưa có tin nhắn ghim.</Text>}
    />
    <TouchableOpacity onPress={() => setPinnedModalVisible(false)} style={styles.closeButton}>
      <Text style={styles.closeButtonText}>Đóng</Text>
    </TouchableOpacity>
  </View>
</Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}