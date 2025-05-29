import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  SafeAreaView,
} from "react-native";
import React, { useRef, useState, useEffect } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import ActionSheet from "react-native-actions-sheet";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import socket from "../config/socket";
import { BASE_URL } from "../config/config";
import { Alert } from "react-native";
export default function Home() {
  const [search, setSearch] = useState("");
  const [chats, setChats] = useState([]);
  const actionSheetRef = useRef(null);
  const navigation = useNavigation();
const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  useFocusEffect(
    useCallback(() => {
      fetchChats();

      socket.on("new_message", fetchChats);
      socket.on("new_group_created", fetchChats);
      socket.on("group_dissolved", fetchChats);
      socket.on("group_avatar_updated", fetchChats);
      socket.on("left_group", fetchChats);
      socket.on("group_member_added", fetchChats); 
    socket.on("online_users", (users) => {
    // users là mảng [[userId, socketId], ...]
    setOnlineUsers(users.map(([userId]) => userId));
  });
      return () => {
        socket.off("new_message", fetchChats);
        socket.off("new_group_created", fetchChats);
        socket.off("group_dissolved", fetchChats);
        socket.off("group_avatar_updated", fetchChats);
        socket.off("left_group", fetchChats);
        socket.off("group_member_added", fetchChats); 
        socket.off("online_users");
      };
    }, [])
  );

  const fetchChats = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Không tìm thấy token");
      const parsedToken = JSON.parse(token);

      const response = await axios.get(
        `${BASE_URL}/api/chat/list`,
        {
          headers: {
            Authorization: `Bearer ${parsedToken.token}`,
          },
        }
      );

      // Lấy danh sách hiddenChats từ AsyncStorage
      const hiddenChats = await AsyncStorage.getItem("hiddenChats");
      const hiddenChatsList = hiddenChats ? JSON.parse(hiddenChats) : [];

      // Lọc bỏ các cuộc trò chuyện có chatId trong hiddenChatsList
      const filteredChats = response.data.chats.filter(
        (chat) => !hiddenChatsList.includes(chat.chatId)
      );

      console.log("Chats fetched:", filteredChats);
      setChats(filteredChats);
    } catch (error) {
      console.error("Lỗi lấy danh sách chat:", error);
      alert("Không thể tải danh sách cuộc trò chuyện.");
    }
  };

  const filteredChats = chats.filter((chat) =>
    chat.name.toLowerCase().includes(search.toLowerCase())
  );

  const renderChatItem = ({ item }) => {
    const otherParticipant = item.participants.find(
      (p) => p._id !== item.currentUserId
    );
    return (
      <TouchableOpacity
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 12,
          borderBottomWidth: 1,
          borderColor: "#f0f0f0",
        }}
        onPress={() => {
          const chatName = item.name || (item.isGroupChat ? "Nhóm không tên" : otherParticipant?.name || "Unknown");
          console.log("Navigating to ChatScreen with:", {
            chatId: item.chatId,
            receiverId: item.isGroupChat ? null : otherParticipant?._id,
            name: chatName,
            currentUserId: item.currentUserId,
            isGroupChat: item.isGroupChat,
          });
          navigation.navigate("ChatScreen", {
            chatId: item.chatId,
            receiverId: item.isGroupChat ? null : otherParticipant?._id,
            name: chatName,
            avatar: item.avatar || "https://via.placeholder.com/50",
            currentUserId: item.currentUserId,
            isGroupChat: item.isGroupChat,
            onlineUsers, 
          });
        }}
      >
        <View style={{ position: "relative" }}>
          <Image
            source={{ uri: item.avatar || "https://via.placeholder.com/50" }}
            style={{ width: 50, height: 50, borderRadius: 25, marginRight: 12 }}
          />
          {/* Chấm xanh nếu online */}
          {onlineUsers.includes(item.isGroupChat ? null : otherParticipant?._id) && (
            <View
              style={{
                position: "absolute",
                bottom: 4,
                right: 8,
                width: 14,
                height: 14,
                borderRadius: 7,
                backgroundColor: "#22c55e",
                borderWidth: 2,
                borderColor: "#fff",
              }}
            />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#222" }}>
            {item.name || (item.isGroupChat ? "Nhóm không tên" : otherParticipant?.name || "Unknown")}
          </Text>
          <Text
            style={[
              { fontSize: 14, color: "#666" },
              item.hasUnread && { fontWeight: "bold", color: "#000" },
            ]}
          >
            {item.lastMessage}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const openActionSheet = () => {
    actionSheetRef.current?.show();
  };

  const handleOptionPress = (option) => {
    if (option === "addFriend") {
      navigation.navigate("AddFriend");
    } else if (option === "createGroup") {
      navigation.navigate("CreateGroup");
    }
    actionSheetRef.current?.hide();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f6f8fa" }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 16,
          backgroundColor: "#fff",
          borderBottomWidth: 1,
          borderColor: "#eee",
          marginTop: 18,
          shadowColor: "#000",
          shadowOpacity: 0.03,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            backgroundColor: "#1976d2", // Nền xanh đậm
            borderRadius: 22,
            paddingHorizontal: 16,
            alignItems: "center",
            marginRight: 10,
            height: 44,
            borderWidth: 0,
          }}
        >
          <Ionicons name="search-outline" size={20} color="#fff" />
          <TextInput
            placeholder="Tìm kiếm"
            value={search}
            onChangeText={setSearch}
            style={{
              flex: 1,
              marginLeft: 8,
              fontSize: 16,
              color: "#fff", // Text trắng
            }}
            placeholderTextColor="#e3eaf2" // Placeholder sáng
          />
        </View>

        <TouchableOpacity
          onPress={openActionSheet}
          style={{
            backgroundColor: "#1976d2",
            borderRadius: 50,
            padding: 10,
            marginLeft: 2,
            shadowColor: "#1976d2",
            shadowOpacity: 0.12,
            shadowRadius: 6,
            elevation: 2,
          }}
        >
          <Ionicons name="person-add-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item.chatId}
        renderItem={({ item }) => {
          const otherParticipant = item.participants.find(
            (p) => p._id !== item.currentUserId
          );
          return (
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 14,
                marginHorizontal: 12,
                marginTop: 10,
                marginBottom: 2,
                backgroundColor: "#fff",
                borderRadius: 16,
                shadowColor: "#000",
                shadowOpacity: 0.04,
                shadowRadius: 6,
                elevation: 1,
              }}
              activeOpacity={0.7}
              onPress={() => {
                const chatName = item.name || (item.isGroupChat ? "Nhóm không tên" : otherParticipant?.name || "Unknown");
                navigation.navigate("ChatScreen", {
                  chatId: item.chatId,
                  receiverId: item.isGroupChat ? null : otherParticipant?._id,
                  name: chatName,
                  avatar: item.avatar || "https://via.placeholder.com/50",
                  currentUserId: item.currentUserId,
                  isGroupChat: item.isGroupChat,
                  onlineUsers,
                });
              }}
            >
              <View style={{ position: "relative" }}>
                <Image
                  source={{ uri: item.avatar || "https://via.placeholder.com/50" }}
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 27,
                    marginRight: 14,
                    backgroundColor: "#e3eaf2",
                    borderWidth: 2,
                    borderColor: "#f3f6fb",
                  }}
                />
                {onlineUsers.includes(item.isGroupChat ? null : otherParticipant?._id) && (
                  <View
                    style={{
                      position: "absolute",
                      bottom: 6,
                      right: 12,
                      width: 14,
                      height: 14,
                      borderRadius: 7,
                      backgroundColor: "#22c55e",
                      borderWidth: 2,
                      borderColor: "#fff",
                    }}
                  />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: "700", color: "#222" }}>
                  {item.name || (item.isGroupChat ? "Nhóm không tên" : otherParticipant?.name || "Unknown")}
                </Text>
                <Text
                  style={[
                    { fontSize: 15, color: "#666", marginTop: 2 },
                    item.hasUnread && { fontWeight: "bold", color: "#1976d2" },
                  ]}
                  numberOfLines={1}
                >
                  {item.lastMessage}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <Text
            style={{
              textAlign: "center",
              color: "#888",
              marginTop: 60,
              fontSize: 16,
            }}
          >
            Không có cuộc trò chuyện nào.
          </Text>
        }
        showsVerticalScrollIndicator={false}
      />
      <ActionSheet ref={actionSheetRef}>
        <TouchableOpacity
          style={{ padding: 18 }}
          onPress={() => handleOptionPress("addFriend")}
        >
          <Text style={{ fontSize: 17 }}>➕ Thêm bạn mới</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ padding: 18 }}
          onPress={() => handleOptionPress("createGroup")}
        >
          <Text style={{ fontSize: 17 }}>👥 Tạo nhóm</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ padding: 18 }}
          onPress={() => actionSheetRef.current?.hide()}
        >
          <Text style={{ fontSize: 17, color: "red" }}>Hủy</Text>
        </TouchableOpacity>
      </ActionSheet>
    </SafeAreaView>
  );
}