// styles/Login.style.ts
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    width: 250,
    height: 250,
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 30,
  },
  titleText: {
    fontSize: 50,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
  },
  sloganText: {
    color: '#A9A9A9',
    fontSize: 17,
  },
  buttonLogin: {
    alignItems: 'center',
    marginTop: 60,
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
    marginHorizontal: 20,
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
  privacyContainer: {
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

export default styles;
