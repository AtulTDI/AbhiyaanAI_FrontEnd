import React, { useState } from "react";
import {
  Image,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from "react-native";
import { Text, TextInput, Button, Card, useTheme } from "react-native-paper";
import { useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useToast } from "../components/ToastProvider";
import { resetPassword } from "../api/authApi";
import { extractErrorMessage } from "../utils/common";
import { navigate } from "../navigation/NavigationService";
import { AppTheme } from "../theme";

type RouteParams = {
  token: string;
  email: string;
};

export default function ResetPasswordScreen() {
  const route = useRoute();
  const { token, email } = route.params as RouteParams;

  const theme = useTheme<AppTheme>();
  const { colors } = theme;
  const { showToast } = useToast();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      return showToast("Please fill in both password fields", "info");
    }

    if (newPassword !== confirmPassword) {
      return showToast("Passwords do not match", "warning");
    }

    try {
      setIsSubmitting(true);
      await resetPassword(email, token, newPassword);
      showToast("Password reset successful. Please log in", "success");

      setTimeout(() => {
        navigate("Login");
      }, 1000);
    } catch (error: any) {
      showToast(extractErrorMessage(error), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LinearGradient
      colors={[colors.gradientTop, colors.softYellow, colors.primaryLight]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
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

              <Card
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.white,
                    shadowColor: colors.shadow,
                  },
                ]}
              >
                <Card.Content>
                  <Text
                    variant="titleLarge"
                    style={[styles.title, { color: colors.onSurface }]}
                  >
                    Reset Your Password
                  </Text>

                  <Text
                    style={[
                      styles.subtitle,
                      { color: colors.onSurfaceVariant },
                    ]}
                  >
                    Resetting for: {email}
                  </Text>

                  <TextInput
                    label="New Password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                    mode="outlined"
                    style={[styles.input, { backgroundColor: colors.white }]}
                    outlineColor={colors.outline}
                    activeOutlineColor={colors.primary}
                  />

                  <TextInput
                    label="Confirm Password"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    mode="outlined"
                    style={[styles.input, { backgroundColor: colors.white }]}
                    outlineColor={colors.outline}
                    activeOutlineColor={colors.primary}
                  />

                  <Button
                    mode="contained"
                    onPress={handleResetPassword}
                    loading={isSubmitting}
                    disabled={isSubmitting}
                    style={styles.button}
                    contentStyle={{ paddingVertical: 8 }}
                  >
                    Reset Password
                  </Button>
                </Card.Content>
              </Card>
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
  card: {
    width: "100%",
    borderRadius: 12,
    elevation: 4,
    borderWidth: 1,
  },
  title: {
    textAlign: "center",
    marginBottom: 8,
    fontWeight: "600",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 20,
    fontSize: 14,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    borderRadius: 8,
    marginTop: 8,
  },
});
