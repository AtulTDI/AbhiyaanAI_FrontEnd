import React, { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { getAuthData } from "../utils/storage";

export default function AuthLoadingScreen() {
  const navigation = useNavigation<any>();

  useEffect(() => {
    const checkToken = async () => {
      try {
        const { accessToken } = await getAuthData();

        if (accessToken) {
          navigation.replace("App");
        } else {
          navigation.replace("Login");
        }
      } catch (e) {
        console.error("Token check failed", e);
        navigation.replace("Login");
      }
    };
    checkToken();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
