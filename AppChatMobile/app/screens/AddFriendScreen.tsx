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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f9f9f9",
    justifyContent: "center",
  },
  label: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
    color: "#333",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 17,
  },
  background: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  overlay: {
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    padding: 20,
    borderRadius: 12,
    width: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
});
