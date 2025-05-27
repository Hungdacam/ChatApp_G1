import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useState } from "react";
import { ImageBackground } from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { BASE_URL } from "../config/config";
import styles from "../style/AddFriendStyle";
const AddFriendScreen = () => {
  const navigation = useNavigation();

  const [phone, setPhone] = useState("");
  const handleAddFriend = async () => {
    if (phone.trim() === "") {
      Alert.alert("Lỗi", "Vui lòng nhập số điện thoại");
      return;
    }
    let formattedPhone = phone.trim();
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "+84" + formattedPhone.slice(1);
    } else if (!formattedPhone.startsWith("+84")) {
      formattedPhone = "+84" + formattedPhone;
    }
    try {
      const token = await AsyncStorage.getItem("token");
      const parsedToken = JSON.parse(token);

      const currentUserPhone = parsedToken.user?.phone;
  
      if (formattedPhone === currentUserPhone) {
        Alert.alert("Thông báo", "Bạn không thể tìm chính mình.");
        return;
      }

      const response = await axios.post(
       `${BASE_URL}/api/auth/find-user-by-phone`,
        { phone: formattedPhone },
        {
          headers: {
            Authorization: `Bearer ${parsedToken.token}`,
          },
        }
      );

      console.log("Thông tin người dùng:", response.data);
      navigation.navigate("UserProfile", { user: response.data, id: response.data._id });
    } catch (error) {
      console.error("Lỗi khi tìm user:", error.message);
      Alert.alert("Thất bại", "Không tìm thấy người dùng hoặc có lỗi xảy ra.");
    }

    setPhone("");
  };
  return (
    <ImageBackground
      source={require("../images/addFriendBG.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <Text style={styles.label}>Nhập số điện thoại</Text>

        <TextInput
          style={styles.input}
          placeholder="Số điện thoại"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          placeholderTextColor="#999"
        />

        <TouchableOpacity style={styles.button} onPress={handleAddFriend}>
          <Text style={styles.buttonText}>Tìm người dùng</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

export default AddFriendScreen;

