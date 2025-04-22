import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
} from 'react-native';
import axios from 'axios';
import { BASE_URL } from "../config/config";
export function ForgotPasswordScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetToken, setResetToken] = useState('');

  const sendOTP = async () => {
    if (!phone) {
      Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại');
      return;
    }

    try {
      const res = await axios.post(`${BASE_URL}/api/auth/send-forgot-otp`, { phone });
      Alert.alert('Thành công', res.data.message);
      setStep(2);
    } catch (error) {
      console.error("Lỗi gửi OTP:", error);
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể gửi OTP');
    }
  };

  const verifyOTP = async () => {
    if (!otp) {
      Alert.alert('Lỗi', 'Vui lòng nhập mã OTP');
      return;
    }

    try {
      const res = await axios.post(`${BASE_URL}/api/auth/verify-otp`, {
        phone,
        code: otp,
      });
      setResetToken(res.data.resetToken);
      Alert.alert('Thành công', res.data.message);
      setStep(3);
    } catch (error) {
      console.error("Lỗi xác minh OTP:", error);
      Alert.alert('Lỗi', error.response?.data?.message || 'Xác minh OTP thất bại');
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword) {
      Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu mới');
      return;
    }

    try {
      await axios.post(`${BASE_URL}/api/auth/reset-password`, {
        resetToken,
        newPassword,
      });

      Alert.alert('Thành công', 'Đặt lại mật khẩu thành công!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error("Lỗi đặt lại mật khẩu:", error);
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể đặt lại mật khẩu');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Quên mật khẩu</Text>

      {step === 1 && (
        <>
          <Text style={styles.subtitle}>Nhập số điện thoại để nhận mã OTP</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập số điện thoại"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
          <TouchableOpacity style={styles.button} onPress={sendOTP}>
            <Text style={styles.buttonText}>Gửi mã OTP</Text>
          </TouchableOpacity>
        </>
      )}

      {step === 2 && (
        <>
          <Text style={styles.subtitle}>Nhập mã OTP vừa nhận</Text>
          <TextInput
            style={styles.input}
            placeholder="Mã OTP"
            keyboardType="number-pad"
            value={otp}
            onChangeText={setOtp}
          />
          <TouchableOpacity style={styles.button} onPress={verifyOTP}>
            <Text style={styles.buttonText}>Xác minh OTP</Text>
          </TouchableOpacity>
        </>
      )}

      {step === 3 && (
        <>
          <Text style={styles.subtitle}>Nhập mật khẩu mới</Text>
          <TextInput
            style={styles.input}
            placeholder="Mật khẩu mới"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
            <Text style={styles.buttonText}>Đặt lại mật khẩu</Text>
          </TouchableOpacity>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 30,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 15,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 25,
    textAlign: 'center',
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 15,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    marginBottom: 20,
    width: '80%',
    marginLeft: 35,
  },
  button: {
    backgroundColor: 'blue',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    width: '80%',
    marginLeft: 35,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
