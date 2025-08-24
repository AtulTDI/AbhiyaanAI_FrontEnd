import React from "react";
import { Provider as PaperProvider } from "react-native-paper";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { navigationRef } from "./src/navigation/NavigationService";
import { RootStackParamList } from "./src/types";
import { customTheme } from "./src/theme";
import { ToastProvider } from "./src/components/ToastProvider";
import { VideoPreviewProvider } from "./src/components/VideoPreviewContext";
import prefixes from "./src/utils/deeplinks";
import LoginScreen from "./src/screens/LoginScreen";
import AppLayout from "./src/navigation/AppLayout";
import AuthLoadingScreen from "./src/screens/AuthLoadingScreen";
import ResetPasswordScreen from "./src/screens/ResetPasswordScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

const linking = {
  prefixes,
  config: {
    screens: {
      AuthLoading: "authloading",
      Login: "login",
      App: "app",
      ResetPasswordScreen: {
        path: "Account/resetpassword",
        parse: {
          token: (token: string) => token,
          email: (email: string) => email,
        },
      },
    },
  },
};

export default function App() {
  return (
    <PaperProvider theme={customTheme}>
      <ToastProvider>
        <VideoPreviewProvider>
          <NavigationContainer ref={navigationRef} linking={linking}>
            <Stack.Navigator
              id={undefined}
              initialRouteName="AuthLoading"
              screenOptions={{ headerShown: false }}
            >
              <Stack.Screen name="AuthLoading" component={AuthLoadingScreen} />
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="App" component={AppLayout} />
              <Stack.Screen
                name="ResetPasswordScreen"
                component={ResetPasswordScreen}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </VideoPreviewProvider>
      </ToastProvider>
    </PaperProvider>
  );
}
