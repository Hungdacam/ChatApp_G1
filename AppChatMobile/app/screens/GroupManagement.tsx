import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { BASE_URL } from "../config/config";
import { useNavigation, useFocusEffect, useRoute } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";

export default function GroupManagement({ route }) {
  const { chatId, groupName, currentUserId } = route.params;
  const [members, setMembers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [creatorId, setCreatorId] = useState(null);
  const [groupAvatar, setGroupAvatar] = useState("https://via.placeholder.com/50");
  const [uploading, setUploading] = useState(false);
  const navigation = useNavigation();
  const routeInfo = useRoute();

  useFocusEffect(
    React.useCallback(() => {
      if (routeInfo.params?.refreshGroupManagement) {
        fetchGroupDetails();
        navigation.setParams({ refreshGroupManagement: undefined });
      } else {
        fetchGroupDetails();
      }
    }, [routeInfo.params?.refreshGroupManagement])
  );

  const fetchGroupDetails = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Không tìm thấy token");
      const parsedToken = JSON.parse(token);

      const response = await axios.get(`${BASE_URL}/api/chat/${chatId}`, {
        headers: { Authorization: `Bearer ${parsedToken.token}` },
      });

      const chat = response.data;
      console.log("Group details fetched:", chat);
      console.log("Avatar URL:", chat.avatar);
      setMembers(chat.participants);
      setAdmins(chat.admins);
      setCreatorId(chat.createdBy);
      setGroupAvatar(chat.avatar || "https://via.placeholder.com/50");
    } catch (error) {
      console.error("Lỗi lấy chi tiết nhóm:", error);
      if (error.response) {
        console.error("Response error data:", error.response.data);
      }
      Alert.alert("Lỗi", "Không thể tải chi tiết nhóm.");
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
        updateGroupAvatar(file.uri);
      }
    } catch (error) {
      console.error("Lỗi chọn ảnh:", error);
      Alert.alert("Lỗi", "Không thể chọn ảnh.");
    }
  };

  const updateGroupAvatar = async (uri) => {
    try {
      setUploading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Không tìm thấy token");
      const parsedToken = JSON.parse(token);

      const formData = new FormData();
      formData.append("chatId", chatId);
      formData.append("avatar", {
        uri,
        type: "image/jpeg",
        name: `group-avatar-${Date.now()}.jpg`,
      });

      const response = await axios.post(`${BASE_URL}/api/group/update-avatar`, formData, {
        headers: {
          Authorization: `Bearer ${parsedToken.token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setGroupAvatar(response.data.avatar);
      Alert.alert("Thành công", "Đã cập nhật avatar nhóm.");
    } catch (error) {
      console.error("Lỗi cập nhật avatar nhóm:", error);
      Alert.alert("Lỗi", error.response?.data?.message || "Không thể cập nhật avatar nhóm.");
    } finally {
      setUploading(false);
    }
  };

  const addMember = async (userId) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Không tìm thấy token");
      const parsedToken = JSON.parse(token);

      await axios.post(
        `${BASE_URL}/api/group/add-member`,
        { chatId, userId },
        {
          headers: { Authorization: `Bearer ${parsedToken.token}` },
        }
      );

      fetchGroupDetails();
      Alert.alert("Thành công", "Đã thêm thành viên vào nhóm.");
    } catch (error) {
      console.error("Lỗi thêm thành viên:", error);
      Alert.alert("Lỗi", error.response?.data?.message || "Không thể thêm thành viên.");
    }
  };

  const removeMember = async (userId) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Không tìm thấy token");
      const parsedToken = JSON.parse(token);

      await axios.post(
        `${BASE_URL}/api/group/remove-member`,
        { chatId, userId },
        {
          headers: { Authorization: `Bearer ${parsedToken.token}` },
        }
      );

      fetchGroupDetails();
      Alert.alert("Thành công", "Đã xóa thành viên khỏi nhóm.");
    } catch (error) {
      console.error("Lỗi xóa thành viên:", error);
      Alert.alert("Lỗi", error.response?.data?.message || "Không thể xóa thành viên.");
    }
  };

  const assignAdmin = async (userId) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Không tìm thấy token");
      const parsedToken = JSON.parse(token);

      await axios.post(
        `${BASE_URL}/api/group/assign-admin`,
        { chatId, userId },
        {
          headers: { Authorization: `Bearer ${parsedToken.token}` },
        }
      );

      fetchGroupDetails();
      Alert.alert("Thành công", "Đã gán quyền admin.");
    } catch (error) {
      console.error("Lỗi gán quyền admin:", error);
      Alert.alert("Lỗi", error.response?.data?.message || "Không thể gán quyền admin.");
    }
  };

  const removeAdmin = async (userId) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Không tìm thấy token");
      const parsedToken = JSON.parse(token);

      await axios.post(
        `${BASE_URL}/api/group/remove-admin`,
        { chatId, userId },
        {
          headers: { Authorization: `Bearer ${parsedToken.token}` },
        }
      );

      fetchGroupDetails();
      Alert.alert("Thành công", "Đã xóa quyền admin.");
    } catch (error) {
      console.error("Lỗi xóa quyền admin:", error);
      Alert.alert("Lỗi", error.response?.data?.message || "Không thể xóa quyền admin.");
    }
  };

  const dissolveGroup = async () => {
    Alert.alert(
      "Giải tán nhóm",
      "Bạn có chắc chắn muốn giải tán nhóm này? Hành động này không thể hoàn tác.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Giải tán",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("token");
              if (!token) throw new Error("Không tìm thấy token");
              const parsedToken = JSON.parse(token);

              await axios.post(
                `${BASE_URL}/api/group/dissolve`,
                { chatId },
                {
                  headers: { Authorization: `Bearer ${parsedToken.token}` },
                }
              );

              Alert.alert("Thành công", "Nhóm đã được giải tán.");
              navigation.navigate("HomeTabs");
            } catch (error) {
              console.error("Lỗi giải tán nhóm:", error);
              Alert.alert("Lỗi", error.response?.data?.message || "Không thể giải tán nhóm.");
            }
          },
        },
      ]
    );
  };

  const leaveGroup = async () => {
    Alert.alert(
      "Rời nhóm",
      "Bạn có chắc chắn muốn rời khỏi nhóm này?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Rời nhóm",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("token");
              if (!token) throw new Error("Không tìm thấy token");
              const parsedToken = JSON.parse(token);

              await axios.post(
                `${BASE_URL}/api/group/leave`,
                { chatId },
                {
                  headers: { Authorization: `Bearer ${parsedToken.token}` },
                }
              );

              Alert.alert("Thành công", "Bạn đã rời khỏi nhóm.");
              navigation.navigate("HomeTabs", { screen: "Inbox" });
            } catch (error) {
              console.error("Lỗi rời nhóm:", error);
              Alert.alert("Lỗi", error.response?.data?.message || "Không thể rời nhóm.");
            }
          },
        },
      ]
    );
  };

  const renderMemberItem = ({ item }) => {
    const isAdmin = admins.includes(item._id);
    const isCreator = item._id === creatorId;
    const isCurrentUserAdmin = admins.includes(currentUserId);

    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 12,
          borderBottomWidth: 1,
          borderColor: "#f0f0f0",
        }}
      >
        <Image
          source={{ uri: item.avatar || "https://via.placeholder.com/50" }}
          style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }}
        />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, color: "#222" }}>{item.name}</Text>
          <Text style={{ fontSize: 14, color: "#666" }}>
            {isCreator ? "Người tạo" : isAdmin ? "Admin" : "Thành viên"}
          </Text>
        </View>
        {isCurrentUserAdmin && !isCreator && item._id !== currentUserId && (
          <View style={{ flexDirection: "row" }}>
            {!isAdmin && (
              <TouchableOpacity
                onPress={() => assignAdmin(item._id)}
                style={{ marginRight: 8 }}
              >
                <Ionicons name="shield-checkmark-outline" size={24} color="#007AFF" />
              </TouchableOpacity>
            )}
            {isAdmin && (
              <TouchableOpacity
                onPress={() => removeAdmin(item._id)}
                style={{ marginRight: 8 }}
              >
                <Ionicons name="shield-outline" size={24} color="#FF3B30" />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => removeMember(item._id)}>
              <Ionicons name="trash-outline" size={24} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ padding: 12 }}>
        <View style={{ alignItems: "center", marginBottom: 12 }}>
          <TouchableOpacity
            onPress={pickImage}
            disabled={!admins.includes(currentUserId) || uploading}
            style={{ opacity: uploading ? 0.5 : 1 }}
          >
            <Image
              source={{ uri: groupAvatar }}
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                borderWidth: 1,
                borderColor: "#ddd",
                marginBottom: 8,
              }}
            />
            {uploading && (
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: "rgba(0,0,0,0.3)",
                  borderRadius: 50,
                }}
              >
                <ActivityIndicator color="#fff" />
              </View>
            )}
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: "bold" }}>{groupName}</Text>
        </View>
        <TouchableOpacity
          style={{
            backgroundColor: "#007AFF",
            padding: 12,
            borderRadius: 8,
            alignItems: "center",
            marginBottom: 12,
          }}
          onPress={() => navigation.navigate("AddGroupMember", { chatId })}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
            Thêm thành viên
          </Text>
        </TouchableOpacity>
        <FlatList
          data={members}
          keyExtractor={(item) => item._id}
          renderItem={renderMemberItem}
        />
        {creatorId === currentUserId ? (
          <TouchableOpacity
            style={{
              backgroundColor: "#FF3B30",
              padding: 12,
              borderRadius: 8,
              alignItems: "center",
              marginTop: 12,
            }}
            onPress={dissolveGroup}
          >
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
              Giải tán nhóm
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={{
              backgroundColor: "#FF3B30",
              padding: 12,
              borderRadius: 8,
              alignItems: "center",
              marginTop: 12,
            }}
            onPress={leaveGroup}
          >
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
              Rời nhóm
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}