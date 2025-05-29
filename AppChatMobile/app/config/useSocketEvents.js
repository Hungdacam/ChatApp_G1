import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Alert } from 'react-native';
import socket from './socket';
import { globalEmitter } from '../globalEmitter';
export const useSocketEvents = (currentUserId) => {
  const navigation = useNavigation();

  useEffect(() => {
    // Sự kiện lời mời kết bạn
    socket.on('new_friend_request', (data) => {
      try {
        console.log("Lời mời kết bạn mới:", data);
        Alert.alert(
          "📩 Lời mời kết bạn mới",
          `Bạn nhận được lời mời kết bạn từ ${data.request.userId1.name}`
        );
      } catch (error) {
        console.error('Lỗi hiển thị thông báo lời mời kết bạn:', error);
      }
    });

    socket.on('friend_request_accepted', (data) => {
      try {
        console.log("Lời mời kết bạn đã được chấp nhận:", data);
        Alert.alert(
          "✅ Kết bạn thành công",
          `${data.receiver.name} đã chấp nhận lời mời kết bạn của bạn!`
        );
        globalEmitter.emit('friend_request_accepted', data); 
       /*  if (currentUserId) {
          navigation.navigate('ChatScreen', {
            chatId: data.chatId,
            receiverId: data.receiver._id,
            name: data.receiver.name,
            avatar: data.receiver.avatar || 'https://via.placeholder.com/50',
            isGroupChat: false,
            currentUserId: data.senderId || currentUserId,
          });
        } else {
          console.warn('currentUserId chưa sẵn sàng, không thể điều hướng.');
        } */
      } catch (error) {
        console.error('Lỗi hiển thị thông báo chấp nhận kết bạn:', error);
      }
    });

    socket.on('friend_request_rejected', (data) => {
      try {
        console.log("Lời mời kết bạn đã bị từ chối:", data);
        Alert.alert(
          "❌ Lời mời bị từ chối",
          `${data.receiver.name} đã từ chối lời mời kết bạn của bạn.`
        );
         
      } catch (error) {
        console.error('Lỗi hiển thị thông báo từ chối kết bạn:', error);
      }
    });

    // Sự kiện quản lý nhóm
    socket.on('new_group_created', (data) => {
      try {
        console.log("Nhóm mới được tạo:", data);
        Alert.alert(
          "👥 Nhóm mới",
          `Bạn đã được thêm vào nhóm "${data.groupName}"`
        );
      } catch (error) {
        console.error('Lỗi hiển thị thông báo tạo nhóm:', error);
      }
    });

    socket.on('group_member_added', (data) => {
      try {
        console.log("Thành viên mới được thêm vào nhóm:", data);
        Alert.alert(
          "➕ Thành viên mới",
          `${data.userName} đã được thêm vào nhóm`
        );
      } catch (error) {
        console.error('Lỗi hiển thị thông báo thêm thành viên:', error);
      }
    });

    socket.on('group_member_removed', (data) => {
      try {
        console.log("Thành viên bị xóa khỏi nhóm:", data);
        Alert.alert(
          "➖ Thành viên bị xóa",
          `Một thành viên đã bị xóa khỏi nhóm`
        );
      } catch (error) {
        console.error('Lỗi hiển thị thông báo xóa thành viên:', error);
      }
    });

    socket.on('removed_from_group', (data) => {
      try {
        console.log("Bạn bị xóa khỏi nhóm:", data);
        Alert.alert(
          "🚫 Bị xóa khỏi nhóm",
          `Bạn đã bị xóa khỏi nhóm "${data.groupName}"`
        );
        navigation.navigate('HomeTabs', { screen: 'Inbox' });
      } catch (error) {
        console.error('Lỗi hiển thị thông báo bị xóa khỏi nhóm:', error);
      }
    });

    socket.on('group_dissolved', (data) => {
      try {
        console.log("Nhóm đã bị giải tán:", data);
        Alert.alert(
          "🗑️ Nhóm giải tán",
          `Nhóm "${data.groupName}" đã bị giải tán`
        );
        navigation.navigate('HomeTabs', { screen: 'Inbox' });
      } catch (error) {
        console.error('Lỗi hiển thị thông báo giải tán nhóm:', error);
      }
    });

    socket.on('admin_assigned', (data) => {
      try {
        console.log("Quyền admin được gán:", data);
        Alert.alert(
          "🛡️ Quyền admin",
          `Một thành viên đã được gán quyền admin trong nhóm`
        );
      } catch (error) {
        console.error('Lỗi hiển thị thông báo gán quyền admin:', error);
      }
    });

    socket.on('admin_removed', (data) => {
      try {
        console.log("Quyền admin bị xóa:", data);
        Alert.alert(
          "🛡️ Quyền admin bị xóa",
          `Quyền admin của một thành viên đã bị xóa trong nhóm`
        );
      } catch (error) {
        console.error('Lỗi hiển thị thông báo xóa quyền admin:', error);
      }
    });

    socket.on('member_left_group', (data) => {
      try {
        console.log("Thành viên đã rời nhóm:", data);
        Alert.alert(
          "🚶 Thành viên rời nhóm",
          `Một thành viên đã rời khỏi nhóm "${data.groupName}"`
        );
      } catch (error) {
        console.error('Lỗi hiển thị thông báo thành viên rời nhóm:', error);
      }
    });

    socket.on('left_group', (data) => {
      try {
        console.log("Bạn đã rời nhóm:", data);
        Alert.alert(
          "✅ Đã rời nhóm",
          `Bạn đã rời khỏi nhóm "${data.groupName}"`
        );
        navigation.navigate('HomeTabs', { screen: 'Inbox' });
      } catch (error) {
        console.error('Lỗi hiển thị thông báo rời nhóm:', error);
      }
    });
    socket.on('friend-request-canceled', (data) => {
      try {
        console.log("Lời mời kết bạn đã bị huỷ:", data);
        // Gợi ý: reload danh sách lời mời nếu đang ở tab requests
        // Có thể dùng EventEmitter hoặc context để gọi fetchFriendRequests trong Contact.tsx
      } catch (error) {
        console.error('Lỗi khi nhận friend-request-canceled:', error);
      }
    });
    socket.on('added_to_group', (data) => {
      try {
        console.log("Bạn vừa được thêm vào nhóm:", data);
        Alert.alert(
          "🎉 Bạn đã được thêm vào nhóm",
          `Bạn đã được thêm vào nhóm "${data.groupName || "Không tên"}"`
        );
        // Có thể gọi fetchChats hoặc điều hướng nếu muốn
      } catch (error) {
        console.error('Lỗi hiển thị thông báo được thêm vào nhóm:', error);
      }
    });
    // Cleanup khi component unmount
    return () => {
      socket.off('new_friend_request');
      socket.off('friend_request_accepted');
      socket.off('friend_request_rejected');
      socket.off('new_group_created');
      socket.off('group_member_added');
      socket.off('group_member_removed');
      socket.off('removed_from_group');
      socket.off('group_dissolved');
      socket.off('admin_assigned');
      socket.off('admin_removed');
      socket.off('member_left_group');
      socket.off('left_group');
       socket.off('friend-request-canceled');
       socket.off('added_to_group');
    };
  }, [navigation, currentUserId]);
};