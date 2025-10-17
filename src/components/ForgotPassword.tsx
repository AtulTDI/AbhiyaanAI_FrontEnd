import React, { useState, useEffect } from "react";
import { StyleSheet, Platform } from "react-native";
import { Text, TextInput, Button, Card, useTheme } from "react-native-paper";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useToast } from "./ToastProvider";
import { forgotPasswordLink } from "../api/authApi";
import { extractErrorMessage } from "../utils/common";
import { AppTheme } from "../theme";

type ForgotPasswordProps = {
  authError: string;
  setAuthError: (error: string) => void;
  setShowSignInPage: (show: boolean) => void;
};

export default function ForgotPassword({
  setShowSignInPage,
}: ForgotPasswordProps) {
  const theme = useTheme<AppTheme>();
  const { showToast } = useToast();
  const { colors } = theme;
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (Platform.OS === "web") {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Enter") {
          e.preventDefault();
          handleReset();
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [email]);

  const handleReset = async () => {
    if (!email) return showToast("Please enter your email", "info");

    try {
      setIsLoading(true);
      await forgotPasswordLink(email);
      showToast(`Password reset link sent to ${email}`, "success");
    } catch (error: any) {
      showToast(extractErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
      extraScrollHeight={50}
      enableOnAndroid
      keyboardShouldPersistTaps="handled"
    >
      <Card
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            shadowColor: colors.shadow,
          },
        ]}
      >
        <Card.Content>
          <Text
            variant="titleLarge"
            style={[styles.title, { color: colors.onSurface }]}
          >
            Forgot Password
          </Text>

          <TextInput
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            mode="outlined"
            style={[styles.input, { backgroundColor: colors.white }]}
            outlineColor={colors.outline}
            activeOutlineColor={colors.primary}
            onSubmitEditing={handleReset} // ✅ Works for mobile
            blurOnSubmit={true}
            returnKeyType="done"
          />

          <Button
            mode="contained"
            onPress={handleReset}
            loading={isLoading}
            disabled={isLoading}
            style={styles.button}
            contentStyle={{ paddingVertical: 8 }}
          >
            Send Reset Link
          </Button>

          <Button
            mode="text"
            onPress={() => !isLoading && setShowSignInPage(true)}
            labelStyle={{ color: colors.primary }}
          >
            ← Back to Login
          </Button>
        </Card.Content>
      </Card>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
    borderRadius: 12,
    elevation: 4,
  },
  title: {
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "600",
  },
  input: {
    marginBottom: 16,
  },
  button: {
    borderRadius: 8,
    marginBottom: 16,
  },
});
