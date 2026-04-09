import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

import { createDrawerNavigator } from '@react-navigation/drawer';

import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import CustomDrawer from '../components/CustomDrawer';
import CustomLabel from '../components/CustomLabel';
import LanguageSelector from '../components/LanguageSelector';
import UserAvatarMenu from '../components/UserAvatarMenu';
import AddApplicationScreen from '../screens/AddApplicationScreen';
import AddCandidateScreen from '../screens/AddCandidateScreen';
import AddSenderScreen from '../screens/AddSenderScreen';
import AddUserScreen from '../screens/AddUserScreen';
import AddVoterScreen from '../screens/AddVoterScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import DebugScreen from '../screens/DebugScreen';
import GeneratedImagesScreen from '../screens/GeneratedImagesScreen';
import GeneratedVideoScreen from '../screens/GeneratedVideosScreen';
import GenerateVideoScreen from '../screens/GenerateVideoScreen';
import PremiumVoicesScreen from '../screens/PremiumVoicesScreen';
import ProcessingVideosScreen from '../screens/ProcessingVideosScreen';
import UploadImageScreen from '../screens/UploadImageScreen';
import UploadVideoScreen from '../screens/UploadVideoScreen';
import VotersScreen from '../screens/VotersScreen';
import { stopConnection } from '../services/signalrService';
import { AppTheme } from '../theme';
import { clearAuthData, getAuthData } from '../utils/storage';
import { navigate } from './NavigationService';

const Drawer = createDrawerNavigator();

