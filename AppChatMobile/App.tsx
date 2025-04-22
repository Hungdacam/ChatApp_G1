import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import Navigation from './navigation';
import { RegisterProvider } from './app/context/RegisterContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [currentUserId, setCurrentUserId] = useState(null);

  // Lấy currentUserId từ AsyncStorage
  useEffect(() => {
    const fetchCurrentUserId = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const parsedToken = JSON.parse(token);
          const base64Url = parsedToken.token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(atob(base64));
          const userId = payload.userId || payload._id || payload.sub || payload.id || payload.user_id;
          setCurrentUserId(userId);
        }
      } catch (error) {
        console.error('Lỗi lấy currentUserId:', error);
      }
    };

    fetchCurrentUserId();
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <NavigationContainer>
        <RegisterProvider>
          <StatusBar style="auto" />
          <Navigation currentUserId={currentUserId} />
        </RegisterProvider>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});