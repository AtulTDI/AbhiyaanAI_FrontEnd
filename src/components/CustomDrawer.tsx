import React, { useCallback, useEffect, useState } from "react";
import { View, Image, StyleSheet, SafeAreaView, Platform } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "react-native-paper";
import { getBrandAssets } from "../utils/brandAssets";
import { getAuthData } from "../utils/storage";
import { eventBus } from "../utils/eventBus";
import { AppTheme } from "../theme";

export default function CustomDrawer(props: any) {
  const { icon } = getBrandAssets();
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  const { colors } = theme;

  const [candidatePhotoPath, setCandidatePhotoPath] = useState<string | null>(
    null,
  );

  const loadAuthPhoto = async () => {
    try {
      const data = await getAuthData();
      setCandidatePhotoPath(data?.candidatePhotoPath || null);
    } catch (e) {
      console.error("Failed to load auth data", e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadAuthPhoto();
    }, []),
  );

  useEffect(() => {
    const updatePhoto = (newPath: string) => {
      setCandidatePhotoPath((prev) => {
        if (!prev) return newPath;

        const cleanPrev = prev.split("?")[0];

        if (cleanPrev === newPath) {
          return `${newPath}?t=${Date.now()}`;
        }

        return newPath;
      });
    };

    eventBus.on("CANDIDATE_PHOTO_UPDATED", updatePhoto);
    return () => eventBus.off("CANDIDATE_PHOTO_UPDATED", updatePhoto);
  }, []);

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
          {candidatePhotoPath ? (
            <View style={styles.photoWrapper}>
              <Image
                source={{ uri: candidatePhotoPath }}
                style={styles.candidatePhoto}
                resizeMode="cover"
              />
            </View>
          ) : (
            <Image source={icon} style={styles.logo} resizeMode="contain" />
          )}
        </View>

        <DrawerContentScrollView
          {...props}
          contentContainerStyle={styles.scrollContainer}
        >
          <View style={styles.drawerItemsContainer}>
            <DrawerItemList
              {...props}
              labelStyle={[styles.drawerLabel, { color: colors.onPrimary }]}
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
      marginHorizontal: 16,
    },
    logo: {
      width: 220,
      height: 200,
    },
    photoWrapper: {
      width: 130,
      height: 130,
      borderRadius: 65,
      overflow: "hidden",
      borderWidth: 3,
      borderColor: "rgba(255,255,255,0.85)",
      backgroundColor: "rgba(255,255,255,0.08)",
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOpacity: 0.25,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },
    candidatePhoto: {
      width: "100%",
      height: "100%",
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
