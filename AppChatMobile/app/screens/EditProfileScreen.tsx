import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { BASE_URL } from "../config/config";
import styles from '../style/EditProfileStyle';
import DateTimePicker from '@react-native-community/datetimepicker'; 
const EditProfileScreen = ({ route, navigation }) => {
  const { userInfo } = route.params;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [avatar, setAvatar] = useState(null);
const [showDatePicker, setShowDatePicker] = useState(false);
const [nameError, setNameError] = useState('');
const [dobError, setDobError] = useState('');
const [genderError, setGenderError] = useState('');
  const validate = () => {
  let valid = true;
  setNameError('');
  setDobError('');
  setGenderError('');

  if (!name.trim()) {
    setNameError('Vui lòng nhập họ và tên.');
    valid = false;
  } else if (!/^[a-zA-ZÀ-ỹ\s]+$/.test(name.trim())) {
    setNameError('Tên chỉ được nhập chữ, không chứa số hoặc ký tự đặc biệt.');
    valid = false;
  }

  if (!dob.trim()) {
    setDobError('Vui lòng chọn ngày sinh.');
    valid = false;
  } else if (!dob.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    setDobError('Ngày sinh không hợp lệ.');
    valid = false;
  } else {
    // Kiểm tra tuổi phải >= 15
    const [day, month, year] = dob.split('/');
    const dobDate = new Date(`${year}-${month}-${day}`);
    const now = new Date();
    const minDate = new Date(now.getFullYear() - 15, now.getMonth(), now.getDate());
    if (dobDate > minDate) {
      setDobError('Bạn phải từ 15 tuổi trở lên.');
      valid = false;
    }
  }

  if (!gender.trim()) {
    setGenderError('Vui lòng chọn giới tính.');
    valid = false;
  }

  return valid;
};

  const formatDateToDDMMYYYY = (isoDate) => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatDateToYYYYMMDD = (date) => {
    if (!date) return '';
    const [day, month, year] = date.split('/');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (userInfo) {
      setName(userInfo.name || '');
      setPhone(userInfo.phone || '');
      setDob(formatDateToDDMMYYYY(userInfo.dob || ''));
      setEmail(userInfo.email || '');
      setGender(userInfo.gender || '');
      setAvatar(userInfo.avatar || null); // Lấy avatar từ userInfo
    }
  }, [userInfo]);

  
  // Hàm chọn hình ảnh
  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.cancelled) {
      setAvatar(result.uri); // Cập nhật avatar với hình ảnh đã chọn
    }
  };

  // Hàm tải hình ảnh lên Cloudinary
  // const handleUploadImage = async (uri) => {
  //   const formData = new FormData();
  //   const localUri = uri;
  //   const filename = localUri.split('/').pop();
  //   const type = `image/${filename.split('.').pop()}`;

  //   formData.append('file', {
  //     uri: localUri,
  //     name: filename,
  //     type: type,
  //   });
  //   formData.append('upload_preset', 'your_cloudinary_upload_preset'); // Thay thế với upload preset của bạn

  //   try {
  //     const response = await axios.post(
  //       'https://api.cloudinary.com/v1_1/your_cloud_name/image/upload', // Thay thế với URL Cloudinary của bạn
  //       formData,
  //       {
  //         headers: { 'Content-Type': 'multipart/form-data' },
  //       }
  //     );
  //     console.log("Cloudinary response:", response.data); // Kiểm tra phản hồi từ Cloudinary
  //     return response.data.secure_url; // URL của hình ảnh trên Cloudinary
  //   } catch (error) {
  //     console.error('Lỗi tải ảnh lên Cloudinary:', error);
  //     Alert.alert('Lỗi', 'Không thể tải ảnh lên. Vui lòng thử lại.');
  //     return null; // Trả về null nếu tải ảnh không thành công
  //   }
  // };

  // Hàm cập nhật hồ sơ
  const handleUpdateProfile = async () => {
    if (!validate()) return;
    const formattedDob = formatDateToYYYYMMDD(dob);
    const updatedData = { name, phone, dob: formattedDob, gender };
  
    // if (avatar) {
    //   const avatarUrl = await handleUploadImage(avatar); // Tải hình ảnh lên và lấy URL
    //   if (avatarUrl) {
    //     updatedData.avatar = avatarUrl; // Thêm URL vào dữ liệu gửi lên backend
    //   } else {
    //     return; // Nếu không thể tải ảnh lên, dừng việc cập nhật
    //   }
    // }

    console.log("Dữ liệu gửi lên API:", updatedData); // Log dữ liệu gửi đi
  
    try {
      const token = await AsyncStorage.getItem("token");
      const parsedToken = JSON.parse(token);
  
      const response = await axios.put(
        `${BASE_URL}/api/auth/update-profile`,
        updatedData,
        {
          headers: { Authorization: `Bearer ${parsedToken.token}` },
        }
      );
  
      console.log("Phản hồi từ API:", response.data); // Log phản hồi từ API
  
      if (response.status === 200) {
        Alert.alert("Thành công", "Cập nhật thông tin thành công!", [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]);
      }
    } catch (error) {
      console.error("Lỗi cập nhật thông tin:", error.message);
      Alert.alert("Lỗi", "Không thể cập nhật thông tin. Vui lòng thử lại.");
    }
  };

  const handleUpdatePassword = () => {
    // Điều hướng đến màn hình cập nhật mật khẩu
    navigation.navigate('UpdatePassword');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Chỉnh sửa thông tin</Text>

        {/* {avatar && (
          <Image
            source={{ uri: avatar }} // Hiển thị hình ảnh đã chọn
            style={styles.avatar}
          />
        )}

        <TouchableOpacity style={styles.avatarButton} onPress={handlePickImage}>
          <Text style={styles.buttonText}>Chọn ảnh đại diện</Text>
        </TouchableOpacity> */}

        <Text style={styles.label}>Họ và tên</Text>
        <TextInput
          style={styles.input}
          placeholder="Nhập họ và tên"
          value={name}
          onChangeText={setName}
        />
        {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

        <Text style={styles.label}>Số điện thoại</Text>
        <TextInput
          style={styles.input}
          value={phone}
          editable= {false}
        />

        <Text style={styles.label}>Ngày sinh</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowDatePicker(true)}
        >
          <Text>{dob || "Chọn ngày sinh"}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={dob ? new Date(formatDateToYYYYMMDD(dob)) : new Date()}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                const day = String(selectedDate.getDate()).padStart(2, '0');
                const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                const year = selectedDate.getFullYear();
                setDob(`${day}/${month}/${year}`);
              }
            }}
          />
        )}
        {dobError ? <Text style={styles.errorText}>{dobError}</Text> : null}

{/* <Text style={styles.label}>Email</Text>
<Text style={[styles.input, { paddingVertical: 12, color: '#555' }]}>
  {email}
</Text> */}

        <Text style={styles.label}>Giới tính</Text>
        <View style={styles.genderContainer}>
          {['Nam', 'Nữ'].map((genderOption) => (
            <TouchableOpacity
              key={genderOption}
              style={[styles.genderOption, gender === genderOption && styles.genderOptionSelected]}
              onPress={() => setGender(genderOption)}
            >
              <Text style={[styles.genderText, gender === genderOption && styles.genderTextSelected]}>
                {genderOption}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {genderError ? <Text style={styles.errorText}>{genderError}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={handleUpdateProfile}>
          <Text style={styles.buttonText}>Cập nhật thông tin</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleUpdatePassword}
        >
          <Text style={styles.buttonText}>Cập nhật mật khẩu</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EditProfileScreen;
