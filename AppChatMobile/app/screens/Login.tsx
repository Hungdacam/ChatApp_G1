import { StyleSheet, Text, View, Image,TouchableOpacity, SafeAreaView ,Button} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import {useNavigation}  from '@react-navigation/native';
import React, { useEffect } from 'react';
import * as Facebook from 'expo-facebook';

import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { reconnectSocket } from "../config/socket";

// Sau khi đăng nhập thành công và lưu token:

export function Login() {
  const navigation = useNavigation();
  const androidClientId = '151045395656-fnhdl7jdhhps8feuuvs8mp6gjtn61s24.apps.googleusercontent.com';
  const webClientId = '151045395656-hs6lb1ibgl6ut1f0g05183fh3h0u8oi0.apps.googleusercontent.com';
  const iosClientId = '151045395656-0rb6c41k4fq2lp9247fp1brscr2inl62.apps.googleusercontent.com';
  WebBrowser.maybeCompleteAuthSession();
 

   // Nó sẽ in ra https://auth.expo.io/@your-username/your-app-slug
  


  // Hàm xử lý đăng nhập

 
  type CustomRedirectUriOptions = {
    native?: string;
    scheme?: string;
    path?: string;
    preferLocalhost?: boolean;
    isTripleSlashed?: boolean;
    useProxy?: boolean;
  };
  
  const redirectUri = `https://auth.expo.io/@thang260903/AppChatMobile`;

  
  
  const config = {
    webClientId,
    iosClientId,
    androidClientId,
    redirectUri,
  };
  
  const [request, response, promptAsync] = Google.useAuthRequest(config);
  
  const handleToken = () => {
    if (response?.type === "success") {
      const { authentication } = response;
      const token = authentication?.accessToken;
      console.log("Access token:", token);
    } else if (response?.type === "error") {
      console.log("Authentication error:", response.error);
    }
  };
  
  useEffect(() => {
    handleToken();
    console.log("🔗 Redirect URI:", redirectUri);
  }, [response]);
    


  const handleLoginByFacebook = async () => {
    try {
      if (!Facebook.initializeAsync) {
        console.error("Facebook SDK not initialized correctly");
        return;
      }
  
      await Facebook.initializeAsync({
        appId: "698245142865922"
      });
  
      const result = await Facebook.logInWithReadPermissionsAsync({
        permissions: ["public_profile", "email"],
      });
  
      if (result.type === "success") {
        const { token } = result;
        const credential = FacebookAuthProvider.credential(token);
        const userCredential = await signInWithCredential(auth, credential);
        console.log("User logged in Firebase:", userCredential.user);
        // Gọi hàm handleLoginSuccess sau khi đăng nhập thành công
        handleLoginSuccess(userCredential.user.accessToken);
      } else {
        console.log("Facebook login cancelled");
      }
    } catch (error) {
      console.log("Facebook Login Error:", error);
    }
  };
  
  const handleLoginByAccout = async () => {
    navigation.navigate('LoginScreen');
  }

  // Sau khi đăng nhập thành công và nhận được token
  const handleLoginSuccess = async (tokenFromAPI) => {
    await AsyncStorage.setItem("token", JSON.stringify({ token: tokenFromAPI }));
    await reconnectSocket();
    // Chuyển sang màn hình Home hoặc màn hình chính
    navigation.reset({
      index: 0,
      routes: [{ name: "Home" }],
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Image source={require('../images/logo.png')} style={styles.imageContainer}/>
      <View style={styles.titleContainer}>
        <Text style={styles.titleText}>
          ShibaTalk
        </Text>
        <Text style={styles.sloganText}>
          Where Hearts Connect, Love Finds Its Sync
        </Text>
      </View>
      <View style={styles.buttonLogin}>
       
      <TouchableOpacity 
        onPress={() => promptAsync()}
      style={[styles.button, styles.appleButton]}>
        <FontAwesome name="google" size={24} color="white" style={styles.icon} />
        <Text style={styles.buttonText}>Continue with Google</Text>
      </TouchableOpacity>

      
      <TouchableOpacity 
      onPress={handleLoginByFacebook}
      style={[styles.button, styles.facebookButton]}>
        <FontAwesome name="facebook" size={24} color="white" style={styles.icon} />
        <Text style={styles.buttonText}>Continue with Facebook</Text>
      </TouchableOpacity>

      
      <TouchableOpacity 
      onPress={() => handleLoginByAccout()}
      style={[styles.button, styles.phoneButton]}>
        <FontAwesome name="user" size={24} color="white" style={styles.icon} />
        <Text style={styles.buttonText}>Use account</Text>
      </TouchableOpacity>
      </View>
      <View style={styles.privacyContainer}>
        <Text style={styles.text}>
          By signing up you agree to our{' '}
          <Text style={styles.link} >
            Terms and Conditions
          </Text>
        </Text>
        <Text style={styles.text}>
          See how we use your data in our{' '}
          <Text style={styles.link} >
            Privacy Policy
          </Text>
        </Text>
      </View>
     
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer:{
    width:250,
    height:250
  },
  titleContainer:{
    alignItems:'center',
    marginTop:30
  },
  titleText:{
    fontSize:50,
    fontWeight:'bold',
    marginTop:15,
    marginBottom:5
  },
  sloganText:{
    color:'#A9A9A9',
    fontSize:17,
  },
  buttonLogin:{
    alignItems:'center',
    marginTop: 60
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    width: 300,
    marginVertical: 10,
  },
  icon: {
    marginRight: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal:20
  },
  appleButton: {
    backgroundColor: '#000000',
  },
  facebookButton: {
    backgroundColor: '#1877F2',
  },
  phoneButton: {
    backgroundColor: '#00BFFF',
  },
  privacyContainer:{
    alignItems: 'center',
    marginTop: 90,
  },
  text: {
    color: '#555',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 4,
  },
  link: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  
});
