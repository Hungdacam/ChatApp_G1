import { StyleSheet } from "react-native";
export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f8fa",
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginTop: 36,
    marginBottom: 10, // giảm margin dưới
    color: "#222",
    textAlign: "center",
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 18,
    marginTop: 6, // thêm marginTop nếu muốn
    alignSelf: "center",
    borderColor: "#FFA500",
    borderWidth: 3,
    backgroundColor: "#e3eaf2",
  },
  infoBox: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 22,
    marginBottom: 24, // giảm margin dưới
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    alignItems: "flex-start",
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "center",
  },
  infoLabel: {
    color: "#1976d2",
    fontWeight: "bold",
    fontSize: 16,
    minWidth: 90,
  },
  infoValue: {
    color: "#222",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 4,
  },
  button: {
    width: "90%",
    alignSelf: "center",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10, // thêm marginTop để cách infoBox
    backgroundColor: "#28A745",
    shadowColor: "#1976d2",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 17,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "90%",
    marginTop: 10,
    gap: 12,
  },
  buttonGray: {
    backgroundColor: "#6C757D",
  },
  buttonRed: {
    backgroundColor: "#DC3545",
  },
  buttonGreen: {
    backgroundColor: "#28A745",
  },
});