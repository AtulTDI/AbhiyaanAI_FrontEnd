import { PermissionsAndroid, NativeModules, Platform } from 'react-native';

const { AccountsModule } = NativeModules;

async function requestAccountsPermissions() {
  if (Platform.OS === 'android') {
    const grantedGetAccounts = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.GET_ACCOUNTS,
      {
        title: 'Access Your Accounts',
        message: 'App needs access to your device accounts',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );

    const grantedReadContacts = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
      {
        title: 'Access Contacts',
        message: 'App needs access to your contacts to read accounts',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );

    return (
      grantedGetAccounts === PermissionsAndroid.RESULTS.GRANTED &&
      grantedReadContacts === PermissionsAndroid.RESULTS.GRANTED
    );
  }
  return true;
}

export async function fetchAccounts() {
  const hasPermission = await requestAccountsPermissions();
  if (!hasPermission) {
    throw new Error('Required permissions not granted');
  }
  return AccountsModule.getAccounts();
}