import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
} from "react-native";
import {
  Text,
  TextInput,
  Button,
  Card,
  HelperText,
  useTheme,
  Modal,
  Portal,
  List,
} from "react-native-paper";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { navigate } from "../navigation/NavigationService";
import { login } from "../api/authApi";
import { saveAuthData } from "../utils/storage";
import { extractErrorMessage } from "../utils/common";
import { fetchAccounts } from "../services/accountsService";
import { encryptWithBackendKey } from "../services/rsaEncryptor";
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

  const [accounts, setAccounts] = useState<string[]>([]);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);

  useEffect(() => {
    if (Platform.OS === "android") {
      async function loadAccounts() {
        try {
          const accs = await fetchAccounts();
          const uniqueGmailAccounts: string[] = Array.from(
            new Set(accs.filter((acc) => acc.includes("gmail.com")))
          );
          setAccounts(uniqueGmailAccounts);
        } catch (e) {
          console.warn("Failed to fetch accounts:", e);
        }
      }
      loadAccounts();
    }
  }, []);

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
      const encryptedPassword = await encryptWithBackendKey(password);
      const response = await login(email, encryptedPassword);
      const token = response.data.token || "dummy-token";
      const userId = response.data?.userId || "";
      const username = response.data?.userName || "User";
      const userEmail = response.data?.userEmail || email;
      const role = response.data?.role || "User";
      const applicationId = response.data?.applicationId || "";
      const applicationName = response.data?.applicationName || "";
      const videoCount = response.data?.videoCount?.toString() ?? "0";
      const channelId = response.data?.channelId || "";

      await saveAuthData({
        accessToken: token,
        userId,
        userName: username,
        userEmail,
        role,
        applicationId,
        applicationName,
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
    <>
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        extraScrollHeight={50}
        enableOnAndroid={true}
        keyboardShouldPersistTaps="handled"
      >
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

            {/* Email Input */}
            <Text style={styles.inputLabel}>Email</Text>
            {Platform.OS === "android" && !manualEntry ? (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => !email && setBottomSheetVisible(true)}
              >
                <TextInput
                  value={email}
                  editable={false}
                  placeholder="Select an email"
                  mode="outlined"
                  style={[
                    styles.emailInput,
                    {
                      backgroundColor: email && colors.surfaceVariant,
                      opacity: email ? 0.6 : 1,
                    },
                  ]}
                  outlineColor={colors.outline}
                  activeOutlineColor={colors.primary}
                  error={!!emailError}
                  right={
                    !email ? <TextInput.Icon icon="menu-down" /> : undefined
                  }
                />
              </TouchableOpacity>
            ) : (
              <TextInput
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (text.trim()) setEmailError("");
                }}
                placeholder="Enter your email"
                mode="outlined"
                style={[styles.emailInput, { backgroundColor: colors.white }]}
                outlineColor={colors.inputBorder}
                activeOutlineColor={colors.primary}
                error={!!emailError}
              />
            )}
            <HelperText
              type="error"
              visible={!!emailError}
              style={{ paddingLeft: 0 }}
            >
              {emailError}
            </HelperText>

            {/* Password */}
            <Text style={[styles.inputLabel, styles.passwordLabel]}>
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
                importantForAutofill="yes"
                style={[
                  styles.passwordInput,
                  { backgroundColor: colors.white },
                ]}
                mode="outlined"
                outlineColor={colors.outline}
                activeOutlineColor={colors.primary}
                onSubmitEditing={handleSignIn}
                error={!!passwordError}
                right={
                  <TextInput.Icon
                    icon={showPassword ? "eye" : "eye-off"}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
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
      </KeyboardAwareScrollView>

      {/* Bottom Sheet only for Android */}
      {Platform.OS === "android" && (
        <Portal>
          <Modal
            visible={bottomSheetVisible}
            onDismiss={() => setBottomSheetVisible(false)}
            contentContainerStyle={[
              styles.bottomSheet,
              { backgroundColor: colors.surface },
            ]}
          >
            <Text style={styles.bottomSheetTitle}>Select Account</Text>
            {accounts.length === 0 ? (
              <Text style={{ textAlign: "center", padding: 10 }}>
                No accounts found
              </Text>
            ) : (
              <FlatList
                data={[...accounts, "None of the above"]}
                keyExtractor={(item, index) => `${item}-${index}`}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      if (item === "None of the above") {
                        setManualEntry(true);
                        setEmail("");
                      } else {
                        setEmail(item);
                        setManualEntry(false);
                      }
                      setBottomSheetVisible(false);
                      setEmailError("");
                    }}
                  >
                    <List.Item
                      title={item}
                      left={(props) => (
                        <List.Icon
                          {...props}
                          icon={
                            item === "None of the above" ? "pencil" : "account"
                          }
                        />
                      )}
                    />
                  </TouchableOpacity>
                )}
              />
            )}
          </Modal>
        </Portal>
      )}
    </>
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
  emailInput: {
    fontSize: 15,
  },
  passwordLabel: {
    marginTop: 5,
  },
  passwordWrapper: {
    position: "relative",
    justifyContent: "center",
  },
  passwordInput: {
    fontSize: 15,
  },
  forgot: {
    alignSelf: "flex-end",
    marginBottom: 12,
    marginTop: 4,
  },
  button: {
    borderRadius: 8,
  },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "50%",
    paddingBottom: 10,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginVertical: 10,
  },
});
