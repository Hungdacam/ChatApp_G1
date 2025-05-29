import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
  TextInput,
  Modal,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, { useEffect, useState, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { BASE_URL } from "../config/config";
import { useNavigation } from "@react-navigation/native";
import * as Contacts from "expo-contacts";
import * as DocumentPicker from "expo-document-picker";
import styles from "../style/ContactStyle";
import socket from "../config/socket";
export default function Contact() {
  const [requests, setRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selectedTab, setSelectedTab] = useState("requests");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualPhone, setManualPhone] = useState("");
  const [manualName, setManualName] = useState("");
  const navigation = useNavigation();

  const syncContacts = async () => {
    try {
      setIsLoadingContacts(true);
      let phoneNumbers = [];

      if (Platform.OS !== "web") {
        // Mobile: Lấy danh bạ từ expo-contacts
        const { status } = await Contacts.requestPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Lỗi", "Bạn cần cấp quyền truy cập danh bạ.");
          return;
        }

        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
        });

        if (!data.length) {
          Alert.alert("Thông báo", "Không tìm thấy số điện thoại trong danh bạ.");
          return;
        }

        data.forEach((contact) => {
          if (contact.phoneNumbers) {
            contact.phoneNumbers.forEach((phone) => {
              if (phone.number) {
                const normalizedPhone = normalizePhoneNumber(phone.number);
                if (normalizedPhone) {
                  phoneNumbers.push({
                    name: contact.name || "Không có tên",
                    phone: normalizedPhone,
                  });
                }
              }
            });
          }
        });
      } else {
        // Web: Lấy danh bạ từ server
        const token = await AsyncStorage.getItem("token");
        if (!token) throw new Error("Không tìm thấy token");
        const parsedToken = JSON.parse(token);

        const response = await axios.get(`${BASE_URL}/api/contacts`, {
          headers: { Authorization: `Bearer ${parsedToken.token}` },
        });

        if (response.data.contacts.length === 0) {
          setShowManualInput(true);
          return;
        }

        phoneNumbers = response.data.contacts.map((c) => ({
          name: c.name,
          phone: c.phone,
        }));
      }

      if (phoneNumbers.length === 0 && Platform.OS !== "web") {
        Alert.alert("Thông báo", "Không có số điện thoại hợp lệ.");
        return;
      }

      // Đồng bộ danh bạ lên server (mobile only)
      if (Platform.OS !== "web" && phoneNumbers.length > 0) {
        const token = await AsyncStorage.getItem("token");
        if (!token) throw new Error("Không tìm thấy token");
        const parsedToken = JSON.parse(token);

        await axios.post(
          `${BASE_URL}/api/contacts/sync`,
          { contacts: phoneNumbers },
          {
            headers: { Authorization: `Bearer ${parsedToken.token}` },
          }
        );
      }

      // Gửi danh sách số lên /api/friends/check-contacts (nếu có số)
      if (phoneNumbers.length > 0) {
        const token = await AsyncStorage.getItem("token");
        if (!token) throw new Error("Không tìm thấy token");
        const parsedToken = JSON.parse(token);

        const response = await axios.post(
          `${BASE_URL}/api/friends/check-contacts`,
          { phoneNumbers: phoneNumbers.map((item) => item.phone) },
          {
            headers: { Authorization: `Bearer ${parsedToken.token}` },
          }
        );

        const registeredContacts = response.data.registeredUsers.map((user) => {
          const contact = phoneNumbers.find((c) => c.phone === user.phone);
          return {
            ...user,
            contactName: contact ? contact.name : user.name,
          };
        });

        setContacts(registeredContacts);
        Alert.alert("Thành công", `Đã tìm thấy ${registeredContacts.length} số điện thoại đã đăng ký.`);
      }
    } catch (error) {
      console.error("Lỗi đồng bộ danh bạ:", error);
      Alert.alert("Lỗi", error.response?.data?.message || "Không thể đồng bộ danh bạ.");
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const handleManualInput = async () => {
    try {
      const normalizedPhone = normalizePhoneNumber(manualPhone);
      if (!normalizedPhone) {
        Alert.alert("Lỗi", "Số điện thoại không hợp lệ. Vui lòng nhập số Việt Nam (VD: 0972491073).");
        return;
      }

      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Không tìm thấy token");
      const parsedToken = JSON.parse(token);

      await axios.post(
        `${BASE_URL}/api/contacts/sync`,
        { contacts: [{ phone: normalizedPhone, name: manualName || "Không có tên" }] },
        {
          headers: { Authorization: `Bearer ${parsedToken.token}` },
        }
      );

      setShowManualInput(false);
      setManualPhone("");
      setManualName("");
      syncContacts();
    } catch (error) {
      console.error("Lỗi thêm liên hệ:", error);
      Alert.alert("Lỗi", error.response?.data?.message || "Không thể thêm liên hệ.");
    }
  };

  const handleCsvUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "text/csv" });
      if (result.type !== "success") return;

      const csvText = await (await fetch(result.uri)).text();
      const lines = csvText.split("\n").slice(1); // Bỏ header
      const contacts = lines
        .map((line) => {
          const [name, phone] = line.split(",");
          const normalizedPhone = normalizePhoneNumber(phone);
          return normalizedPhone ? { name: name || "Không có tên", phone: normalizedPhone } : null;
        })
        .filter(Boolean);

      if (contacts.length === 0) {
        Alert.alert("Lỗi", "Không có số điện thoại hợp lệ trong file CSV.");
        return;
      }

      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Không tìm thấy token");
      const parsedToken = JSON.parse(token);

      await axios.post(
        `${BASE_URL}/api/contacts/sync`,
        { contacts },
        {
          headers: { Authorization: `Bearer ${parsedToken.token}` },
        }
      );

      syncContacts();
    } catch (error) {
      console.error("Lỗi upload CSV:", error);
      Alert.alert("Lỗi", error.response?.data?.message || "Không thể upload file CSV.");
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (selectedTab === "requests") {
        fetchFriendRequests();
      } else if (selectedTab === "friends") {
        fetchFriends();
      } else if (selectedTab === "contacts") {
        syncContacts();
      }
    }, [selectedTab])
  );

