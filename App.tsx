import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { I18nextProvider } from 'react-i18next';

import i18n from './i18n';
import EpicScannerScreen from './src/components/EpicScannerScreen';
import { ToastProvider } from './src/components/ToastProvider';
import { VideoPreviewProvider } from './src/components/VideoPreviewContext';
import AppLayout from './src/navigation/AppLayout';
import { navigationRef } from './src/navigation/NavigationService';
import AuthLoadingScreen from './src/screens/AuthLoadingScreen';
import LoginScreen from './src/screens/LoginScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import { customTheme } from './src/theme';
import { RootStackParamList } from './src/types';
import prefixes from './src/utils/deeplinks';

import './src/styles/global.css';

const Stack = createNativeStackNavigator<RootStackParamList>();
const rootSafeAreaStyle = { flex: 1, backgroundColor: 'white' };

const linking = {
  prefixes,
  config: {
    screens: {
      AuthLoading: 'authloading',
      Login: 'login',
      App: 'app',
      ResetPasswordScreen: {
        path: 'Account/resetpassword',
        parse: {
          token: (token: string) => token,
          email: (email: string) => email
        }
      }
    }
  }
};

export default function App() {
  return (
    <SafeAreaProvider>
      <I18nextProvider i18n={i18n}>
        <PaperProvider theme={customTheme}>
          <ToastProvider>
            <VideoPreviewProvider>
              <NavigationContainer ref={navigationRef} linking={linking}>
                <SafeAreaView style={rootSafeAreaStyle}>
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
                    <Stack.Screen name="EpicScanner" component={EpicScannerScreen} />
                  </Stack.Navigator>
                </SafeAreaView>
              </NavigationContainer>
            </VideoPreviewProvider>
          </ToastProvider>
        </PaperProvider>
      </I18nextProvider>
    </SafeAreaProvider>
  );
}
