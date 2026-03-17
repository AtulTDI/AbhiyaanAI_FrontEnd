import { getAuthData } from '../utils/storage';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function AuthLoadingScreen() {
  const navigation = useNavigation<any>();

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
        console.error('Token check failed', e);
        navigation.replace('Login');
      }
    };
    checkToken();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
