import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, { useEffect, useState, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { BASE_URL } from "../config/config";
import { useNavigation } from "@react-navigation/native";



export default function Contact() {
  const [requests, setRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [selectedTab, setSelectedTab] = useState("requests");
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      if (selectedTab === "requests") {
        fetchFriendRequests();
      } else {
        fetchFriends();
      }
    }, [selectedTab])
  );

 

  const fetchFriendRequests = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Không tìm thấy token");
      const parsedToken = JSON.parse(token);

      const response = await axios.get(
       `${BASE_URL}/api/friends/requests`,
        {
          headers: {
            Authorization: `Bearer ${parsedToken.token}`,
          },
        }
      );

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

      const response = await axios.get(
       `${BASE_URL}/api/friends/list`,
        {
          headers: {
            Authorization: `Bearer ${parsedToken.token}`,
          },
        }
      );

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
    if (phone.startsWith('+84')) {
      return '0' + phone.slice(3);
    }
    return phone;
  };

  const formatDate = (isoDate) => {
    if (!isoDate) return 'Không có thông tin';
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) {
      console.log('Ngày không hợp lệ:', isoDate); // Debug
      return 'Ngày không hợp lệ';
    }
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const renderFriendItem = ({ item }) => (
    <TouchableOpacity
      style={styles.requestItem}
      onPress={() => {
        console.log('Dữ liệu bạn bè được truyền:', {
          id: item._id,
          name: item.name,
          phone: item.phone,
          dob: item.dob, // Debug dob
          avatar: item.avatar,
        });
        navigation.navigate('UserProfile', {
          user: {
            id: item._id, // Ánh xạ _id thành id
            name: item.name,
            phone: item.phone,
            dob: item.dob,
            avatar: item.avatar,
          },
        });
      }}
    >
      <View style={styles.row}>
        <Image
          source={{ uri: item.avatar || 'https://via.placeholder.com/50' }}
          style={styles.avatar}
        />
        <View style={styles.infoContainer}>
          <Text style={styles.senderName}>{item.name}</Text>
          <Text>{formatPhone(item.phone)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );


  
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
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
        </View>

        {isLoading ? (
          <Text style={styles.noRequests}>Đang tải...</Text>
        ) : (
          <FlatList
            data={selectedTab === "requests" ? requests : friends}
            keyExtractor={(item) => item._id}
            renderItem={
              selectedTab === "requests" ? renderRequestItem : renderFriendItem
            }
            ListEmptyComponent={
              <Text style={styles.noRequests}>
                {selectedTab === "requests"
                  ? "Không có lời mời nào."
                  : "Bạn chưa có bạn bè nào."}
              </Text>
            }
          />
        )}
      </View>
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
    marginTop:-10,
    padding: 24,
    backgroundColor: "#fff",

  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 16,
    justifyContent: "center",
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#eee",
    marginHorizontal: 5,
  },
  activeTab: {
    backgroundColor: "#007BFF",
  },
  tabText: {
    color: "#fff",
    fontWeight: "bold",
  },
  requestItem: {
    padding: 12,
    marginBottom: 12,
    borderRadius: 10,
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: "#ccc",
  },
  infoContainer: {
    flex: 1,
  },
  senderName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  buttons: {
    flexDirection: "row",
    gap: 10,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    marginRight: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  noRequests: {
    textAlign: "center",
    color: "#777",
    marginTop: 50,
    fontSize: 16,
  },
});
