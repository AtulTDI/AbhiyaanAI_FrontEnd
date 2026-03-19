import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Button, Dialog, Portal, Text, useTheme } from 'react-native-paper';

import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { AppTheme } from '../theme';

type Props = {
  visible: boolean;
  title?: string;
  message?: string;
  deleteLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

const DeleteConfirmationDialog = ({
  visible,
  title = 'Delete Confirmation',
  message = 'Are you sure you want to delete this item?',
  deleteLoading,
  onConfirm,
  onCancel
}: Props) => {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  const { width } = useWindowDimensions();
  const dialogWidth = width < 500 ? width - 32 : 400;

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onCancel}
        style={[styles.dialog, { width: dialogWidth }]}
      >
        <View style={styles.iconWrapper}>
          <View style={styles.iconContainer}>
            <Ionicons name="warning-outline" size={30} color={theme.colors.warning} />
          </View>
        </View>

        <Dialog.Title style={styles.title}>{title}</Dialog.Title>

        <Dialog.Content>
          <Text variant="bodyMedium" style={styles.message}>
            {message}
          </Text>
        </Dialog.Content>

        <Dialog.Actions style={styles.actions}>
          <Button
            mode="outlined"
            onPress={onCancel}
            textColor={theme.colors.warning}
            style={styles.button}
            labelStyle={styles.label}
          >
            {t('cancel')}
          </Button>
          <Button
            mode="contained"
            onPress={onConfirm}
            buttonColor={theme.colors.warning}
            textColor={theme.colors.white}
            style={styles.button}
            labelStyle={styles.label}
            loading={deleteLoading}
            disabled={deleteLoading}
          >
            {t('delete')}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    dialog: {
      borderRadius: 12,
      backgroundColor: theme.colors.background,
      alignSelf: 'center'
    },
    iconWrapper: {
      alignItems: 'center',
      marginTop: 12
    },
    iconContainer: {
      padding: 10,
      borderRadius: 50,
      backgroundColor: theme.colors.errorBackgroundLight
    },
    title: {
      fontWeight: '600',
      fontSize: 18,
      marginBottom: 4,
      color: theme.colors.warning,
      textAlign: 'center'
    },
    message: {
      textAlign: 'center',
      color: theme.colors.onSurface,
      fontSize: 14
    },
    actions: {
      justifyContent: 'center',
      paddingHorizontal: 16,
      paddingBottom: 16,
      gap: 10,
      flexDirection: 'row'
    },
    button: {
      borderRadius: 6,
      flex: 1
    },
    label: {
      textTransform: 'none',
      fontSize: 14,
      fontWeight: '500'
    }
  });

export default DeleteConfirmationDialog;
