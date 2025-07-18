import { View, Image, StyleSheet, SafeAreaView, Platform } from "react-native";
import {
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "react-native-paper";
import { AppTheme } from "../theme";

export default function CustomDrawer(props: any) {
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  const { colors } = theme;

  return (
    <LinearGradient
      colors={[
        colors.gradientTop,
        colors.softOrange,
        colors.primaryLight,
        colors.primaryLight,
        colors.primary,
      ]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.logoContainer}>
          <Image
            source={require("../assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <DrawerContentScrollView
          {...props}
          contentContainerStyle={styles.scrollContainer}
        >
          <View style={styles.drawerItemsContainer}>
            <DrawerItemList
              {...props}
              labelStyle={[
                styles.drawerLabel,
                { color: colors.onPrimary },
              ]}
              activeTintColor={colors.onPrimary}
              inactiveTintColor={colors.onPrimary}
            />
          </View>
        </DrawerContentScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    gradient: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
      paddingTop: Platform.OS === "android" ? 32 : 0,
    },
    logoContainer: {
      alignItems: "center",
      paddingTop: 24,
      borderBottomWidth: 1,
      borderColor: theme.colors.primaryLight,
      marginHorizontal: 16,
    },
    logo: {
      width: 220,
      height: 200,
    },
    scrollContainer: {
      paddingTop: 0,
    },
    drawerItemsContainer: {
      marginTop: 24,
      paddingHorizontal: 12,
    },
    drawerLabel: {
      fontSize: 16,
      fontWeight: "500",
    },
  });
