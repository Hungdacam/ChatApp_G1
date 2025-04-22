import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  SafeAreaView,
  Alert,
  
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { BASE_URL } from "../config/config";
import { useNavigation } from "@react-navigation/native";

export default function AddGroupMember({ route }) {
  const { chatId } = route.params;
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const navigation = useNavigation();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Không tìm thấy token");
      const parsedToken = JSON.parse(token);

      // Lấy danh sách bạn bè
      const friendsResponse = await axios.get(`${BASE_URL}/api/friends/list`, {
        headers: { Authorization: `Bearer ${parsedToken.token}` },
      });

      // Lấy danh sách thành viên hiện tại của nhóm
      const chatResponse = await axios.get(`${BASE_URL}/api/chat/${chatId}`, {
        headers: { Authorization: `Bearer ${parsedToken.token}` },
      });

      const currentMembers = chatResponse.data.participants.map((p) => p._id);
      const filteredUsers = friendsResponse.data.filter(
        (user) => !currentMembers.includes(user._id)
      );

      console.log("Filtered friends:", filteredUsers); // Log để kiểm tra
      setUsers(filteredUsers);
    } catch (error) {
      console.error("Lỗi lấy danh sách bạn bè:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách bạn bè.");
    }
  };

  const toggleSelectUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const addMembers = async () => {
    if (selectedUsers.length === 0) {
      Alert.alert("Lỗi", "Vui lòng chọn ít nhất 1 thành viên.");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Không tìm thấy token");
      const parsedToken = JSON.parse(token);

      for (const userId of selectedUsers) {
        await axios.post(
          `${BASE_URL}/api/group/add-member`,
          { chatId, userId },
          {
            headers: { Authorization: `Bearer ${parsedToken.token}` },
          }
        );
      }

      Alert.alert("Thành công", "Đã thêm thành viên vào nhóm!");
      navigation.goBack();
    } catch (error) {
      console.error("Lỗi thêm thành viên:", error);
      Alert.alert("Lỗi", error.response?.data?.message || "Không thể thêm thành viên.");
    }
  };

  const renderUserItem = ({ item }) => (
    <TouchableOpacity
      style={{
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        borderBottomWidth: 1,
        borderColor: "#f0f0f0",
      }}
      onPress={() => toggleSelectUser(item._id)}
    >
      <Image
        source={{ uri: item.avatar || "https://via.placeholder.com/50" }}
        style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }}
      />
      <Text style={{ flex: 1, fontSize: 16, color: "#222" }}>{item.name}</Text>
      {selectedUsers.includes(item._id) && (
        <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ padding: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 12 }}>
          Chọn thành viên để thêm
        </Text>
        <FlatList
          data={users}
          keyExtractor={(item) => item._id}
          renderItem={renderUserItem}
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: 50 }}>
              <Text style={{ color: "#666", fontSize: 16, marginBottom: 10 }}>
                Không có bạn bè nào để thêm vào nhóm.
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: "#007AFF",
                  padding: 10,
                  borderRadius: 8,
                }}
                onPress={() => navigation.navigate("AddFriend")}
              >
                <Text style={{ color: "#fff", fontSize: 16 }}>Kết bạn ngay</Text>
              </TouchableOpacity>
            </View>
          }
        />
        <TouchableOpacity
          style={{
            backgroundColor: "#007AFF",
            padding: 12,
            borderRadius: 8,
            alignItems: "center",
            marginTop: 12,
          }}
          onPress={addMembers}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
            Thêm thành viên
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}