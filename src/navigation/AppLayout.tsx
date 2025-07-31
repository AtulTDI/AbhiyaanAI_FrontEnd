import { useEffect, useState } from "react";
import { TouchableOpacity, useWindowDimensions, View } from "react-native";
import { Avatar, useTheme } from "react-native-paper";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import { getItem, removeItem } from "../utils/storage";
import { navigate } from "./NavigationService";
import { stopConnection } from "../services/signalrService";
import AddUserScreen from "../screens/AddUserScreen";
import UploadVideoScreen from "../screens/UploadVideoScreen";
import AddVoterScreen from "../screens/AddVoterScreen";
import GenerateVideoScreen from "../screens/GenerateVideoScreen";
import GeneratedVideoScreen from "../screens/GeneratedVideosScreen";
import AddApplicationScreen from "../screens/AddApplicationScreen";
import CustomDrawer from "../components/CustomDrawer";
import CustomLabel from "../components/CustomLabel";
import { AppTheme } from "../theme";

const Drawer = createDrawerNavigator();

export default function AppLayout() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;
  const theme = useTheme<AppTheme>();
  const { colors } = theme;

  const [userName, setUserName] = useState("");
  const [role, setRole] = useState<"Admin" | "User" | "SuperAdmin" | null>(
    null
  );

  useEffect(() => {
    (async () => {
      const name = await getItem("userName");
      const storedRole = await getItem("role");
      if (name) setUserName(name);
      if (
        storedRole === "Admin" ||
        storedRole === "SuperAdmin" ||
        storedRole === "User"
      ) {
        setRole(storedRole);
      }
    })();
  }, []);

  const handleLogout = async () => {
    try {
      stopConnection();
      await removeItem("accessToken");
      await removeItem("userName");
      await removeItem("role");
    } catch (error: any) {
      const msg = error?.response?.data?.error || "Something went wrong.";
      alert(msg);
    } finally {
      navigate("Login");
    }
  };

  const headerRightComponent = () => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        marginRight: 10,
        gap: 12,
      }}
    >
      <TouchableOpacity onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={28} color={colors.primary} />
      </TouchableOpacity>
      <Avatar.Text
        label={userName?.charAt(0)}
        size={32}
        style={{ backgroundColor: colors.primary }}
        labelStyle={{ color: colors.onPrimary }}
      />
    </View>
  );

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
                    label="Applications"
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
          )}
          
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
                  label="Users"
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
                    label="Upload Base Video"
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
                  label="Voters"
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
