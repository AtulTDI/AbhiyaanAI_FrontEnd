import AsyncStorage from "@react-native-async-storage/async-storage";

export const setItem = async (key: string, value: string) => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (err) {
    console.error("Set storage error:", err);
  }
};

export const getItem = async (key: string) => {
  try {
    return await AsyncStorage.getItem(key);
  } catch (err) {
    console.error("Get storage error:", err);
    return null;
  }
};

export const removeItem = async (key: string) => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (err) {
    console.error("Remove storage error:", err);
  }
};