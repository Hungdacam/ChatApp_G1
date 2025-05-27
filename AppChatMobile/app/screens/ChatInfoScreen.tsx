// ChatInfoScreen.tsx
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
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { BASE_URL } from "../config/config";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Video, ResizeMode } from "expo-av";
import { Linking } from "react-native";
import Modal from "react-native-modal";
import ImageViewer from "react-native-image-zoom-viewer";
import styles from "../style/ChatInfoStyle"; 

interface MediaItem {
  type: string;
  url: string;
  name?: string;
}

interface ChatInfoScreenProps {
  route: {
    params: {
      chatId: string;
      name: string;
      avatar: string;
      isGroupChat: boolean;
      currentUserId: string;
      receiverId?: string;
    };
  };
}

export default function ChatInfoScreen({ route }: ChatInfoScreenProps) {
  const { chatId, name, avatar: initialAvatar, isGroupChat, currentUserId, receiverId } = route.params;
  const [chatName, setChatName] = useState(name);
  const [avatar, setAvatar] = useState(initialAvatar || "https://via.placeholder.com/50");
  const [searchQuery, setSearchQuery] = useState("");
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [isVideoModalVisible, setIsVideoModalVisible] = useState(false);
  const [isAvatarModalVisible, setIsAvatarModalVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentVideoUrl, setCurrentVideoUrl] = useState("");
  const [activeTab, setActiveTab] = useState("Images");
  const [isAdmin, setIsAdmin] = useState(false);
  const navigation = useNavigation();

  const imageUrls = mediaItems
    .filter((item) => item.type === "image")
    .map((item) => ({ url: item.url }));

  const avatarUrl = [{ url: avatar }];

  useEffect(() => {
    fetchMediaItems();
    if (isGroupChat) {
      fetchChatDetails();
    }
  }, [chatId]);

  const fetchChatDetails = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Không tìm thấy token");
      const parsedToken = JSON.parse(token);

      const response = await axios.get(`${BASE_URL}/api/chat/${chatId}`, {
        headers: { Authorization: `Bearer ${parsedToken.token}` },
      });

      const admins = response.data.admins || [];
      setIsAdmin(admins.includes(currentUserId));
    } catch (error) {
      console.error("Lỗi lấy chi tiết nhóm:", error);
      Alert.alert("Lỗi", "Không thể lấy chi tiết nhóm.");
    }
  };

  const fetchMediaItems = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Không tìm thấy token");
      const parsedToken = JSON.parse(token);

      const response = await axios.get(`${BASE_URL}/api/chat/messages/${chatId}`, {
        headers: { Authorization: `Bearer ${parsedToken.token}` },
      });

      const media = response.data
        .filter((msg: any) => msg.image || msg.video || msg.fileUrl)
        .map((msg: any) => {
          if (msg.image) return { type: "image", url: msg.image };
          if (msg.video) return { type: "video", url: msg.video };
          if (msg.fileUrl) return { type: "file", url: msg.fileUrl, name: msg.fileName };
          return null;
        })
        .filter((item): item is MediaItem => item !== null);

      setMediaItems(media);
    } catch (error) {
      console.error("Lỗi lấy media items:", error);
      Alert.alert("Lỗi", "Không thể tải dữ liệu media.");
    }
  };

  const updateChatAvatar = async () => {
    if (!isGroupChat) {
      Alert.alert("Lỗi", "Chỉ nhóm chat mới có thể thay đổi ảnh.");
      return;
    }
    if (!isAdmin) {
      Alert.alert("Lỗi", "Chỉ admin mới có thể thay đổi ảnh nhóm.");
      return;
    }
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!res.canceled && res.assets[0]) {
        const token = await AsyncStorage.getItem("token");
        if (!token) throw new Error("Không tìm thấy token");
        const parsedToken = JSON.parse(token);

        const formData = new FormData();
        formData.append("chatId", chatId);
        formData.append("avatar", {
          uri: res.assets[0].uri,
          type: res.assets[0].mimeType || "image/jpeg",
          name: res.assets[0].fileName || `avatar-${Date.now()}.jpg`,
        });

        const response = await axios.post(`${BASE_URL}/api/group/update-avatar`, formData, {
          headers: { Authorization: `Bearer ${parsedToken.token}`, "Content-Type": "multipart/form-data" },
        });

        setAvatar(response.data.avatar || res.assets[0].uri);
        Alert.alert("Thành công", "Cập nhật avatar thành công");
      }
    } catch (error) {
      console.error("Lỗi cập nhật avatar:", error);
      Alert.alert("Lỗi", "Không thể cập nhật avatar.");
    }
  };

  const addMember = () => {
    if (!isGroupChat) return;
    navigation.navigate("AddGroupMember", { chatId });
  };

  const viewUserProfile = async () => {
    if (isGroupChat || !receiverId) return;
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Không tìm thấy token");
      const parsedToken = JSON.parse(token);

      const response = await axios.get(`${BASE_URL}/api/auth/user/${receiverId}`, {
        headers: { Authorization: `Bearer ${parsedToken.token}` },
      });

      const user = {
        id: response.data._id,
        name: response.data.name,
        phone: response.data.phone,
        avatar: response.data.avatar,
        dob: response.data.dob,
      };

      navigation.navigate("UserProfile", { user });
    } catch (error) {
      console.error("Lỗi lấy thông tin người dùng:", error);
      Alert.alert("Lỗi", "Không thể tải thông tin người dùng");
    }
  };

  const renderMediaItem = ({ item, index }: { item: MediaItem; index: number }) => (
    <View style={styles.mediaItem}>
      {item.type === "image" && activeTab === "Images" ? (
        <TouchableOpacity
          onPress={() => {
            setCurrentImageIndex(imageUrls.findIndex((img) => img.url === item.url));
            setIsImageModalVisible(true);
          }}
        >
          <Image source={{ uri: item.url }} style={styles.mediaImage} />
        </TouchableOpacity>
      ) : item.type === "video" && activeTab === "Images" ? (
        <TouchableOpacity
          onPress={() => {
            setCurrentVideoUrl(item.url);
            setIsVideoModalVisible(true);
          }}
        >
          <Video
            source={{ uri: item.url }}
            style={styles.mediaVideo}
            useNativeControls={false}
            resizeMode={ResizeMode.COVER}
            isLooping={false}
          />
        </TouchableOpacity>
      ) : item.type === "file" && activeTab === "Files" ? (
        <TouchableOpacity
          onPress={() => Linking.openURL(item.url).catch(() => Alert.alert("Lỗi", "Không thể mở file."))}
        >
          <View style={[styles.filePreviewContainer, { backgroundColor: "#e0e0e0" }]}>
            <Image
              source={{ uri: "https://via.placeholder.com/40?text=FILE" }}
              style={styles.filePreviewIcon}
            />
            <View style={styles.fileInfo}>
              <Text style={styles.fileNameText}>
                {decodeURIComponent(item.name || "Unknown.file").split('/').pop() || "Unknown.file"}
              </Text>
              <Text style={styles.fileDetails}>
                FILE - {Math.round((item.url.length || 0) / 1024)} KB
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  const renderTabButton = (tabName: string, label: string, iconName: string) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tabName && styles.activeTabButton]}
      onPress={() => setActiveTab(tabName)}
    >
      <Ionicons name={iconName as any} size={24} color={activeTab === tabName ? "#007AFF" : "#666"} />
      <Text style={[styles.tabText, activeTab === tabName && styles.activeTabText]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Thông tin đoạn chat</Text>
      </View>

      <View style={styles.avatarSection}>
        {isGroupChat && isAdmin ? (
          <TouchableOpacity onPress={updateChatAvatar}>
            <TouchableOpacity onPress={() => setIsAvatarModalVisible(true)}>
              <Image source={{ uri: avatar }} style={styles.avatar} />
            </TouchableOpacity>
            <Text style={styles.changeAvatarText}>Thay đổi ảnh</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setIsAvatarModalVisible(true)}>
            <Image source={{ uri: avatar }} style={styles.avatar} />
          </TouchableOpacity>
        )}
        <Text style={styles.chatName}>{chatName}</Text>
      </View>

      <View style={styles.buttonContainer}>
        {!isGroupChat && receiverId && (
          <TouchableOpacity style={styles.actionButton} onPress={viewUserProfile}>
            <Ionicons name="person-outline" size={24} color="#007AFF" />
            <Text style={styles.buttonText}>Xem trang cá nhân</Text>
          </TouchableOpacity>
        )}
        {isGroupChat && (
          <TouchableOpacity style={styles.actionButton} onPress={addMember}>
            <Ionicons name="person-add-outline" size={24} color="#007AFF" />
            <Text style={styles.buttonText}>Thêm thành viên</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert("Chưa hỗ trợ", "Tính năng này sẽ được triển khai sau.")}>
          <Ionicons name="pin-outline" size={24} color="#007AFF" />
          <Text style={styles.buttonText}>Tin nhắn đã ghim</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm tin nhắn..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.tabContainer}>
        {renderTabButton("Images", "Ảnh", "image-outline")}
        {renderTabButton("Files", "File", "document-outline")}
        {renderTabButton("Links", "Link", "link-outline")}
      </View>

      <View style={styles.mediaSection}>
        <FlatList
          data={mediaItems.filter((item) => {
            if (activeTab === "Images") return item.type === "image" || item.type === "video";
            if (activeTab === "Files") return item.type === "file";
            return false;
          })}
          renderItem={renderMediaItem}
          keyExtractor={(item, index) => `${item.url}-${index}`}
          numColumns={3}
          ListEmptyComponent={<Text style={styles.emptyText}>Chưa có {activeTab.toLowerCase()} nào.</Text>}
        />
      </View>

      <Modal
        isVisible={isImageModalVisible}
        onBackdropPress={() => setIsImageModalVisible(false)}
        onBackButtonPress={() => setIsImageModalVisible(false)}
        style={styles.imageModal}
      >
        <ImageViewer
          imageUrls={imageUrls}
          index={currentImageIndex}
          onSwipeDown={() => setIsImageModalVisible(false)}
          enableSwipeDown={true}
          saveToLocalByLongPress={false}
        />
      </Modal>

      <Modal
        isVisible={isVideoModalVisible}
        onBackdropPress={() => setIsVideoModalVisible(false)}
        onBackButtonPress={() => setIsVideoModalVisible(false)}
        style={styles.videoModal}
      >
        <Video
          source={{ uri: currentVideoUrl }}
          style={styles.fullScreenVideo}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          isLooping={false}
          onError={(error) => Alert.alert("Lỗi", "Không thể phát video: " + error)}
        />
      </Modal>

      <Modal
        isVisible={isAvatarModalVisible}
        onBackdropPress={() => setIsAvatarModalVisible(false)}
        onBackButtonPress={() => setIsAvatarModalVisible(false)}
        style={styles.imageModal}
      >
        <ImageViewer
          imageUrls={avatarUrl}
          index={0}
          onSwipeDown={() => setIsAvatarModalVisible(false)}
          enableSwipeDown={true}
          saveToLocalByLongPress={false}
        />
      </Modal>
    </SafeAreaView>
  );
}