export default function AppLayout() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  const { colors } = theme;

  const [userName, setUserName] = useState('');
  const [role, setRole] = useState<'Admin' | 'User' | 'SuperAdmin' | 'Sender' | null>(
    null
  );
  const [userEmail, setUserEmail] = useState('');
  const [applicationName, setApplicationName] = useState('');
  const [videoCount, setVideoCount] = useState<number | null>(null);
  const [showVideoCampaign, setShowVideoCampaign] = useState<boolean | string>(false);
  const [showImageCampaign, setShowImageCampaign] = useState<boolean | string>(false);
  const [isElectionRelated, setIsElectionRelated] = useState<boolean | string>(false);

  useEffect(() => {
    (async () => {
      const {
        userName: name,
        userEmail: email,
        role: storedRole,
        videoCount: count,
        applicationName: userApplication,
        iselectionRelatedapp: isElectionRelatedApp,
        showVideoCampaign: videoCampaign,
        showImageCampaign: imageCampaign
      } = await getAuthData();

      if (name) setUserName(name);
      if (email) setUserEmail(email);
      if (userApplication) setApplicationName(userApplication);
      if (
        storedRole === 'Admin' ||
        storedRole === 'SuperAdmin' ||
        storedRole === 'User' ||
        storedRole === 'Sender'
      ) {
        setRole(storedRole);
      }

      setIsElectionRelated(isElectionRelatedApp);
      setShowVideoCampaign(videoCampaign);
      setShowImageCampaign(imageCampaign);

      if (count !== undefined && !isNaN(Number(count))) {
        setVideoCount(Number(count));
      }
    })();
  }, []);

  const handleLogout = async () => {
    try {
      stopConnection();
      await clearAuthData();
    } catch (error) {
      void error;
    } finally {
      navigate('Login');
    }
  };

  const getCountColor = () => {
    if (videoCount >= 100) return colors.success;
    if (videoCount > 50) return colors.warning;
    return colors.error;
  };

  const headerRightComponent = () => {
    return (
      <View style={styles.headerRightContainer}>
        <LanguageSelector />

        {role === 'Admin' && videoCount !== null && showVideoCampaign && (
          <TouchableOpacity
            style={[
              styles.videoCountContainer,
              {
                backgroundColor: getCountColor(),
                shadowColor: colors.black
              }
            ]}
            activeOpacity={0.8}
          >
            <Ionicons
              name="videocam"
              size={18}
              color={colors.white}
              style={styles.videoIcon}
            />
            <Text style={styles.videoCountText}>{videoCount}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={28} color={colors.primary} />
        </TouchableOpacity>

        <UserAvatarMenu
          userName={userName}
          email={userEmail}
          role={role}
          applicationName={applicationName}
        />
      </View>
    );
  };

  if (!role) return null;

  return (
    <Drawer.Navigator
      id={undefined}
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={{
        drawerType: isLargeScreen ? 'permanent' : 'front',
        headerShown: !isLargeScreen,
        headerLeft: isLargeScreen ? () => null : undefined,
        drawerActiveTintColor: colors.primary,
        drawerLabelStyle: styles.drawerLabel,
        drawerActiveBackgroundColor: 'transparent',
        drawerItemStyle: styles.drawerItem
      }}
    >
      {(role === 'Admin' || role === 'SuperAdmin') && (
        <>
          {role === 'SuperAdmin' && (
            <>
              <Drawer.Screen
                name="AddDistributor"
                children={() => <AddUserScreen role="Distributor" />}
                options={{
                  headerShown: true,
                  headerTitle: '',
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
                  )
                }}
              />

              <Drawer.Screen
                name="AddApplication"
                component={AddApplicationScreen}
                options={{
                  headerShown: true,
                  headerTitle: '',
                  headerRight: headerRightComponent,
                  drawerLabel: (props) => (
                    <CustomLabel
                      {...props}
                      label={t('applicationTabLabel')}
                      icon={
                        <Ionicons
                          name="apps"
                          size={20}
                          color={props.color || colors.onPrimary}
                        />
                      }
                    />
                  )
                }}
              />

              <Drawer.Screen
                name="AddAdmin"
                children={() => <AddUserScreen role="Admin" />}
                options={{
                  headerShown: true,
                  headerTitle: '',
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
                  )
                }}
              />

              <Drawer.Screen
                name="PremiumVoices"
                children={() => <PremiumVoicesScreen />}
                options={{
                  headerShown: true,
                  headerTitle: '',
                  headerRight: headerRightComponent,
                  drawerLabel: (props) => (
                    <CustomLabel
                      {...props}
                      label={t('premiumVoicesTabLabel')}
                      icon={
                        <Ionicons
                          name="radio-outline"
                          size={20}
                          color={props.color || colors.onPrimary}
                        />
                      }
                    />
                  )
                }}
              />
            </>
          )}

          {role === 'Admin' && (
            <Drawer.Screen
              name="Dashboard"
              component={AdminDashboardScreen}
              options={{
                headerShown: true,
                headerTitle: '',
                headerRight: headerRightComponent,
                drawerLabel: (props) => (
                  <CustomLabel
                    {...props}
                    label={t('dashboardTabLabel')}
                    icon={
                      <Ionicons
                        name="grid-outline"
                        size={20}
                        color={props.color || colors.onPrimary}
                      />
                    }
                  />
                )
              }}
            />
          )}

          {role === 'Admin' && (
            <Drawer.Screen
              name="Candidates"
              component={AddCandidateScreen}
              options={{
                headerShown: true,
                headerTitle: '',
                headerRight: headerRightComponent,
                drawerLabel: (props) => (
                  <CustomLabel
                    {...props}
                    label={t('candidate.plural')}
                    icon={
                      <Ionicons
                        name="people-circle-outline"
                        size={20}
                        color={props.color || colors.onPrimary}
                      />
                    }
                  />
                )
              }}
            />
          )}

          {role === 'Admin' && (
            <Drawer.Screen
              name="VotersList"
              component={VotersScreen}
              options={{
                headerShown: true,
                headerTitle: '',
                headerRight: headerRightComponent,
                drawerLabel: (props) => (
                  <CustomLabel
                    {...props}
                    label={t('voter.plural')}
                    icon={
                      <Ionicons
                        name="people-outline"
                        size={20}
                        color={props.color || colors.onPrimary}
                      />
                    }
                  />
                )
              }}
            />
          )}

          {role === 'Admin' && (
            <Drawer.Screen
              name="AddUser"
              component={AddUserScreen}
              options={{
                headerShown: true,
                headerTitle: '',
                headerRight: headerRightComponent,
                drawerLabel: (props) => (
                  <CustomLabel
                    {...props}
                    label={t('userTabLabel')}
                    icon={
                      <Ionicons
                        name="people-outline"
                        size={20}
                        color={props.color || colors.onPrimary}
                      />
                    }
                  />
                )
              }}
            />
          )}

          {role === 'Admin' && (
            <Drawer.Screen
              name="Debug"
              component={DebugScreen}
              options={{
                headerShown: true,
                headerTitle: '',
                headerRight: headerRightComponent,
                drawerLabel: (props) => (
                  <CustomLabel
                    {...props}
                    label={t('debugTabLabel')}
                    icon={
                      <Ionicons
                        name="bug-outline"
                        size={20}
                        color={props.color || colors.onPrimary}
                      />
                    }
                  />
                )
              }}
            />
          )}

          {/* {role === "Admin" && (
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
          )} */}

          {role === 'Admin' && (
            <>
              {showVideoCampaign && (
                <Drawer.Screen
                  name="Upload"
                  component={UploadVideoScreen}
                  options={{
                    headerShown: true,
                    headerTitle: '',
                    headerRight: headerRightComponent,
                    drawerLabel: (props) => (
                      <CustomLabel
                        {...props}
                        label={t('uploadBaseVideoTabLabel')}
                        icon={
                          <Ionicons
                            name="cloud-upload"
                            size={20}
                            color={props.color || colors.onPrimary}
                          />
                        }
                      />
                    )
                  }}
                />
              )}

              {showImageCampaign && (
                <Drawer.Screen
                  name="UploadImage"
                  component={UploadImageScreen}
                  options={{
                    headerShown: true,
                    headerTitle: '',
                    headerRight: headerRightComponent,
                    drawerLabel: (props) => (
                      <CustomLabel
                        {...props}
                        label={t('uploadImageTabLabel')}
                        icon={
                          <Ionicons
                            name="images-outline"
                            size={20}
                            color={props.color || colors.onPrimary}
                          />
                        }
                      />
                    )
                  }}
                />
              )}
            </>
          )}
        </>
      )}

      {role === 'User' && (
        <>
          {isElectionRelated ? (
            <Drawer.Screen
              name="VotersList"
              component={VotersScreen}
              options={{
                headerShown: true,
                headerTitle: '',
                headerRight: headerRightComponent,
                drawerLabel: (props) => (
                  <CustomLabel
                    {...props}
                    label={t('voter.plural')}
                    icon={
                      <Ionicons
                        name="people-outline"
                        size={20}
                        color={props.color || colors.onPrimary}
                      />
                    }
                  />
                )
              }}
            />
          ) : (
            <Drawer.Screen
              name="AddVoter"
              component={AddVoterScreen}
              options={{
                headerShown: true,
                headerTitle: '',
                headerRight: headerRightComponent,
                drawerLabel: (props) => (
                  <CustomLabel
                    {...props}
                    label={t('voterTabLabel')}
                    icon={
                      <Ionicons
                        name="people-outline"
                        size={20}
                        color={props.color || colors.onPrimary}
                      />
                    }
                  />
                )
              }}
            />
          )}

          {(showVideoCampaign || showImageCampaign) && (
            <Drawer.Screen
              name="AddSender"
              component={AddSenderScreen}
              options={{
                headerShown: true,
                headerTitle: '',
                headerRight: headerRightComponent,
                drawerLabel: (props) => (
                  <CustomLabel
                    {...props}
                    label={t('senderTabLabel')}
                    icon={
                      <Ionicons
                        name="paper-plane-outline"
                        size={20}
                        color={props.color || colors.onPrimary}
                      />
                    }
                  />
                )
              }}
            />
          )}

          {showVideoCampaign && (
            <Drawer.Screen
              name="Generate"
              component={GenerateVideoScreen}
              options={{
                headerShown: true,
                headerTitle: '',
                headerRight: headerRightComponent,
                drawerLabel: (props) => (
                  <CustomLabel
                    {...props}
                    label={t('generateVideoTabLabel')}
                    icon={
                      <Ionicons
                        name="sparkles-outline"
                        size={20}
                        color={props.color || colors.onPrimary}
                      />
                    }
                  />
                )
              }}
            />
          )}

          {showVideoCampaign && (
            <Drawer.Screen
              name="Processing"
              component={ProcessingVideosScreen}
              options={{
                headerShown: true,
                headerTitle: '',
                headerRight: headerRightComponent,
                drawerLabel: (props) => (
                  <CustomLabel
                    {...props}
                    label={t('processingVideoTabLabel')}
                    icon={
                      <Ionicons
                        name="time-outline"
                        size={20}
                        color={props.color || colors.onPrimary}
                      />
                    }
                  />
                )
              }}
            />
          )}

          {showVideoCampaign && (
            <Drawer.Screen
              name="Generated"
              component={GeneratedVideoScreen}
              options={{
                headerShown: true,
                headerTitle: '',
                headerRight: headerRightComponent,
                drawerLabel: (props) => (
                  <CustomLabel
                    {...props}
                    label={t('generatedVideoTabLabel')}
                    icon={
                      <Ionicons
                        name="film-outline"
                        size={20}
                        color={props.color || colors.onPrimary}
                      />
                    }
                  />
                )
              }}
            />
          )}

          {showImageCampaign && (
            <Drawer.Screen
              name="GeneratedImages"
              component={GeneratedImagesScreen}
              options={{
                headerShown: true,
                headerTitle: '',
                headerRight: headerRightComponent,
                drawerLabel: (props) => (
                  <CustomLabel
                    {...props}
                    label={t('generatedImageTabLabel')}
                    icon={
                      <Ionicons
                        name="images-outline"
                        size={20}
                        color={props.color || colors.onPrimary}
                      />
                    }
                  />
                )
              }}
            />
          )}
        </>
      )}

      {role === 'Sender' && (
        <>
          <Drawer.Screen
            name="Generated"
            component={GeneratedVideoScreen}
            options={{
              headerShown: true,
              headerTitle: '',
              headerRight: headerRightComponent,
              drawerLabel: (props) => (
                <CustomLabel
                  {...props}
                  label={t('generatedVideoTabLabel')}
                  icon={
                    <Ionicons
                      name="film-outline"
                      size={20}
                      color={props.color || colors.onPrimary}
                    />
                  }
                />
              )
            }}
          />

          <Drawer.Screen
            name="GeneratedImages"
            component={GeneratedImagesScreen}
            options={{
              headerShown: true,
              headerTitle: '',
              headerRight: headerRightComponent,
              drawerLabel: (props) => (
                <CustomLabel
                  {...props}
                  label={t('generatedImageTabLabel')}
                  icon={
                    <Ionicons
                      name="images-outline"
                      size={20}
                      color={props.color || colors.onPrimary}
                    />
                  }
                />
              )
            }}
          />
        </>
      )}
    </Drawer.Navigator>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    headerRightContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 10,
      gap: 12
    },
    videoCountContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 5,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3
    },
    videoIcon: {
      marginRight: 6
    },
    videoCountText: {
      color: theme.colors.white,
      fontSize: 14,
      fontWeight: '600'
    },
    drawerLabel: {
      marginLeft: -16,
      fontSize: 16
    },
    drawerItem: {
      height: 48,
      justifyContent: 'center',
      paddingVertical: 0,
      marginVertical: 5
    }
  });
