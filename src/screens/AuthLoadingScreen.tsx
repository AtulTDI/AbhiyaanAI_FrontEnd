import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { RootStackParamList } from '../types';
import { logger } from '../utils/logger';
import { getAuthData } from '../utils/storage';

export default function AuthLoadingScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    const checkToken = async () => {
      try {
        const authData = await getAuthData();

        if (authData?.accessToken) {
          navigation.replace('App');
        } else {
          navigation.replace('Login');
        }
      } catch (e) {
        logger.error('Token check failed', e);
        navigation.replace('Login');
      }
    };
    checkToken();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
});
