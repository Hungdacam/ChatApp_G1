import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React ,{ useEffect }from 'react';
import { useSocketEvents } from '../AppChatMobile/app/config/useSocketEvents';
import Inbox from './app/screens/Home';
import { Login } from './app/screens/Login';
import { Register } from './app/screens/Register';
import Account from './app/screens/Account';
import Explore from './app/screens/Explore';
import Memory from './app/screens/Memory';
import Contact from './app/screens/Contact';
import LoginScreen from './app/screens/LoginScreen';
import {ForgotPasswordScreen} from './app/screens/ForgotPasswordScreen';
import EditProfileScreen from './app/screens/EditProfileScreen';
import UpdatePassword from './app/screens/UpdatePassword';
import AddFriend from './app/screens/AddFriendScreen';
import UserProfile from './app/screens/UserProfileScreen';
import Icon from "react-native-vector-icons/Ionicons";
import ChatScreen from './app/screens/ChatScreen';
import GroupManagement from './app/screens/GroupManagement';
import AddGroupMember from './app/screens/AddGroupMember';
import CreateGroup from './app/screens/CreateGroup';
import ChatInfoScreen from './app/screens/ChatInfoScreen';
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

export default function Navigation({currentUserId}) {
  useSocketEvents(currentUserId);
 
  return (
    
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Register" component={Register} />
        <Stack.Screen name="HomeTabs" component={HomeTabs} />
        <Stack.Screen name="LoginScreen" component={LoginScreen} />
        <Stack.Screen name="ForgotPasswordScreen" component={ForgotPasswordScreen} />
        <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} />
        <Stack.Screen name="UpdatePassword" component={UpdatePassword} />
        <Stack.Screen name="AddFriend" component={AddFriend} />
        <Stack.Screen name="UserProfile" component={UserProfile} />
        <Stack.Screen name="ChatScreen" component={ChatScreen} />
        <Stack.Screen name="GroupManagement" component={GroupManagement} />
        <Stack.Screen name="AddGroupMember" component={AddGroupMember} />
        <Stack.Screen name="CreateGroup" component={CreateGroup} />
        <Stack.Screen name="ChatInfoScreen" component={ChatInfoScreen} />
      </Stack.Navigator>
   
  );
}

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          switch (route.name) {
            case "Inbox":
              return <Icon name="chatbox-ellipses-outline" size={size} color={color} />;
            case "Contact":
              return <Icon name="people-outline" size={size} color={color} />;
            case "Explore":
              return <Icon name="heart" size={size} color={color} />;
            case "Memory":
              return <Icon name="chatbox-ellipses-outline" size={size} color={color} />;
            case "Account":
              return <Icon name="person-circle-outline" size={size} color={color} />;
            default:
              return null;
          }
        },
        tabBarActiveTintColor: "black",
        tabBarInactiveTintColor: "gray",
        tabBarShowLabel: true,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Inbox" component={Inbox} />
      <Tab.Screen name="Contact" component={Contact} />
      {/* <Tab.Screen name="Explore" component={Explore} />
      <Tab.Screen name="Memory" component={Memory} /> */}
      <Tab.Screen name="Account" component={Account} />
    </Tab.Navigator>
  );
}
