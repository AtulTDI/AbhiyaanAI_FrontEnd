import React, { useCallback, useEffect, useState } from 'react';
import { Image, Platform, SafeAreaView, StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';

import { LinearGradient } from 'expo-linear-gradient';
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerItemList
} from '@react-navigation/drawer';
import { useFocusEffect } from '@react-navigation/native';

import { AppTheme } from '../theme';
import { getBrandAssets } from '../utils/brandAssets';
import { eventBus } from '../utils/eventBus';
import { logger } from '../utils/logger';
import { getAuthData } from '../utils/storage';

export default function CustomDrawer(props: DrawerContentComponentProps) {
  const { icon } = getBrandAssets();
  const theme = useTheme<AppTheme>();
  const styles = createStyles();
  const { colors } = theme;

  const [candidatePhotoPath, setCandidatePhotoPath] = useState<string | null>(null);

  const loadAuthPhoto = async () => {
    try {
      const data = await getAuthData();
      setCandidatePhotoPath(data?.candidatePhotoPath || null);
    } catch (e) {
      logger.error('Failed to load auth data', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadAuthPhoto();
    }, [])
  );

  useEffect(() => {
    const updatePhoto = (newPath: unknown) => {
      if (typeof newPath !== 'string') return;

      setCandidatePhotoPath((prev) => {
        if (!prev) return newPath;

        const cleanPrev = prev.split('?')[0];

        if (cleanPrev === newPath) {
          return `${newPath}?t=${Date.now()}`;
        }

        return newPath;
      });
    };

    eventBus.on('CANDIDATE_PHOTO_UPDATED', updatePhoto);
    return () => eventBus.off('CANDIDATE_PHOTO_UPDATED', updatePhoto);
  }, []);

  return (
    <LinearGradient
      colors={[
        colors.gradientTop,
        colors.softOrange,
        colors.primaryLight,
        colors.primaryLight,
        colors.primary
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
                resizeMode="contain"
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
            <DrawerItemList {...props} />
          </View>
        </DrawerContentScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const createStyles = () =>
  StyleSheet.create({
    gradient: {
      flex: 1
    },
    safeArea: {
      flex: 1,
      paddingTop: Platform.OS === 'android' ? 32 : 0
    },
    logoContainer: {
      alignItems: 'center',
      paddingTop: 24,
      marginHorizontal: 16
    },
    logo: {
      width: 220,
      height: 200
    },
    photoWrapper: {
      width: 130,
      height: 130,
      borderRadius: 65,
      overflow: 'hidden',
      borderWidth: 3,
      borderColor: 'rgba(255,255,255,0.85)',
      backgroundColor: 'rgba(255,255,255,0.15)',
      justifyContent: 'center',
      alignItems: 'center'
    },
    candidatePhoto: {
      width: '100%',
      height: '100%'
    },
    scrollContainer: {
      paddingTop: 0
    },
    drawerItemsContainer: {
      marginTop: 24,
      paddingHorizontal: 12
    },
    drawerLabel: {
      fontSize: 16,
      fontWeight: '500'
    }
  });
