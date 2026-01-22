import { PermissionsAndroid, Platform } from 'react-native';

export const requestBluetoothPermissions = async () => {
  if (Platform.OS !== 'android') return true;

  try {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ]);

    return (
      granted['android.permission.BLUETOOTH_SCAN'] ===
      PermissionsAndroid.RESULTS.GRANTED &&
      granted['android.permission.BLUETOOTH_CONNECT'] ===
      PermissionsAndroid.RESULTS.GRANTED
    );
  } catch (err) {
    console.error('Bluetooth permission error:', err);
    return false;
  }
};