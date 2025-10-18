import React, { useEffect, useState } from "react";
import {
  Image,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "react-native-paper";
import SignIn from "../components/SignIn";
import ForgotPassword from "../components/ForgotPassword";
import { usePlatformInfo } from "../hooks/usePlatformInfo";
import { AppTheme } from "../theme";

export default function LoginScreen() {
  const { isIOS } = usePlatformInfo();
  const [showSignInPage, setShowSignInPage] = useState(true);
  const [authError, setAuthError] = useState("");
  const theme = useTheme<AppTheme>();
  const { colors } = theme;

  useEffect(() => {
    setAuthError("");
  }, [showSignInPage]);

  return (
    <LinearGradient
      colors={[colors.gradientTop, colors.softYellow, colors.primaryLight]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={isIOS ? "padding" : undefined}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.innerContainer}>
              <Image
                source={require("../assets/images/logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />

              <View
                style={[
                  styles.formWrapper,
                  {
                    backgroundColor: colors.white,
                    borderColor: colors.outline,
                  },
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
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 32,
  },
  innerContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    maxWidth: 400,
  },
  logo: {
    width: 280,
    height: 250,
    marginBottom: 16,
  },
  formWrapper: {
    width: "100%",
    borderRadius: 12,
    borderWidth: 1,
  },
});
