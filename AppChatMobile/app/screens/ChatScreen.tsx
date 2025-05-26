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
import { WebView } from "react-native-webview"; // Thêm import WebView

interface Message {
  messageId: string;
  chatId: string;
  senderId: { _id: string; name?: string; avatar?: string };
  content: string;
  fileUrl?: string;
  file滴: string;
  fileName?: string;
  image?: string;
  video?: string;
  isDelivered: boolean;
  isRead: boolean;
  isRecalled?: boolean;
  createdAt: string;
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<{ name: string; uri: string; mimeType: string } | null>(null);
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

  const imageMessages = messages
    .filter((msg) => typeof msg.image === "string" && !!msg.image)
    .map((msg) => ({ url: msg.image as string }));

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
      Alert.alert("Thông báo", "Nh sehen được giải tán.");
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
    // Làm mới chi tiết nhóm để cập nhật trạng thái trưởng nhóm
    fetchGroupDetails();
  }
});
    socket.on("left_group", (data: { chatId: string; groupName: string }) => {
      if (data.chatId === chatId) {
        Alert.alert("Thông báo", `Bạn đã rời khỏi nhóm ${data.groupName}.`);
        navigation.navigate("HomeTabs", { screen: "Inbox" });
      }
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
    // Cập nhật thêm các thông tin khác nếu cần
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
        allowsEditing: false,
        quality: 1,
      });

      if (res.canceled) return;

      const file = res.assets[0];
      if (!file) {
        Alert.alert("Lỗi", "Không thể lấy thông tin ảnh.");
        return;
      }

      const imageSizeLimit = 5 * 1024 * 1024;
      if (file.fileSize && file.fileSize > imageSizeLimit) {
        Alert.alert("Lỗi", "Ảnh vượt quá giới hạn 5MB.");
        return;
      }

      setSelectedFile({
        name: file.fileName || "image.jpg",
        uri: file.uri,
        mimeType: file.mimeType || "image/jpeg",
      });
    } catch (error) {
      console.error("Lỗi chọn ảnh:", error);
      Alert.alert("Lỗi", "Không thể chọn ảnh.");
    }
  };

  const pickVideo = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
      });

      if (res.canceled) return;

      const file = res.assets[0];
      if (!file) {
        Alert.alert("Lỗi", "Không thể lấy thông tin video.");
        return;
      }

      const videoSizeLimit = 10 * 1024 * 1024;
      if (file.fileSize && file.fileSize > videoSizeLimit) {
        Alert.alert("Lỗi", "Video vượt quá giới hạn 10MB.");
        return;
      }

      setSelectedFile({
        name: file.fileName || "video.mp4",
        uri: file.uri,
        mimeType: file.mimeType || "video/mp4",
      });
    } catch (error) {
      console.error("Lỗi chọn video:", error);
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

      setSelectedFile({
        name: file.name,
        uri: file.uri,
        mimeType: file.mimeType || "application/octet-stream",
      });
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

      if (selectedFile) {
        const formData = new FormData();
        formData.append("chatId", chatId);
        if (receiverId) formData.append("receiverId", receiverId);

        const file = {
          uri: Platform.OS === "android" && !selectedFile.uri.startsWith("file://")
            ? `file://${selectedFile.uri}`
            : selectedFile.uri,
          type: selectedFile.mimeType || "application/octet-stream",
          name: selectedFile.name || `file-${Date.now()}`,
        };

        if (selectedFile.mimeType.startsWith("image/")) {
          formData.append("image", file);
          formData.append("content", "[Image]");
        } else if (selectedFile.mimeType.startsWith("video/")) {
          formData.append("video", file);
          formData.append("content", "[Video]");
        } else {
          formData.append("file", file);
          formData.append("content", selectedFile.name);
        }

        await axios.post(`${BASE_URL}/api/chat/send`, formData, {
          headers: {
            Authorization: `Bearer ${parsedToken.token}`,
            "Content-Type": "multipart/form-data",
          },
        });

        setSelectedFile(null);
      } else if (content.trim()) {
        await axios.post(
          `${BASE_URL}/api/chat/send`,
          { chatId, content, receiverId },
          {
            headers: { Authorization: `Bearer ${parsedToken.token}` },
          }
        );
      } else {
        return;
      }

      setContent("");
      fetchMessages();
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error("Lỗi gửi:", error.response?.data || error);
      Alert.alert(
        "Lỗi",
        error.response?.data?.message || "Không thể gửi tin nhắn hoặc tệp."
      );
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

      const forwardData = {
        chatId: targetChatId,
        content: selectedMessage.content,
        isForwarded: true,
        originalMessage: {
          messageId: selectedMessage.messageId,
          senderId: selectedMessage.senderId._id,
          createdAt: selectedMessage.createdAt,
          content: selectedMessage.content,
          image: selectedMessage.image,
          video: selectedMessage.video,
          fileUrl: selectedMessage.fileUrl,
          fileName: selectedMessage.fileName,
        },
      };

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

  const renderMessage = ({ item }: { item: Message }) => {
    const isRecalled = item.isRecalled || item.content === "Tin nhắn đã được thu hồi";
    const isCurrentUser = item.senderId._id === currentUserId;

    const handleLongPress = () => {
      const buttons = [];

      buttons.push({ text: "Hủy", style: "cancel" });
      buttons.push({
        text: "Xóa tin nhắn",
        onPress: () => deleteMessageLocally(item.messageId),
        style: "destructive",
      });

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

    return (
      <TouchableOpacity onLongPress={handleLongPress}>
        <View
          style={[
            styles.messageContainer,
            { alignSelf: isCurrentUser ? "flex-end" : "flex-start" },
          ]}
        >
          <View
            style={[
              styles.messageRow,
              { flexDirection: isCurrentUser ? "row-reverse" : "row" },
            ]}
          >
            {!isCurrentUser && (
              <Image
                source={{
                  uri: item.senderId.avatar || "https://via.placeholder.com/30",
                }}
                style={styles.messageAvatar}
              />
            )}
            <View
              style={[
                styles.messageContent,
                {
                  backgroundColor: isCurrentUser ? "#007AFF" : "#f0f0f0",
                  borderTopLeftRadius: isCurrentUser ? 10 : 0,
                  borderTopRightRadius: isCurrentUser ? 0 : 10,
                },
              ]}
            >
              {isGroupChat && !isCurrentUser && !isRecalled && (
                <Text style={styles.senderName}>{item.senderId.name}</Text>
              )}
              {isRecalled ? (
                <Text
                  style={[
                    styles.messageText,
                    { color: isCurrentUser ? "#fff" : "#333", fontStyle: "italic" },
                  ]}
                >
                  Tin nhắn đã được thu hồi
                </Text>
              ) : item.image ? (
                <TouchableOpacity
                  onPress={() => {
                    const index = imageMessages.findIndex(
                      (img) => img.url === item.image
                    );
                    setCurrentImageIndex(index);
                    setIsVisible(true);
                  }}
                >
                  <Image
                    source={{ uri: item.image }}
                    style={styles.messageImage}
                    resizeMode="cover"
                    onError={(error) =>
                      console.log("Image load error:", error.nativeEvent)
                    }
                  />
                </TouchableOpacity>
              ) : item.video ? (
                <Video
                  source={{ uri: item.video }}
                  style={styles.messageVideo}
                  useNativeControls
                  resizeMode={ResizeMode.CONTAIN}
                  isLooping={false}
                  onError={(error) => console.log("Video load error:", error)}
                />
              ) : item.fileUrl ? (
                <TouchableOpacity
                  onPress={() => {
                    if (item.fileUrl) {
                      Linking.openURL(item.fileUrl).catch((err) =>
                        Alert.alert("Lỗi", "Không thể mở tệp.")
                      );
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.messageText,
                      {
                        color: isCurrentUser ? "#fff" : "#333",
                        textDecorationLine: "underline",
                      },
                    ]}
                  >
                    Tệp: {item.fileName}
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text
                  style={[
                    styles.messageText,
                    { color: isCurrentUser ? "#fff" : "#333" },
                  ]}
                >
                  {item.content}
                </Text>
              )}
              <View style={styles.messageFooter}>
                <Text style={[styles.messageTime, { color: isCurrentUser ? "#ddd" : "#888" }]}>
                  {new Date(item.createdAt).toLocaleTimeString()}
                </Text>
                {isCurrentUser && !isRecalled && (
                  <Text style={styles.messageStatus}>
                    {item.isRead ? "Đã đọc" : item.isDelivered ? "Đã gửi" : "Đang gửi"}
                  </Text>
                )}
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
          <Image
            source={{ uri: avatar || "https://via.placeholder.com/50" }}
            style={styles.headerAvatar}
          />
          <Text style={styles.headerText}>{name}</Text>
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
        console.warn('WebView error: ', nativeEvent);
        Alert.alert('Lỗi', 'Không thể tải cuộc gọi. Vui lòng kiểm tra kết nối hoặc CSP.');
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
          {selectedFile && (
            <View style={styles.filePreview}>
              <Text style={styles.filePreviewText}>
                {selectedFile.mimeType.startsWith("image/")
                  ? `Ảnh: ${selectedFile.name}`
                  : selectedFile.mimeType.startsWith("video/")
                  ? `Video: ${selectedFile.name}`
                  : `Tệp: ${selectedFile.name} (${selectedFile.mimeType.split("/").pop()})`}
              </Text>
              <TouchableOpacity onPress={() => setSelectedFile(null)}>
                <Ionicons name="close-circle-outline" size={20} color="#333" />
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.inputRow}>
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="Nhập tin nhắn..."
              style={styles.input}
              editable={!selectedFile}
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
              disabled={!content.trim() && !selectedFile}
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#222",
  },
  messageList: {
    flex: 1,
    paddingHorizontal: 10,
  },
  inputContainer: {
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#eee",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    padding: 10,
    marginRight: 10,
  },
  iconButton: {
    padding: 5,
    marginRight: 5,
  },
  emojiModal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 10,
    maxHeight: "50%",
  },
  filePreview: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
    width: "100%",
  },
  filePreviewText: {
    flex: 1,
    color: "#333",
    flexWrap: "wrap",
    fontSize: 14,
  },
  messageContainer: {
    marginBottom: 10,
    maxWidth: "80%",
  },
  messageRow: {
    alignItems: "flex-end",
  },
  messageAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginHorizontal: 5,
  },
  messageContent: {
    padding: 10,
    borderRadius: 10,
    maxWidth: "100%",
  },
  senderName: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  messageText: {
    fontSize: 14,
    fontStyle: "normal",
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 5,
  },
  messageVideo: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 5,
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  messageTime: {
    fontSize: 10,
    marginRight: 5,
  },
  messageStatus: {
    fontSize: 10,
    color: "#ddd",
  },
  forwardModal: {
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    width: "80%",
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  chatName: {
    fontSize: 16,
    color: "#333",
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    padding: 10,
  },
  closeButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#007AFF",
    borderRadius: 5,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  callContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  endCallButton: {
    backgroundColor: "#ff3b30",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    margin: 10,
  },
  endCallButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});