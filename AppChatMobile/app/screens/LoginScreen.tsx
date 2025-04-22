import React, { useRef, useState, useEffect } from "react";

import { useNavigation } from "@react-navigation/native";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  ImageBackground,
} from "react-native";
import { BASE_URL } from "../config/config";
import Icon from "react-native-vector-icons/Ionicons";
import { Formik } from "formik";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import socket from '../config/socket'; 
export default function LoginScreen() {
  const [fontsLoaded] = useFonts({
    Lobster: require("../assets/fonts/Lobster-Regular.ttf"),
  });
  const navigation = useNavigation();
  const [userId, setUserId] = useState(null);
  const [showPass, setShowPass] = useState(false);

  const email = useRef(null);
  const password = useRef(null);

  useEffect(() => {
    async function prepare() {
      await SplashScreen.preventAutoHideAsync();

      await SplashScreen.hideAsync();
    }

    prepare();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const handleConnect = () => {
      socket.emit("register", userId);
      console.log("✅ Đã gửi register socket:", userId);
    };

    socket.on("connect", handleConnect);

    return () => {
      socket.off("connect", handleConnect); // cleanup
    };
  }, [userId]);
  async function signIn(data) {
    const { phone, password } = data;

    try {
      const response = await axios.post(
       `${BASE_URL}/api/auth/login`,
        {
          phone,
          password,
        }
      );
      const tokenData = response.data;
     
      await AsyncStorage.setItem("token",JSON.stringify(tokenData));
      const userId = tokenData.user._id;
      setUserId(userId);
      socket.emit("register", userId);
      
       console.log("Đã gửi register socket:", userId);
      console.log("Đăng nhập thành công:", response.data);

      navigation.reset({
        index: 0,
        routes: [{ name: "HomeTabs" }],
      });
    } catch (error) {
      console.log("Lỗi đăng nhập:", error.message);
      Alert.alert("Tài khoản hoặc mật khẩu không đúng", "Vui lòng thử lại.");
    }
  }

  return (
    
      <View style={{ backgroundColor: "#fff", flex: 1 }}>
        <View style={style.container}>
          <View style={style.header}>
            <Image
              source={require("../images/logo-removebg-preview.png")}
              style={style.logo}
            />
          </View>
          <View style={style.title}>
            <Text style={style.title1}>ShibaTalk</Text>

            <Text style={style.title3}>Đăng nhập vào tài khoản của bạn</Text>
          </View>
          <Formik
            initialValues={{ phone: "", password: "" }}
            onSubmit={(value) => {
              signIn(value);
            }}
          >
            {(props) => (
              <View style={{ flex: 1 }}>
                <View style={style.content}>
                  <View style={style.content1}>
                    <Icon name="mail-outline" size={20} color={'gray'}></Icon>
                    <TextInput
                      style={style.input}
                      placeholder="Nhập số điện thoại của bạn"
                      placeholderTextColor={"gray"}
                      keyboardType="phone-pad"
                      onChangeText={props.handleChange("phone")}
                      value={props.values.phone}
                    />
                  </View>
                  <View style={style.content2}>
                    <Icon name="lock-closed-outline" size={20}></Icon>
                    <TextInput
                      style={style.input}
                      placeholder="Nhập mật khẩu cùa bạn"
                      placeholderTextColor={"gray"}
                      ref={password}
                      onChangeText={props.handleChange("password")}
                      value={props.values.password}
                      secureTextEntry={!showPass}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPass(!showPass)}
                      style={style.eyeButton}
                    >
                      <Icon name="eye" size={20}></Icon>
                    </TouchableOpacity>
                  </View>
                  <View style={style.content3}>
                    <View>
                      <TouchableOpacity
                        onPress={() =>
                          navigation.navigate("ForgotPasswordScreen")
                        }
                      >
                        <Text style={{ color: "red", paddingTop:10, fontWeight:'bold'}}>Quên mật khẩu?</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
                <View style={style.button}>
                  <TouchableOpacity
                    style={style.opacity}
                    onPress={props.handleSubmit}
                  >
                    <Text style={style.buttonContinue}>Đăng nhập</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Formik>

          <View style={style.dangKi}>
            <Text style={{ textAlign: "center", color: "white" }}>
              Bạn chưa có tài khoản?{" "}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={{ color: "#800080" }}>Đăng kí ngay</Text>
            </TouchableOpacity>
          </View>

          <View
            style={{
              flex: 0.2,
              flexDirection: "row",

              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View style={style.line} />
          </View>

          <View
            style={{
              flex: 1,
              flexDirection: "column",
            }}
          >
            <Text style={style.agreementText}>
              By signing up, you agree to our{" "}
              <Text style={style.link}>Terms</Text> &{" "}
              <Text style={style.link}>Privacy Policy</Text>
            </Text>
          </View>
        </View>
      </View>
  
  );
}
const style = StyleSheet.create({
  imgbgr: {
    flex: 1,
    resizeMode: "cover",
  },
  logo: {
    height: 150,
    width: 150,
  },
  title1: {
    fontSize: 70,
    fontFamily: "Lobster",
    color: "#4A90E2",
    
  },
  title3: {
    opacity: 0.4,
    color: "black",
  },
  container: {
    flex: 1,
  },
  header: {
    flex: 1,

    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    flex: 0.7,

    alignItems: "center",
  },
  content: {
    flex: 1.5,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",

    marginTop: -60,
  },
  content1: {
    flex: 0.3,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginVertical: 10,
    width: "80%",
    backgroundColor: "#eeeeee",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  content2: {
    flex: 0.3,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginVertical: 10,
    width: "80%",
    backgroundColor: "#eeeeee",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  content3: {
    flexDirection: "row",
    justifyContent: "flex-end",
    width: "80%",
    height: 50,
  },
  input: {
    marginLeft: 10,
    width: "100%",
    height: 40,
    color: "black",
  },
  button: {
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -70,
    paddingTop: 30,
  },
  opacity: {
    borderWidth: 0.5,
    borderRadius: 10,
    backgroundColor: "blue",
    alignItems: "center",
    width: "80%",
    height: 50,
    justifyContent: "center",
  },
  buttonContinue: {
    fontSize: 20,
    color: "white",
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#000",
    marginHorizontal: 15,
    opacity: 0.2,
  },
  iconContainer: {
    width: 300,
    height: 50,
    borderRadius: 10,

    borderColor: "black",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  eyeButton: {
    position: "absolute",
    right: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  remberMe: {
    height: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  dangKi: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -20,
    paddingTop: 20,
  },
  fbgg: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
  },
  UngDungDangNhap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: "70%",
    marginLeft: -80,
  },
  agreementText: {
    color: "#555",
    fontSize: 13,
    textAlign: "center",
    marginTop: 150,
  },
  link: {
    color: "#007AFF",
    textDecorationLine: "underline",
  },
});
