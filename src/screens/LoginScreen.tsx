import React, { useEffect, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View
} from 'react-native';
import { useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';

import ForgotPassword from '../components/ForgotPassword';
import SignIn from '../components/SignIn';
import { usePlatformInfo } from '../hooks/usePlatformInfo';
import { AppTheme } from '../theme';
import { getBrandAssets } from '../utils/brandAssets';

const Wrapper = Platform.OS === 'web' ? View : KeyboardAvoidingView;

export default function LoginScreen() {
  const { isIOS } = usePlatformInfo();
  const { icon } = getBrandAssets();
  const [showSignInPage, setShowSignInPage] = useState(true);
  const [authError, setAuthError] = useState('');
  const theme = useTheme<AppTheme>();
  const { colors } = theme;

  useEffect(() => {
    setAuthError('');
  }, [showSignInPage]);

  return (
    <LinearGradient
      colors={[colors.gradientTop, colors.softYellow, colors.primaryLight]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <Wrapper behavior={isIOS ? 'padding' : undefined} style={styles.flex}>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.innerContainer}>
              <Image source={icon} style={styles.logo} resizeMode="contain" />

              <View
                style={[
                  styles.formWrapper,
                  {
                    backgroundColor: colors.white,
                    borderColor: colors.outline
                  }
                ]}
              >
                {showSignInPage ? (
                  <SignIn
                    authError={authError}
                    setAuthError={setAuthError}
                    setShowSignInPage={setShowSignInPage}
                  />
                ) : (
                  <ForgotPassword
                    authError={authError}
                    setAuthError={setAuthError}
                    setShowSignInPage={setShowSignInPage}
                  />
                )}
              </View>
            </View>
          </ScrollView>
        </Wrapper>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1
  },
  safeArea: {
    flex: 1
  },
  flex: {
    flex: 1
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 32
  },
  innerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 400
  },
  logo: {
    width: 280,
    height: 250,
    marginBottom: 16
  },
  formWrapper: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1
  }
});
