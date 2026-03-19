import React, { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Avatar, Divider, Menu, Text, useTheme } from 'react-native-paper';

import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { AppTheme } from '../theme';

interface Props {
  userName: string;
  email: string;
  applicationName?: string;
  role: string;
}

const UserAvatarMenu: React.FC<Props> = ({ userName, email, applicationName, role }) => {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  const { colors } = theme;
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.container}>
      <Menu
        visible={visible}
        onDismiss={() => setVisible(false)}
        anchor={
          <TouchableOpacity onPress={() => setVisible(true)}>
            <Avatar.Text
              label={userName?.charAt(0)?.toUpperCase()}
              size={38}
              style={styles.avatar}
              labelStyle={styles.avatarLabel}
            />
          </TouchableOpacity>
        }
        anchorPosition="bottom"
        contentStyle={styles.menuContent}
      >
        <View style={styles.header}>
          <Text style={styles.headerText}>{userName}</Text>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('email')}</Text>
          <View style={styles.infoRow}>
            <MaterialIcons name="email" size={16} color={colors.textTertiary} />
            <Text style={styles.valueText}>{email}</Text>
          </View>
        </View>

        <Divider style={styles.sectionDivider} />

        {applicationName && (
          <View>
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('application.singular')}</Text>
              <View style={styles.infoRow}>
                <MaterialIcons name="apps" size={16} color={colors.textTertiary} />
                <Text style={styles.valueText}>{applicationName}</Text>
              </View>
            </View>

            <Divider style={styles.sectionDivider} />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('roleLabel')}</Text>
          <View style={styles.infoRow}>
            <MaterialIcons name="person" size={16} color={colors.textTertiary} />
            <Text style={styles.roleText}>{role}</Text>
          </View>
        </View>
      </Menu>
    </View>
  );
};

const createStyles = (theme: AppTheme) => ({
  container: {
    position: 'relative' as const,
    alignItems: 'flex-end' as const
  },
  avatar: {
    backgroundColor: theme.colors.primary,
    elevation: 4
  },
  avatarLabel: {
    color: theme.colors.white,
    fontWeight: '500' as const
  },
  menuContent: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    elevation: 6,
    minWidth: 250,
    paddingTop: 0,
    paddingBottom: 8,
    marginTop: 5
  },
  header: {
    backgroundColor: theme.colors.softOrange,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12
  },
  headerText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: theme.colors.darkOrange
  },
  divider: {
    backgroundColor: theme.colors.divider
  },
  sectionDivider: {
    backgroundColor: theme.colors.divider,
    marginVertical: 4
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  sectionLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 2
  },
  infoRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8
  },
  valueText: {
    fontSize: 14,
    color: theme.colors.textPrimary
  },
  roleText: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    fontWeight: '600' as const,
    textTransform: 'capitalize' as const
  }
});

export default UserAvatarMenu;
