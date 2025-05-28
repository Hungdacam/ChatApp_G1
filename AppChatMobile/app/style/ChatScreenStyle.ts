
import { StyleSheet } from "react-native";
export default StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#222",
  },
  messageList: {
    flex: 1,
    paddingHorizontal: 10,
  },
  inputContainer: {
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#eee",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    padding: 10,
    marginRight: 10,
  },
  iconButton: {
    padding: 5,
    marginRight: 5,
  },
  emojiModal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 10,
    maxHeight: "50%",
  },
  filePreview: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
    width: "100%",
  },
  filePreviewText: {
    flex: 1,
    color: "#333",
    flexWrap: "wrap",
    fontSize: 14,
  },

  messageRow: {
    alignItems: "flex-end",
  },
  messageAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginHorizontal: 5,
  },
messageContainer: {
  marginBottom: 10,
  alignSelf: "flex-start",  // mặc định, sẽ được override trong render
  maxWidth: "90%",
  minWidth: "40%",
},

messageContent: {
  padding: 10,
  borderRadius: 10,
  maxWidth: "100%",
  flexShrink: 1,
},

  senderName: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  messageText: {
    fontSize: 14,
    fontStyle: "normal",
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 5,
  },
  messageVideo: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 5,
  },
messageFooter: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between", // thêm dòng này
  marginTop: 5,
  width: "100%", // để căn đều theo khung tin nhắn
},

  messageTime: {
    fontSize: 10,
    marginRight: 5,
  },
  messageStatus: {
    fontSize: 10,
    color: "#ddd",
  },
  forwardModal: {
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    width: "80%",
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  chatName: {
    fontSize: 16,
    color: "#333",
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    padding: 10,
  },
  closeButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#007AFF",
    borderRadius: 5,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  callContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  endCallButton: {
    backgroundColor: "#ff3b30",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    margin: 10,
  },
  filePreviewContainer: {
    flexDirection: "column", // Thay đổi từ "row" thành "column" để xếp thumbnail và thông tin dọc
    alignItems: "flex-start",   // Căn giữa các phần tử
    padding: 5,
    borderRadius: 5,
    width: 150, // Đặt chiều rộng cố định để giữ tỷ lệ
  },
  filePreviewIcon: {
    width: 40,
    height: 40,
    marginBottom: 5, // Khoảng cách giữa thumbnail và thông tin
  },
  fileInfo: {
    flexDirection: "column", // Xếp tên file và chi tiết theo cột
    alignItems: "flex-start",   // Căn giữa
  },
  fileNameText: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "left", // Căn trái tên file
  },
  fileDetails: {
    fontSize: 12,
    textAlign: "center", // Căn giữa chi tiết
  },
  replyBox: {
  backgroundColor: "#e6e6e6",
  borderLeftWidth: 3,
  borderLeftColor: "#007AFF",
  padding: 6,
  marginBottom: 4,
  borderRadius: 4,
},

replySenderName: {
  fontWeight: "bold",
  color: "#007AFF",
  marginBottom: 2,
},

replyText: {
  fontStyle: "italic",
  color: "#555",
},

});