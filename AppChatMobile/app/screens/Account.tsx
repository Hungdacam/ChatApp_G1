import React, { useEffect, useState,useCallback   } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  
} from "react-native";
import { BASE_URL } from "../config/config";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import socket from "../config/socket";
const CLOUDINARY_UPLOAD_PRESET = "ml_default";
const CLOUDINARY_CLOUD_NAME = "dbjqhaayj";
const CLOUDINARY_API =
  `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
const AccountScreen = () => {
  const navigation = useNavigation();
  const [userInfo, setUserInfo] = useState({
    name: "",
    email: "",
    phone: "",
    dob: "",
    gender: "",
    avatar: "",
  });

  useFocusEffect(
    useCallback(() => {
      const fetchUserInfo = async () => {
        try {
          const token = await AsyncStorage.getItem("token");
          const parsedToken = JSON.parse(token);
          if (!parsedToken) return;
  
          const response = await axios.get(
            `${BASE_URL}/api/auth/check`,
            {
              headers: {
                Authorization: `Bearer ${parsedToken.token}`,
              },
            }
          );
          setUserInfo(response.data);
        } catch (error) {
          console.error("Error fetching user info:", error.message);
        }
      };
  
      fetchUserInfo();
    }, [])
  );
  

  const pickImageAndUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled) {
        const image = result.assets[0];
        const formData = new FormData();
        const localUri = image.uri;
        const filename = localUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename ?? '');
        const fileType = match ? `image/${match[1]}` : `image`;
        formData.append("file", {
          uri: image.uri,
          type: fileType,
          name: "avatar.jpg",
        });
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
        const uploadRes = await axios.post(CLOUDINARY_API, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const imageUrl = uploadRes.data.secure_url;

        const token = await AsyncStorage.getItem("token");
        const parsedToken = JSON.parse(token);
        await axios.put(
         `${BASE_URL}/api/auth/update-profile`,
          { avatar: imageUrl },
          {
            headers: { Authorization: `Bearer ${parsedToken.token}` },
          }
        );
        setUserInfo((prev) => ({ ...prev, avatar: imageUrl }));
      }
    } catch (error) {
      console.error("Upload ảnh lỗi:", error.message);
      if (error.response) {
        console.log("Chi tiết lỗi:", error.response.data);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("token");
      socket.disconnect(); // <-- Ngắt kết nối socket
      navigation.reset({
        index: 0,
        routes: [{ name: "LoginScreen" }],
      });
    } catch (error) {
      console.error("Logout error:", error.message);
    }
  };
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Tháng bắt đầu từ 0
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatPhone = (phone) => {
    if (phone.startsWith('+84')) {
      return '0' + phone.slice(3);
    }
    return phone;
  };
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={pickImageAndUpload}>
            <Image
              source={
                userInfo.avatar
                  ? { uri: userInfo.avatar }
                  : require("../../assets/adaptive-icon.png")
              }
              style={styles.avatar}
            />
          </TouchableOpacity>
          <View style={{ alignItems: "center", marginTop: 30 }}>
            <Text style={styles.name}>{userInfo.name}</Text>
          </View>
          
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>SĐT:</Text>
              <Text style={styles.infoValue}>{formatPhone(userInfo.phone)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{userInfo.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ngày sinh:</Text>
              <Text style={styles.infoValue}>{formatDate(userInfo.dob)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Giới tính:</Text>
              <Text style={styles.infoValue}>{userInfo.gender}</Text>
            </View>
          </View>
        </View>

        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate("EditProfileScreen",{ userInfo })}
          >
            <MaterialIcons name="edit" size={24} color="#FFA500" />
            <Text style={styles.buttonText}>Chỉnh sửa thông tin</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={handleLogout}>
            <MaterialIcons name="logout" size={24} color="#FF6347" />
            <Text style={styles.buttonText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f6f8fa",
  },
  container: {
    flex: 1,
    backgroundColor: "#f6f8fa",
  },
  profileSection: {
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: "center",
    backgroundColor: "#fff",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 18,
  },
  avatar: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderColor: "#1976d2",
    borderWidth: 3,
    backgroundColor: "#e3eaf2",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#222",
    marginTop: 22,
    marginBottom: 8,
    textAlign: "center",
  },
  infoContainer: {
    width: "100%",
    marginTop: 18,
    backgroundColor: "#f3f6fb",
    borderRadius: 16,
    padding: 18,
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoLabel: {
    color: "#1976d2",
    fontWeight: "bold",
    fontSize: 16,
    minWidth: 90,
  },
  infoValue: {
    color: "#222",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 4,
  },
  buttonSection: {
    padding: 20,
    gap: 15,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: "#1976d2",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#e3eaf2",
  },
  buttonText: {
    color: "#1976d2",
    marginLeft: 15,
    fontSize: 17,
    fontWeight: "600",
  },
});

export default AccountScreen;
