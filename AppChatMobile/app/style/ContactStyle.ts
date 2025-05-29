import { StyleSheet } from "react-native";
export default StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#fff",
  },
  loadContactsButton: {
    backgroundColor: "#007BFF",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 16,
  },
  loadContactsText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f6fa",
    borderRadius: 22,
    padding: 4, // giảm padding
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7, // giảm padding
    paddingHorizontal: 14, // giảm padding ngang
    borderRadius: 16, // giảm border radius
    backgroundColor: "#fff",
    marginHorizontal: 2, // giảm margin
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  activeTab: {
    backgroundColor: "#1976d2",
    borderColor: "#1976d2",
    shadowOpacity: 0.12,
  },
  tabText: {
    color: "#1976d2",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 6,
  },
  activeTabText: {
    color: "#fff",
  },
  requestItem: {
    padding: 12,
    marginBottom: 12,
    borderRadius: 10,
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: "#ccc",
  },
  infoContainer: {
    flex: 1,
  },
  senderName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  phoneText: {
    fontSize: 16,
    color: "#1976d2",
    fontWeight: "500",
    marginBottom: 2,
    marginTop: -4,
    letterSpacing: 0.5,
  },
  buttons: {
    flexDirection: "row",
    gap: 10,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15, // thêm dòng này nếu muốn các nút khác cũng to hơn
  },
  noRequests: {
    textAlign: "center",
    color: "#777",
    marginTop: 50,
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  friendStatusBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    marginRight: 8,
    minWidth: 90,
    alignItems: "center",
  },
  btnFriend: {
    backgroundColor: "#aaa",
  },
  btnUnfriend: {
    backgroundColor: "#DC3545",
  },
  btnRequest: {
    backgroundColor: "#007BFF",
  },
  btnViewProfile: {
    backgroundColor: "#1976d2",
  },
  btnDisabled: {
    backgroundColor: "#e0e0e0",
  },
  friendStatusText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 17
  },
});