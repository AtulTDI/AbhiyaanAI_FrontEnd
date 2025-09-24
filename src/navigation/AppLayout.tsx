import React from "react";
import { useEffect, useState } from "react";
import { TouchableOpacity, useWindowDimensions, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import { clearAuthData, getAuthData } from "../utils/storage";
import { navigate } from "./NavigationService";
import { stopConnection } from "../services/signalrService";
import AddUserScreen from "../screens/AddUserScreen";
import UploadVideoScreen from "../screens/UploadVideoScreen";
import AddVoterScreen from "../screens/AddVoterScreen";
import AddSenderScreen from "../screens/AddSenderScreen";
import GenerateVideoScreen from "../screens/GenerateVideoScreen";
import GeneratedVideoScreen from "../screens/GeneratedVideosScreen";
import AddApplicationScreen from "../screens/AddApplicationScreen";
import ActivateSenderScreen from "../screens/ActivateSenderScreen";
import ProcessingVideosScreen from "../screens/ProcessingVideosScreen";
import CustomDrawer from "../components/CustomDrawer";
import CustomLabel from "../components/CustomLabel";
import UserAvatarMenu from "../components/UserAvatarMenu";
import LanguageSelector from "../components/LanguageSelector";
import { AppTheme } from "../theme";

const Drawer = createDrawerNavigator();

export default function AppLayout() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;
  const theme = useTheme<AppTheme>();
  const { colors } = theme;

  const [userName, setUserName] = useState("");
  const [role, setRole] = useState<
    "Admin" | "User" | "SuperAdmin" | "Sender" | null
  >(null);
  const [userEmail, setUserEmail] = useState("");
  const [videoCount, setVideoCount] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const {
        userName: name,
        userEmail: email,
        role: storedRole,
        videoCount: count,
      } = await getAuthData();

      if (name) setUserName(name);
      if (email) setUserEmail(email);
      if (
        storedRole === "Admin" ||
        storedRole === "SuperAdmin" ||
        storedRole === "User" ||
        storedRole === "Sender"
      ) {
        setRole(storedRole);
      }

      if (count !== undefined && !isNaN(Number(count))) {
        setVideoCount(Number(count));
      }
    })();
  }, []);

  const handleLogout = async () => {
    try {
      stopConnection();
      await clearAuthData();
    } catch (error: any) {
      const msg = error?.response?.data?.error || "Something went wrong.";
      alert(msg);
    } finally {
      navigate("Login");
    }
  };

  const getCountColor = () => {
    if (videoCount >= 5000) return colors.success;
    if (videoCount > 1000) return colors.warning;
    return colors.error;
  };

  const headerRightComponent = () => {
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginRight: 10,
          gap: 12,
        }}
      >

        {/* <LanguageSelector /> */}

        {role === "Admin" && videoCount !== null && (
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: getCountColor(),
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 5,
              shadowColor: colors.black,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 3,
              elevation: 3,
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name="videocam"
              size={18}
              color={colors.white}
              style={{ marginRight: 6 }}
            />
            <Text
              style={{
                color: colors.white,
                fontSize: 14,
                fontWeight: "600",
              }}
            >
              {videoCount}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={28} color={colors.primary} />
        </TouchableOpacity>

        <UserAvatarMenu userName={userName} email={userEmail} role={role} />
      </View>
    );
  };

  if (!role) return null;

  return (
    <Drawer.Navigator
      id={undefined}
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={{
        drawerType: isLargeScreen ? "permanent" : "front",
        headerShown: !isLargeScreen,
        headerLeft: isLargeScreen ? () => null : undefined,
        drawerActiveTintColor: colors.primary,
        drawerLabelStyle: {
          marginLeft: -16,
          fontSize: 16,
        },
        drawerActiveBackgroundColor: "transparent",
        drawerItemStyle: {
          height: 48,
          justifyContent: "center",
          paddingVertical: 0,
          marginVertical: 5,
        },
      }}
    >
      {(role === "Admin" || role === "SuperAdmin") && (
        <>
          {role === "SuperAdmin" && (
            <>
              <Drawer.Screen
                name="AddDistributor"
                children={() => <AddUserScreen role="Distributor" />}
                options={{
                  headerShown: true,
                  headerTitle: "",
                  headerRight: headerRightComponent,
                  drawerLabel: (props) => (
                    <CustomLabel
                      {...props}
                      label={t('distributorTabLabel')}
                      icon={
                        <Ionicons
                          name="people-outline"
                          size={20}
                          color={props.color || colors.onPrimary}
                        />
                      }
                    />
                  ),
                }}
              />

              <Drawer.Screen
                name="AddApplication"
                component={AddApplicationScreen}
                options={{
                  headerShown: true,
                  headerTitle: "",
                  headerRight: headerRightComponent,
                  drawerLabel: (props) => (
                    <CustomLabel
                      {...props}
                      label={t('application.plural')}
                      icon={
                        <Ionicons
                          name="apps"
                          size={20}
                          color={props.color || colors.onPrimary}
                        />
                      }
                    />
                  ),
                }}
              />

              <Drawer.Screen
                name="AddAdmin"
                children={() => <AddUserScreen role="Admin" />}
                options={{
                  headerShown: true,
                  headerTitle: "",
                  headerRight: headerRightComponent,
                  drawerLabel: (props) => (
                    <CustomLabel
                      {...props}
                      label={t('customerAdminTabLabel')}
                      icon={
                        <Ionicons
                          name="people-outline"
                          size={20}
                          color={props.color || colors.onPrimary}
                        />
                      }
                    />
                  ),
                }}
              />
            </>
          )}

          {role === "Admin" && (
            <Drawer.Screen
              name="AddUser"
              component={AddUserScreen}
              options={{
                headerShown: true,
                headerTitle: "",
                headerRight: headerRightComponent,
                drawerLabel: (props) => (
                  <CustomLabel
                    {...props}
                    label={t("userTabLabel")}
                    icon={
                      <Ionicons
                        name="people-outline"
                        size={20}
                        color={props.color || colors.onPrimary}
                      />
                    }
                  />
                ),
              }}
            />
          )}

          {role === "Admin" && (
            <Drawer.Screen
              name="ActivateSender"
              component={ActivateSenderScreen}
              options={{
                headerShown: true,
                headerTitle: "",
                headerRight: headerRightComponent,
                drawerLabel: (props) => (
                  <CustomLabel
                    {...props}
                    label={t("activateSenderTabLabel")}
                    icon={
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={20}
                        color={props.color || colors.onPrimary}
                      />
                    }
                  />
                ),
              }}
            />
          )}

          {role === "Admin" && (
            <Drawer.Screen
              name="Upload"
              component={UploadVideoScreen}
              options={{
                headerShown: true,
                headerTitle: "",
                headerRight: headerRightComponent,
                drawerLabel: (props) => (
                  <CustomLabel
                    {...props}
                    label={t("uploadBaseVideoTabLabel")}
                    icon={
                      <Ionicons
                        name="cloud-upload"
                        size={20}
                        color={props.color || colors.onPrimary}
                      />
                    }
                  />
                ),
              }}
            />
          )}
        </>
      )}

      {role === "User" && (
        <>
          <Drawer.Screen
            name="AddVoter"
            component={AddVoterScreen}
            options={{
              headerShown: true,
              headerTitle: "",
              headerRight: headerRightComponent,
              drawerLabel: (props) => (
                <CustomLabel
                  {...props}
                  label="Voter(s)"
                  icon={
                    <Ionicons
                      name="people-outline"
                      size={20}
                      color={props.color || colors.onPrimary}
                    />
                  }
                />
              ),
            }}
          />

          <Drawer.Screen
            name="AddSender"
            component={AddSenderScreen}
            options={{
              headerShown: true,
              headerTitle: "",
              headerRight: headerRightComponent,
              drawerLabel: (props) => (
                <CustomLabel
                  {...props}
                  label="Sender(s)"
                  icon={
                    <Ionicons
                      name="paper-plane-outline"
                      size={20}
                      color={props.color || colors.onPrimary}
                    />
                  }
                />
              ),
            }}
          />

          <Drawer.Screen
            name="Generate"
            component={GenerateVideoScreen}
            options={{
              headerShown: true,
              headerTitle: "",
              headerRight: headerRightComponent,
              drawerLabel: (props) => (
                <CustomLabel
                  {...props}
                  label="Generate Video(s)"
                  icon={
                    <Ionicons
                      name="sparkles-outline"
                      size={20}
                      color={props.color || colors.onPrimary}
                    />
                  }
                />
              ),
            }}
          />

          <Drawer.Screen
            name="Processing"
            component={ProcessingVideosScreen}
            options={{
              headerShown: true,
              headerTitle: "",
              headerRight: headerRightComponent,
              drawerLabel: (props) => (
                <CustomLabel
                  {...props}
                  label="Processing Video(s)"
                  icon={
                    <Ionicons
                      name="time-outline"
                      size={20}
                      color={props.color || colors.onPrimary}
                    />
                  }
                />
              ),
            }}
          />

          <Drawer.Screen
            name="Generated"
            component={GeneratedVideoScreen}
            options={{
              headerShown: true,
              headerTitle: "",
              headerRight: headerRightComponent,
              drawerLabel: (props) => (
                <CustomLabel
                  {...props}
                  label="Generated Video(s)"
                  icon={
                    <Ionicons
                      name="film-outline"
                      size={20}
                      color={props.color || colors.onPrimary}
                    />
                  }
                />
              ),
            }}
          />
        </>
      )}

      {role === "Sender" && (
        <>
          <Drawer.Screen
            name="Generated"
            component={GeneratedVideoScreen}
            options={{
              headerShown: true,
              headerTitle: "",
              headerRight: headerRightComponent,
              drawerLabel: (props) => (
                <CustomLabel
                  {...props}
                  label="Generated Video(s)"
                  icon={
                    <Ionicons
                      name="film-outline"
                      size={20}
                      color={props.color || colors.onPrimary}
                    />
                  }
                />
              ),
            }}
          />
        </>
      )}
    </Drawer.Navigator>
  );
}
