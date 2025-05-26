import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Modal,
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
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedNewCreator, setSelectedNewCreator] = useState(null);
  const navigation = useNavigation();
  const routeInfo = useRoute();

  useFocusEffect(
    useCallback(() => {
      fetchGroupDetails();
    }, [chatId])
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
      setMembers(chat.participants);
      setAdmins(chat.admins);
      setCreatorId(chat.createdBy);
      setGroupAvatar(chat.avatar || "https://via.placeholder.com/50");
    } catch (error) {
      console.error("Lỗi lấy chi tiết nhóm:", error);
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
      Alert.alert("Thành công", "Đã xóa quyền phó nhóm.");
    } catch (error) {
      console.error("Lỗi xóa quyền phó nhóm:", error);
      Alert.alert("Lỗi", error.response?.data?.message || "Không thể xóa quyền phó nhóm.");
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

  const transferOwnership = async () => {
    if (!selectedNewCreator) {
      Alert.alert("Lỗi", "Vui lòng chọn một thành viên để chuyển quyền trưởng nhóm.");
      return;
    }

    const newCreatorName = members.find((member) => member._id === selectedNewCreator)?.name || "thành viên";

    Alert.alert(
      "Xác nhận chuyển quyền",
      `Bạn có chắc chắn muốn chuyển quyền trưởng nhóm cho ${newCreatorName}?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xác nhận",
          style: "default",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("token");
              if (!token) throw new Error("Không tìm thấy token");
              const parsedToken = JSON.parse(token);

              await axios.post(
                `${BASE_URL}/api/group/transfer-ownership`,
                { chatId, newCreatorId: selectedNewCreator },
                {
                  headers: { Authorization: `Bearer ${parsedToken.token}` },
                }
              );

              Alert.alert("Thành công", "Đã chuyển quyền trưởng nhóm thành công.");
              setIsModalVisible(false);
              setSelectedNewCreator(null);
              fetchGroupDetails();
              navigation.navigate("ChatScreen", {
                chatId,
                groupName,
                currentUserId,
                avatar: groupAvatar,
                isGroupChat: true,
              });
            } catch (error) {
              console.error("Lỗi chuyển quyền trưởng nhóm:", error);
              Alert.alert("Lỗi", error.response?.data?.message || "Không thể chuyển quyền trưởng nhóm.");
            }
          },
        },
      ]
    );
  };

  const leaveGroup = async () => {
    if (creatorId === currentUserId) {
      setIsModalVisible(true);
    } else {
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
    }
  };

  const renderMemberItem = ({ item }) => {
    const isAdmin = admins.includes(item._id);
    const isCreator = item._id === creatorId;
    const isCurrentUserAdminOrCreator = admins.includes(currentUserId) || creatorId === currentUserId;
    const isCurrentUserCreator = creatorId === currentUserId;

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
            {isCreator ? "Trưởng nhóm" : isAdmin ? "Phó nhóm" : "Thành viên"}
          </Text>
        </View>
        {isCurrentUserAdminOrCreator && !isCreator && item._id !== currentUserId && (
          <View style={{ flexDirection: "row" }}>
            {isCurrentUserCreator && !isAdmin && (
              <TouchableOpacity
                onPress={() => assignAdmin(item._id)}
                style={{ marginRight: 8 }}
              >
                <Ionicons name="shield-checkmark-outline" size={24} color="#007AFF" />
              </TouchableOpacity>
            )}
            {isCurrentUserCreator && isAdmin && (
              <TouchableOpacity
                onPress={() => removeAdmin(item._id)}
                style={{ marginRight: 8 }}
              >
                <Ionicons name="shield-outline" size={24} color="#FF3B30" />
              </TouchableOpacity>
            )}
            {(!isAdmin || isCurrentUserCreator) && (
              <TouchableOpacity onPress={() => removeMember(item._id)}>
                <Ionicons name="trash-outline" size={24} color="#FF3B30" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderMemberSelectionItem = ({ item }) => {
    if (item._id === currentUserId) return null; // Không hiển thị chính mình
    return (
      <TouchableOpacity
        onPress={() => setSelectedNewCreator(item._id)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 12,
          borderBottomWidth: 1,
          borderColor: "#f0f0f0",
          backgroundColor: selectedNewCreator === item._id ? "#e0f0ff" : "#fff",
        }}
      >
        <Image
          source={{ uri: item.avatar || "https://via.placeholder.com/50" }}
          style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }}
        />
        <Text style={{ fontSize: 16, color: "#222" }}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ padding: 12 }}>
        <View style={{ alignItems: "center", marginBottom: 12 }}>
          <TouchableOpacity
            onPress={pickImage}
            disabled={!(admins.includes(currentUserId) || creatorId === currentUserId)}
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
        {creatorId === currentUserId && (
          <TouchableOpacity
            style={{
              backgroundColor: "#007AFF",
              padding: 12,
              borderRadius: 8,
              alignItems: "center",
              marginBottom: 12,
            }}
            onPress={() => setIsModalVisible(true)}
          >
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
              Chuyển quyền trưởng nhóm
            </Text>
          </TouchableOpacity>
        )}
        <FlatList
          data={members}
          keyExtractor={(item) => item._id}
          renderItem={renderMemberItem}
        />
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
        {creatorId === currentUserId && (
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
        )}
      </View>

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setIsModalVisible(false);
          setSelectedNewCreator(null);
        }}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              maxHeight: "80%",
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
              Chọn trưởng nhóm mới
            </Text>
            <FlatList
              data={members}
              keyExtractor={(item) => item._id}
              renderItem={renderMemberSelectionItem}
            />
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 20 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: "#ddd",
                  padding: 12,
                  borderRadius: 8,
                  flex: 1,
                  marginRight: 10,
                  alignItems: "center",
                }}
                onPress={() => {
                  setIsModalVisible(false);
                  setSelectedNewCreator(null);
                }}
              >
                <Text style={{ color: "#333", fontSize: 16, fontWeight: "600" }}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  backgroundColor: "#007AFF",
                  padding: 12,
                  borderRadius: 8,
                  flex: 1,
                  alignItems: "center",
                  opacity: selectedNewCreator ? 1 : 0.5,
                }}
                onPress={transferOwnership}
                disabled={!selectedNewCreator}
              >
                <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
                  Chuyển quyền
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}