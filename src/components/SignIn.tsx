import { useState } from "react";
import { View, StyleSheet } from "react-native";
import {
  Text,
  TextInput,
  Button,
  IconButton,
  Card,
  useTheme,
  HelperText,
} from "react-native-paper";
import { navigate } from "../navigation/NavigationService";
import { login } from "../api/authApi";
import { saveAuthData } from "../utils/storage";
import { extractErrorMessage } from "../utils/common";
import { AppTheme } from "../theme";

type SignInProps = {
  authError: string;
  setAuthError: (error: string) => void;
  setShowSignInPage: (show: boolean) => void;
};

export default function SignIn({
  authError,
  setAuthError,
  setShowSignInPage,
}: SignInProps) {
  const theme = useTheme<AppTheme>();
  const { colors } = theme;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    let hasError = false;
    setEmailError("");
    setPasswordError("");

    if (!email.trim()) {
      setEmailError("Email is required.");
      hasError = true;
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      setEmailError("Invalid email format.");
      hasError = true;
    }

    if (!password.trim()) {
      setPasswordError("Password is required.");
      hasError = true;
    }

    return !hasError;
  };

  const handleSignIn = async () => {
    if (!validate()) return;

    setIsLoading(true);
    setAuthError("");

    try {
      const response = await login(email, password);
      const token = response.data.token || "dummy-token";
      const userId = response.data?.userId || "";
      const username = response.data?.userName || "User";
      const role = response.data?.role || "User";
      const applicationId = response.data?.applicationId || "";
      const videoCount = response.data?.videoCount?.toString() ?? "0";

      await saveAuthData({
        accessToken: token,
        userId,
        userName: username,
        role,
        applicationId,
        videoCount,
      });

      navigate("App");
    } catch (error: any) {
      setAuthError(extractErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
          Sign In
        </Text>

        {authError ? <Text style={styles.error}>{authError}</Text> : null}

        {/* Email Field */}
        <TextInput
          label="Email"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (text.trim()) setEmailError("");
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          style={[styles.input, { backgroundColor: colors.white }]}
          mode="outlined"
          outlineColor={colors.inputBorder}
          activeOutlineColor={colors.primary}
          error={!!emailError}
        />
        <HelperText
          type="error"
          visible={!!emailError}
          style={{ paddingLeft: 0 }}
        >
          {emailError}
        </HelperText>

        {/* Password Field */}
        <View style={styles.passwordWrapper}>
          <TextInput
            label="Password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (text.trim()) setPasswordError("");
            }}
            secureTextEntry={!showPassword}
            style={[styles.passwordInput, { backgroundColor: colors.white }]}
            mode="outlined"
            outlineColor={colors.outline}
            activeOutlineColor={colors.primary}
            error={!!passwordError}
          />
          <IconButton
            icon={showPassword ? "eye" : "eye-off"}
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          />
        </View>
        <HelperText
          type="error"
          visible={!!passwordError}
          style={{ paddingLeft: 0 }}
        >
          {passwordError}
        </HelperText>

        <Button
          onPress={() => setShowSignInPage(false)}
          mode="text"
          contentStyle={{ justifyContent: "flex-end" }}
          style={styles.forgot}
          labelStyle={{ color: colors.primary }}
        >
          Forgot Password?
        </Button>

        <Button
          mode="contained"
          onPress={handleSignIn}
          loading={isLoading}
          disabled={isLoading}
          style={[styles.button, { backgroundColor: colors.primary }]}
          contentStyle={{ paddingVertical: 8 }}
        >
          {isLoading ? "Signing In..." : "Sign In"}
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
    paddingVertical: 12,
  },
  title: {
    textAlign: "center",
    marginBottom: 16,
    fontWeight: "600",
  },
  error: {
    color: "red",
    marginBottom: 12,
    textAlign: "center",
  },
  input: {
    marginBottom: 0,
  },
  passwordWrapper: {
    position: "relative",
    justifyContent: "center",
  },
  passwordInput: {
    marginBottom: 0,
  },
  eyeIcon: {
    position: "absolute",
    right: 4,
    top: 4,
    zIndex: 1,
  },
  forgot: {
    alignSelf: "flex-end",
    marginBottom: 16,
    marginTop: 4,
  },
  button: {
    borderRadius: 8,
    marginTop: 8,
  },
});
