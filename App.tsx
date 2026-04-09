import { useEffect } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import NetInfo from '@react-native-community/netinfo';
import { I18nextProvider } from 'react-i18next';

import i18n from './i18n';
import EpicScannerScreen from './src/components/EpicScannerScreen';
import { ToastProvider } from './src/components/ToastProvider';
import { VideoPreviewProvider } from './src/components/VideoPreviewContext';
import { initDB } from './src/db/database';
import AppLayout from './src/navigation/AppLayout';
import { navigationRef } from './src/navigation/NavigationService';
import AuthLoadingScreen from './src/screens/AuthLoadingScreen';
import DebugScreen from './src/screens/DebugScreen';
import LoginScreen from './src/screens/LoginScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import { syncData } from './src/services/syncService';
import { customTheme } from './src/theme';
import { RootStackParamList } from './src/types';
import prefixes from './src/utils/deeplinks';
import { logger } from './src/utils/logger';

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
  useEffect(() => {
    let isSyncing = false;

    const safeSync = async () => {
      if (isSyncing) return;
      try {
        isSyncing = true;
        await syncData();
      } catch (error) {
        logger.error('Sync error', error);
      } finally {
        isSyncing = false;
      }
    };

    const setup = async () => {
      await initDB();

      const unsubscribe = NetInfo.addEventListener((state) => {
        logger.log(
          `[App] network state changed — connected: ${state.isConnected}, reachable: ${state.isInternetReachable}`
        );

        if (state.isConnected && state.isInternetReachable) {
          logger.log('[App] internet back → triggering sync');
          safeSync();
        }
      });

      await safeSync();

      return unsubscribe;
    };

    let unsubscribeNetInfo: (() => void) | undefined;

    setup()
      .then((unsubscribe) => {
        unsubscribeNetInfo = unsubscribe;
      })
      .catch((error) => {
        logger.error('App setup error', error);
      });

    return () => {
      unsubscribeNetInfo?.();
    };
  }, []);

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
                    <Stack.Screen name="Debug" component={DebugScreen} />
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
