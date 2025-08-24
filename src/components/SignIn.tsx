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
      const userEmail = response.data?.userEmail || "";
      const role = response.data?.role || "User";
      const applicationId = response.data?.applicationId || "";
      const videoCount = response.data?.videoCount?.toString() ?? "0";
      const channelId = response.data?.channelId || "";

      await saveAuthData({
        accessToken: token,
        userId,
        userName: username,
        userEmail,
        role,
        applicationId,
        videoCount,
        channelId,
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

        {/* Email Label */}
        <Text style={[styles.inputLabel, { color: colors.placeholder }]}>
          Email
        </Text>
        <TextInput
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (text.trim()) setEmailError("");
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          name="email"
          importantForAutofill="yes"
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

        {/* Password Label */}
        <Text style={[styles.inputLabel, styles.passwordLabel, { color: colors.placeholder }]}>
          Password
        </Text>
        <View style={styles.passwordWrapper}>
          <TextInput
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (text.trim()) setPasswordError("");
            }}
            secureTextEntry={!showPassword}
            autoComplete="current-password"
            textContentType="password"
            name="password"
            importantForAutofill="yes"
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
  inputLabel: {
    fontSize: 15,         
    marginBottom: 4,
    fontWeight: "500",
  },
  input: {
    fontSize: 15,
  },
  passwordLabel: {
    marginTop: 5
  },
  passwordWrapper: {
    position: "relative",
    justifyContent: "center",
  },
  passwordInput: {
    fontSize: 15
  },
  eyeIcon: {
    position: "absolute",
    right: 4,
    top: 4,
    zIndex: 1,
  },
  forgot: {
    alignSelf: "flex-end",
    marginBottom: 12,
    marginTop: 4,
  },
  button: {
    borderRadius: 8,
  },
});
