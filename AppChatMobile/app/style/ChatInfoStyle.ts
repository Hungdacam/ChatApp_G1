
import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 10,
  },
  avatarSection: {
    alignItems: "center",
    padding: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  changeAvatarText: {
    color: "#007AFF",
    textAlign: "center",
    marginBottom: 10,
  },
  chatName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  actionButton: {
    alignItems: "center",
  },
  buttonText: {
    fontSize: 12,
    color: "#007AFF",
    textAlign: "center",
    marginTop: 5,
  },
  searchSection: {
    paddingHorizontal: 15,
    marginVertical: 10,
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 15,
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tabButton: {
    alignItems: "center",
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: "#007AFF",
  },
  tabText: {
    fontSize: 12,
    color: "#666",
  },
  activeTabText: {
    color: "#007AFF",
    fontWeight: "bold",
  },
  mediaSection: {
    flex: 1,
    paddingHorizontal: 15,
    marginTop: 10,
  },
  mediaItem: {
    width: 100,
    height: 100,
    margin: 5,
  },
  mediaImage: {
    width: 100,
    height: 100,
    borderRadius: 5,
  },
  mediaVideo: {
    width: 100,
    height: 100,
    borderRadius: 5,
  },
  mediaFileText: {
    fontSize: 14,
    color: "#007AFF",
    textDecorationLine: "underline",
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    marginTop: 20,
  },
  imageModal: {
    margin: 0,
  },
  videoModal: {
    margin: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenVideo: {
    width: "100%",
    height: 300,
  },
  filePreviewContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
    padding: 5,
    borderRadius: 5,
    width: 150,
    justifyContent: "center",
  },
  filePreviewIcon: {
    width: 40,
    height: 40,
    marginBottom: 5,
  },
  fileInfo: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  fileNameText: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "left",
    color: "#333",
  },
  fileDetails: {
    fontSize: 12,
    textAlign: "center",
    color: "#888",
  },
});