useEffect(() => {
  const handler = () => {
    if (selectedTab === "requests") {
      Alert.alert("Thông báo", "Một lời mời kết bạn đã bị huỷ.");
      fetchFriendRequests();
    }
  };
  socket.on("friend-request-canceled", handler);
  return () => {
    socket.off("friend-request-canceled", handler);
  };
}, [selectedTab]);

useEffect(() => {
  const handler = () => {
    if (selectedTab === "requests") {
      fetchFriendRequests();
    }
  };
  socket.on("new_friend_request", handler);
  return () => {
    socket.off("new_friend_request", handler);
  };
}, [selectedTab]);

useEffect(() => {
  const handler = (data) => {
    // Cập nhật lại trạng thái bạn bè trong danh bạ
    setContacts((prev) =>
      prev.map((contact) =>
        contact._id === data.receiver._id
          ? { ...contact, friendStatus: "friends", isSender: false }
          : contact
      )
    );
    fetchFriends(); // cập nhật lại danh sách bạn bè
    if (selectedTab === "requests") fetchFriendRequests();
    //Alert.alert("Thông báo", "Lời mời kết bạn đã được chấp nhận.");
  };
  socket.on("friend_request_accepted", handler);
  return () => {
    socket.off("friend_request_accepted", handler);
  };
}, [selectedTab]);

  const fetchFriendRequests = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Không tìm thấy token");
      const parsedToken = JSON.parse(token);

      const response = await axios.get(`${BASE_URL}/api/friends/requests`, {
        headers: {
          Authorization: `Bearer ${parsedToken.token}`,
        },
      });

      console.log("Friend requests:", response.data.requests);
      setRequests(response.data.requests);
      fetchFriends();
    } catch (error) {
      console.error("Lỗi lấy lời mời:", error);
      Alert.alert("Lỗi", "Không thể lấy danh sách lời mời.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFriends = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Không tìm thấy token");
      const parsedToken = JSON.parse(token);

      const response = await axios.get(`${BASE_URL}/api/friends/list`, {
        headers: {
          Authorization: `Bearer ${parsedToken.token}`,
        },
      });

      console.log("Friends:", response.data);
      setFriends(response.data);
    } catch (error) {
      console.error("Lỗi lấy bạn bè:", error);
      Alert.alert("Lỗi", "Không thể lấy danh sách bạn bè.");
    } finally {
      setIsLoading(false);
    }
  };

  const acceptRequest = async (senderId) => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Không tìm thấy token");
      const parsedToken = JSON.parse(token);

      await axios.post(
        `${BASE_URL}/api/friends/accept-request`,
        { senderId },
        {
          headers: {
            Authorization: `Bearer ${parsedToken.token}`,
          },
        }
      );

      Alert.alert("Thành công", "Đã chấp nhận lời mời.");
      fetchFriendRequests();
      fetchFriends();
    } catch (error) {
      console.error("Lỗi chấp nhận:", error.response?.data);
      Alert.alert(
        "Lỗi",
        error.response?.data?.message || "Không thể chấp nhận lời mời."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const rejectRequest = async (senderId) => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Không tìm thấy token");
      const parsedToken = JSON.parse(token);

      await axios.post(
        `${BASE_URL}/api/friends/reject-request`,
        { senderId },
        {
          headers: {
            Authorization: `Bearer ${parsedToken.token}`,
          },
        }
      );

      Alert.alert("Thành công", "Đã từ chối lời mời.");
      fetchFriendRequests();
    } catch (error) {
      console.error("Lỗi từ chối:", error.response?.data);
      Alert.alert(
        "Lỗi",
        error.response?.data?.message || "Không thể từ chối lời mời."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const sendFriendRequest = async (receiverId) => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Không tìm thấy token");
      const parsedToken = JSON.parse(token);

      await axios.post(
        `${BASE_URL}/api/friends/send-request`,
        { receiverId },
        {
          headers: {
            Authorization: `Bearer ${parsedToken.token}`,
          },
        }
      );

      Alert.alert("Thành công", "Đã gửi lời mời kết bạn.");
      setContacts((prev) =>
        prev.map((contact) =>
          contact._id === receiverId
            ? { ...contact, friendStatus: "pending", isSender: true }
            : contact
        )
      );
    } catch (error) {
      console.error("Lỗi gửi lời mời kết bạn:", error.response?.data);
      Alert.alert(
        "Lỗi",
        error.response?.data?.message || "Không thể gửi lời mời kết bạn."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const cancelFriendRequest = async (receiverId) => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Không tìm thấy token");
      const parsedToken = JSON.parse(token);

      await axios.post(
        `${BASE_URL}/api/friends/cancel-request`,
        { receiverId },
        {
          headers: {
            Authorization: `Bearer ${parsedToken.token}`,
          },
        }
      );

      Alert.alert("Thành công", "Đã huỷ lời mời kết bạn.");
      setContacts((prev) =>
        prev.map((contact) =>
          contact._id === receiverId
            ? { ...contact, friendStatus: "none", isSender: false }
            : contact
        )
      );
    } catch (error) {
      console.error("Lỗi huỷ lời mời kết bạn:", error.response?.data);
      Alert.alert(
        "Lỗi",
        error.response?.data?.message || "Không thể huỷ lời mời kết bạn."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const unfriendUser = async (friendId) => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Không tìm thấy token");
      const parsedToken = JSON.parse(token);

      await axios.post(
        `${BASE_URL}/api/friends/unfriend`,
        { friendId },
        {
          headers: { Authorization: `Bearer ${parsedToken.token}` },
        }
      );

      Alert.alert("Thành công", "Đã huỷ kết bạn.");
      setContacts((prev) =>
        prev.map((contact) =>
          contact._id === friendId
            ? { ...contact, friendStatus: "none", isSender: false }
            : contact
        )
      );
      fetchFriends(); // cập nhật lại danh sách bạn bè
    } catch (error) {
      console.error("Lỗi huỷ kết bạn:", error.response?.data);
      Alert.alert(
        "Lỗi",
        error.response?.data?.message || "Không thể huỷ kết bạn."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const normalizePhoneNumber = (phone) => {
    let normalized = phone.replace(/[^0-9+]/g, "").trim();
    if (normalized.startsWith("0")) {
      normalized = "+84" + normalized.slice(1);
    } else if (!normalized.startsWith("+84")) {
      return null;
    }
    if (normalized.length !== 12) {
      return null;
    }
    return normalized;
  };

  const renderRequestItem = ({ item }) => (
    <View style={styles.requestItem}>
      <View style={styles.row}>
        <Image
          source={{
            uri: item.userId1.avatar || "https://via.placeholder.com/50",
          }}
          style={styles.avatar}
        />
        <View style={styles.infoContainer}>
          <Text style={styles.senderName}>{item.userId1.name}</Text>
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: "#28A745" }]}
              onPress={() => acceptRequest(item.userId1._id)}
            >
              <Text style={styles.buttonText}>Chấp nhận</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: "#DC3545" }]}
              onPress={() => rejectRequest(item.userId1._id)}
            >
              <Text style={styles.buttonText}>Từ chối</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  const formatPhone = (phone) => {
    if (phone.startsWith("+84")) {
      return "0" + phone.slice(3);
    }
    return phone;
  };

  const renderFriendItem = ({ item }) => (
    <TouchableOpacity
      style={styles.requestItem}
      onPress={() => {
        navigation.navigate("UserProfile", {
          user: {
            id: item._id,
            name: item.name,
            phone: item.phone,
            avatar: item.avatar,
          },
        });
      }}
    >
      <View style={styles.row}>
        <Image
          source={{ uri: item.avatar || "https://via.placeholder.com/50" }}
          style={styles.avatar}
        />
        <View style={styles.infoContainer}>
          <Text style={styles.senderName}>{item.name}</Text>
          <Text>{formatPhone(item.phone)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderContactItem = ({ item }) => (
    <View style={styles.requestItem}>
      <View style={styles.row}>
        <Image
          source={{ uri: item.avatar || "https://via.placeholder.com/50" }}
          style={styles.avatar}
        />
        <View style={styles.infoContainer}>
          <Text style={styles.senderName}>{item.contactName}</Text>
          <Text>{formatPhone(item.phone)}</Text>
          <View style={{ flexDirection: "row", marginTop: 6 }}>
            {/* Nút trạng thái bạn bè/kết bạn/huỷ lời mời */}
            {item.friendStatus === "friends" ? (
              <>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: "#aaa", marginRight: 8 }]}
                  disabled
                >
                  <Text style={styles.buttonText}>Bạn bè</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: "#DC3545", marginRight: 8 }]}
                  onPress={() => unfriendUser(item._id)}
                >
                  <Text style={styles.buttonText}>Huỷ kết bạn</Text>
                </TouchableOpacity>
              </>
            ) : item.friendStatus === "pending" && item.isSender ? (
              <TouchableOpacity
                style={[styles.button, { backgroundColor: "#DC3545", marginRight: 8 }]}
                onPress={() => cancelFriendRequest(item._id)}
              >
                <Text style={styles.buttonText}>Huỷ lời mời</Text>
              </TouchableOpacity>
            ) : item.friendStatus === "pending" && !item.isSender ? (
              <TouchableOpacity style={[styles.button, { backgroundColor: "#aaa", marginRight: 8 }]} disabled>
                <Text style={styles.buttonText}>Đã được mời</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.button, { backgroundColor: "#007BFF", marginRight: 8 }]}
                onPress={() => sendFriendRequest(item._id)}
              >
                <Text style={styles.buttonText}>Kết bạn</Text>
              </TouchableOpacity>
            )}

            {/* Nút xem trang cá nhân */}
            <TouchableOpacity
              style={[styles.button, { backgroundColor: "#1976d2" }]}
              onPress={() =>
                navigation.navigate("UserProfile", {
                  user: {
                    id: item._id,
                    name: item.name || item.contactName,
                    phone: item.phone,
                    avatar: item.avatar,
                  },
                })
              }
            >
              <Text style={styles.buttonText}>Xem trang cá nhân</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {Platform.OS === "web" && (
          <TouchableOpacity
            style={styles.loadContactsButton}
            onPress={handleCsvUpload}
            disabled={isLoadingContacts}
          >
            <Text style={styles.loadContactsText}>Upload CSV</Text>
          </TouchableOpacity>
        )}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              selectedTab === "requests" && styles.activeTab,
            ]}
            onPress={() => setSelectedTab("requests")}
          >
            <Text style={styles.tabText}>
              Lời mời {requests.length > 0 ? `(${requests.length})` : ""}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              selectedTab === "friends" && styles.activeTab,
            ]}
            onPress={() => setSelectedTab("friends")}
          >
            <Text style={styles.tabText}>
              Bạn bè {friends.length > 0 ? `(${friends.length})` : ""}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              selectedTab === "contacts" && styles.activeTab,
            ]}
            onPress={() => setSelectedTab("contacts")}
          >
            <Text style={styles.tabText}>
              Danh bạ {contacts.length > 0 ? `(${contacts.length})` : ""}
            </Text>
          </TouchableOpacity>
        </View>

        {isLoading || isLoadingContacts ? (
          <Text style={styles.noRequests}>Đang tải...</Text>
        ) : (
          <FlatList
            data={
              selectedTab === "requests"
                ? requests
                : selectedTab === "friends"
                ? friends
                : contacts
            }
            keyExtractor={(item) => item._id}
            renderItem={
              selectedTab === "requests"
                ? renderRequestItem
                : selectedTab === "friends"
                ? renderFriendItem
                : renderContactItem
            }
            ListEmptyComponent={
              <Text style={styles.noRequests}>
                {selectedTab === "requests"
                  ? "Không có lời mời nào."
                  : selectedTab === "friends"
                  ? "Bạn chưa có bạn bè nào."
                  : "Chưa có danh bạ hoặc không có số đã đăng ký."}
              </Text>
            }
          />
        )}

        <Modal visible={showManualInput} transparent animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Thêm liên hệ thủ công</Text>
              <TextInput
                style={styles.input}
                placeholder="Số điện thoại (VD: 0972491073)"
                keyboardType="phone-pad"
                value={manualPhone}
                onChangeText={setManualPhone}
              />
              <TextInput
                style={styles.input}
                placeholder="Tên liên hệ"
                value={manualName}
                onChangeText={setManualName}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: "#DC3545" }]}
                  onPress={() => setShowManualInput(false)}
                >
                  <Text style={styles.buttonText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: "#28A745" }]}
                  onPress={handleManualInput}
                >
                  <Text style={styles.buttonText}>Thêm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

