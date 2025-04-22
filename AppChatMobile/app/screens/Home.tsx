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
export default function Home() {
  const [search, setSearch] = useState("");
  const [chats, setChats] = useState([]);
  const actionSheetRef = useRef(null);
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      fetchChats();
      
      socket.on("new_message", fetchChats);
      socket.on("new_group_created", fetchChats);
      socket.on("group_dissolved", fetchChats);
      socket.on("group_avatar_updated", fetchChats);
      return () => {
        socket.off("new_message", fetchChats);
        socket.off("new_group_created", fetchChats);
        socket.off("group_dissolved", fetchChats);
        socket.off("group_avatar_updated",fetchChats);
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

      console.log("Chats fetched:", response.data.chats); 
      setChats(response.data.chats);
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
          });
        }}
      >
        <Image
          source={{ uri: item.avatar || "https://via.placeholder.com/50" }}
          style={{ width: 50, height: 50, borderRadius: 25, marginRight: 12 }}
        />
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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 12,
          backgroundColor: "#fff",
          borderBottomWidth: 1,
          borderColor: "#eee",
          marginTop: 30,
        }}
      >
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            backgroundColor: "#f0f0f0",
            borderRadius: 25,
            paddingHorizontal: 15,
            alignItems: "center",
            marginRight: 10,
            height: 40,
          }}
        >
          <Ionicons name="search-outline" size={20} color="#888" />
          <TextInput
            placeholder="Tìm kiếm"
            value={search}
            onChangeText={setSearch}
            style={{
              flex: 1,
              marginLeft: 8,
              fontSize: 15,
              color: "#333",
            }}
          />
        </View>

        <TouchableOpacity
          onPress={openActionSheet}
          style={{
            backgroundColor: "#007AFF",
            borderRadius: 50,
            padding: 8,
          }}
        >
          <Ionicons name="person-add-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item.chatId}
        renderItem={renderChatItem}
        ListEmptyComponent={
          <Text
            style={{
              textAlign: "center",
              color: "#666",
              marginTop: 50,
              fontSize: 16,
            }}
          >
            Không có cuộc trò chuyện nào.
          </Text>
        }
      />
      <ActionSheet ref={actionSheetRef}>
        <TouchableOpacity
          style={{ padding: 16 }}
          onPress={() => handleOptionPress("addFriend")}
        >
          <Text style={{ fontSize: 16 }}>➕ Thêm bạn mới</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ padding: 16 }}
          onPress={() => handleOptionPress("createGroup")}
        >
          <Text style={{ fontSize: 16 }}>👥 Tạo nhóm</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ padding: 16 }}
          onPress={() => actionSheetRef.current?.hide()}
        >
          <Text style={{ fontSize: 16, color: "red" }}>Hủy</Text>
        </TouchableOpacity>
      </ActionSheet>
    </SafeAreaView>
  );
}
