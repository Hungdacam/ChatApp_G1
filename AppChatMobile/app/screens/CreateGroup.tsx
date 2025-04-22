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
  ActivityIndicator
  ,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { BASE_URL } from "../config/config";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";

export default function CreateGroup() {
  const [groupName, setGroupName] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [avatar, setAvatar] = useState(null);
  const [uploading, setUploading] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Không tìm thấy token");
      const parsedToken = JSON.parse(token);

      const response = await axios.get(`${BASE_URL}/api/friends/list`, {
        headers: { Authorization: `Bearer ${parsedToken.token}` },
      });

      console.log("Friends fetched:", response.data);
      setUsers(response.data);
    } catch (error) {
      console.error("Lỗi lấy danh sách bạn bè:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách bạn bè.");
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled) {
        const file = result.assets[0];
        if (file.fileSize && file.fileSize > 2 * 1024 * 1024) {
          Alert.alert("Lỗi", "Ảnh phải nhỏ hơn 2MB.");
          return;
        }
        setAvatar(file.uri);
      }
    } catch (error) {
      console.error("Lỗi chọn ảnh:", error);
      Alert.alert("Lỗi", "Không thể chọn ảnh.");
    }
  };

  const removeAvatar = () => {
    setAvatar(null);
  };

  const toggleSelectUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const createGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên nhóm.");
      return;
    }
    if (selectedUsers.length < 2) {
      Alert.alert("Lỗi", "Vui lòng chọn ít nhất 2 thành viên.");
      return;
    }

    try {
      setUploading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Không tìm thấy token");
      const parsedToken = JSON.parse(token);

      const formData = new FormData();
      formData.append("groupName", groupName);
      formData.append("memberIds", JSON.stringify(selectedUsers));

      if (avatar) {
        formData.append("avatar", {
          uri: avatar,
          type: "image/jpeg",
          name: `group-avatar-${Date.now()}.jpg`,
        });
      }

      console.log("Creating group with payload:", {
        groupName,
        memberIds: selectedUsers,
        avatar: avatar ? "Image selected" : "No image",
      });

      const response = await axios.post(`${BASE_URL}/api/group/create`, formData, {
        headers: {
          Authorization: `Bearer ${parsedToken.token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      Alert.alert("Thành công", "Đã tạo nhóm thành công!");
      navigation.navigate("ChatScreen", {
        chatId: response.data.chatId,
        name: groupName,
        avatar: response.data.avatar || "https://via.placeholder.com/50",
        isGroupChat: true,
        refreshGroupManagement: true
      });
    } catch (error) {
      console.error("Lỗi tạo nhóm:", error);
      Alert.alert("Lỗi", error.response?.data?.message || "Không thể tạo nhóm.");
    } finally {
      setUploading(false);
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
    <SafeAreaView style={{ flex:1, backgroundColor: "#fff" }}>
      <View style={{ padding: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <View style={{ position: "relative", marginRight: 12 }}>
            <TouchableOpacity onPress={pickImage}>
              <Image
                source={{ uri: avatar || "https://via.placeholder.com/50" }}
                style={{ width: 50, height: 50, borderRadius: 25, borderWidth: 1, borderColor: "#ddd" }}
              />
            </TouchableOpacity>
            {avatar && (
              <TouchableOpacity
                onPress={removeAvatar}
                style={{ position: "absolute", top: -5, right: -5 }}
              >
                <Ionicons name="close-circle" size={20} color="#FF3B30" />
              </TouchableOpacity>
            )}
          </View>
          <TextInput
            placeholder="Tên nhóm"
            value={groupName}
            onChangeText={setGroupName}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: "#ddd",
              borderRadius: 8,
              padding: 10,
              fontSize: 16,
            }}
          />
        </View>
        <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 12 }}>
          Chọn thành viên
        </Text>
        <FlatList
          data={users}
          keyExtractor={(item) => item._id}
          renderItem={renderUserItem}
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: 50 }}>
              <Text style={{ color: "#666", fontSize: 16, marginBottom: 10 }}>
                Bạn chưa có bạn bè nào để thêm.
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
            opacity: uploading ? 0.5 : 1,
          }}
          onPress={createGroup}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
              Tạo nhóm
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}