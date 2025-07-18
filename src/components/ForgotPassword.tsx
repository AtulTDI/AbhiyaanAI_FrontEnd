import { useState } from "react";
import { StyleSheet } from "react-native";
import { Text, TextInput, Button, Card, useTheme } from "react-native-paper";
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
  const { colors } = theme;
  const [email, setEmail] = useState("");

  const handleReset = () => {
    if (!email) return alert("Please enter your email.");
    alert(`Password reset link sent to ${email}`);
  };

  return (
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
        />

        <Button
          mode="contained"
          onPress={handleReset}
          style={styles.button}
          contentStyle={{ paddingVertical: 8 }}
        >
          Send Reset Link
        </Button>

        <Button
          mode="text"
          onPress={() => setShowSignInPage(true)}
          labelStyle={{ color: colors.primary }}
        >
          ← Back to Login
        </Button>
      </Card.Content>
    </Card>
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
