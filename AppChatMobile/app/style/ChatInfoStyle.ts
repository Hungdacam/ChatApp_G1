import { StyleSheet, Dimensions } from "react-native";
const { width } = Dimensions.get("window");
const IMAGE_SIZE = (width - 15 * 2 - 16) / 3; // paddingHorizontal*2 + margin*4
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
    marginVertical: 4,
    marginHorizontal: 4,
    // width sẽ set động ở renderMediaItem
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  mediaImage: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 8,
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
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    width: "90%",
    backgroundColor: "#f5f7fa",
    marginVertical: 12,
    marginHorizontal: "5%",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
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