import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../config/config";
import styles from "../style/UserProfileStyle"; 
const UserProfileScreen = ({ route }) => {
  const { user } = route.params;
  const [isRequestSent, setIsRequestSent] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [isSelf, setIsSelf] = useState(false);

  useEffect(() => {
    checkCurrentUser();
    checkFriendStatus();
    checkRequestStatus();
  }, []);

  const checkCurrentUser = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Không tìm thấy token');
      const parsedToken = JSON.parse(token);
      console.log('Token structure:', parsedToken); // Debug

      // Giải mã JWT payload
      const base64Url = parsedToken.token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      const currentUserId = payload.userId || payload._id || payload.sub || payload.id || payload.user_id;
      if (!currentUserId) throw new Error('Không tìm thấy ID người dùng trong token');

      setIsSelf(currentUserId === user.id);
    } catch (error) {
      console.error('Lỗi kiểm tra người dùng hiện tại:', error.message);
      Alert.alert('Lỗi', 'Không thể xác định người dùng hiện tại.');
    }
  };

  const checkFriendStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Không tìm thấy token');
      const parsedToken = JSON.parse(token);
  
      const response = await axios.get(`${BASE_URL}/api/friends/list`, {
        headers: { Authorization: `Bearer ${parsedToken.token}` },
      });
  
      console.log('Danh sách bạn bè từ API:', response.data); // Debug
      console.log('User ID đang kiểm tra:', user.id); // Debug
  
      const friends = response.data;
      const isAlreadyFriend = friends.some((friend) => {
        console.log('So sánh Friend ID:', friend._id, 'với User ID:', user.id); // Debug
        return friend._id === user.id;
      });
      console.log('Kết quả isFriend:', isAlreadyFriend); // Debug
      setIsFriend(isAlreadyFriend);
    } catch (error) {
      console.error('Lỗi kiểm tra trạng thái bạn bè:', error.message);
      Alert.alert('Lỗi', 'Không thể kiểm tra trạng thái bạn bè.');
    }
  };

  const checkRequestStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Không tìm thấy token');
      const parsedToken = JSON.parse(token);

      const response = await axios.get(`${BASE_URL}/api/friends/sent-requests`, {
        headers: { Authorization: `Bearer ${parsedToken.token}` },
      });

      const sentRequests = response.data.requests;
      const isRequestPending = sentRequests.some(
        (request) => request.userId2._id === user.id
      );
      setIsRequestSent(isRequestPending);
    } catch (error) {
      console.error('Lỗi kiểm tra trạng thái lời mời:', error.message);
      Alert.alert('Lỗi', 'Không thể kiểm tra trạng thái lời mời.');
    }
  };

  const sendFriendRequest = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Không tìm thấy token');
      const parsedToken = JSON.parse(token);

      // Giải mã JWT payload
      const base64Url = parsedToken.token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      const currentUserId = payload.userId || payload._id || payload.sub || payload.id || payload.user_id;
      if (!currentUserId) throw new Error('Không tìm thấy ID người dùng trong token');

      if (currentUserId === user.id) {
        Alert.alert('Thông báo', 'Không thể kết bạn với chính mình.');
        return;
      }

      await axios.post(
        `${BASE_URL}/api/friends/send-request`,
        { receiverId: user.id },
        { headers: { Authorization: `Bearer ${parsedToken.token}` } }
      );

      setIsRequestSent(true);
      Alert.alert('Thành công', 'Đã gửi lời mời kết bạn.');
    } catch (error) {
      console.error('Lỗi gửi lời mời:', error.response?.data);
      const message = error.response?.data?.message || 'Không thể gửi lời mời kết bạn.';
      Alert.alert('Thất bại', message);
    }
  };

  const cancelFriendRequest = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Không tìm thấy token');
      const parsedToken = JSON.parse(token);

      await axios.post(
        `${BASE_URL}/api/friends/cancel-request`,
        { receiverId: user.id },
        { headers: { Authorization: `Bearer ${parsedToken.token}` } }
      );

      setIsRequestSent(false);
      Alert.alert('Đã hủy', 'Lời mời kết bạn đã được hủy.');
    } catch (error) {
      console.error('Lỗi hủy lời mời:', error);
      Alert.alert('Thất bại', 'Không thể hủy lời mời kết bạn.');
    }
  };

  const formatPhone = (phone) => {
    if (phone.startsWith('+84')) {
      return '0' + phone.slice(3);
    }
    return phone;
  };

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Lưu ý: tháng bắt đầu từ 0
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const unfriendUser = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Không tìm thấy token');
      const parsedToken = JSON.parse(token);
  
      await axios.post(
        `${BASE_URL}/api/friends/unfriend`,
        { friendId: user.id },
        { headers: { Authorization: `Bearer ${parsedToken.token}` } }
      );
  
      setIsFriend(false);
      Alert.alert('Đã hủy kết bạn', `Bạn và ${user.name} không còn là bạn bè.`);
    } catch (error) {
      console.error('Lỗi khi hủy kết bạn:', error);
      Alert.alert('Thất bại', 'Không thể hủy kết bạn.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trang cá nhân</Text>
      <Image
        source={{ uri: user.avatar || 'https://via.placeholder.com/120' }}
        style={styles.avatar}
      />
      <Text style={styles.info}>Tên: {user.name}</Text>
      <Text style={styles.info}>SĐT: {formatPhone(user.phone)}</Text>
      <Text style={styles.info}>Ngày sinh: {formatDate(user.dob)}</Text>

      {isFriend ? (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: '#6C757D',
          flex: 1,
          marginRight: 10,
        },
      ]}
      disabled
    >
      <Text style={styles.buttonText}>Đã là bạn bè</Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: '#DC3545',
          flex: 1,
          marginLeft: 10,
        },
      ]}
      onPress={unfriendUser}
    >
      <Text style={styles.buttonText}>Hủy kết bạn</Text>
    </TouchableOpacity>

    
  </View>
) : (
  <TouchableOpacity
    style={[styles.button, { backgroundColor: isRequestSent ? '#DC3545' : '#28A745' }]}
    onPress={isRequestSent ? cancelFriendRequest : sendFriendRequest}
  >
    <Text style={styles.buttonText}>
      {isRequestSent ? 'Hủy lời mời kết bạn' : 'Gửi lời mời kết bạn'}
    </Text>
  </TouchableOpacity>
)}
    </View>
  );
};

export default UserProfileScreen;

