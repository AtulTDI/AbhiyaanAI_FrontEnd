import { AppTheme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import {
  Button,
  Dialog,
  HelperText,
  Portal,
  TextInput,
  useTheme
} from 'react-native-paper';

type Props = {
  visible: boolean;
  onGenerate: (data: { generateFor: string; mobile: string }) => void;
  onCancel: () => void;
};

const GenerateVideoDialog = ({ visible, onGenerate, onCancel }: Props) => {
  const theme = useTheme<AppTheme>();
  const { width } = useWindowDimensions();

  const dialogWidth = width < 500 ? width - 32 : 400;

  const styles = createStyles(theme, dialogWidth);

  const [generateFor, setGenerateFor] = React.useState('');
  const [mobile, setMobile] = React.useState('');

  const [errors, setErrors] = React.useState({
    generateFor: '',
    mobile: ''
  });

  useEffect(() => {
    if (visible) {
      setErrors({ generateFor: '', mobile: '' });
    }
  }, [visible]);

  const validate = () => {
    const newErrors = { generateFor: '', mobile: '' };
    let isValid = true;

    if (!generateFor.trim()) {
      newErrors.generateFor = 'Generate For is required';
      isValid = false;
    }

    if (!mobile.trim()) {
      newErrors.mobile = 'Mobile is required';
      isValid = false;
    } else if (!/^\d{10}$/.test(mobile)) {
      newErrors.mobile = 'Enter a valid 10-digit mobile number';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleGenerate = () => {
    if (!validate()) return;

    onGenerate({ generateFor, mobile });
    setGenerateFor('');
    setMobile('');
    setErrors({ generateFor: '', mobile: '' });
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onCancel} style={styles.dialog}>
        <View style={styles.iconWrapper}>
          <View style={styles.iconContainer}>
            <Ionicons name="sparkles-outline" size={30} color={theme.colors.primary} />
          </View>
        </View>

        <Dialog.Title style={styles.title}>Generate Video</Dialog.Title>

        <Dialog.Content>
          <TextInput
            label="Generate For"
            value={generateFor}
            onChangeText={(text) => {
              setGenerateFor(text);
              if (errors.generateFor) {
                setErrors((prev) => ({ ...prev, generateFor: '' }));
              }
            }}
            mode="outlined"
            error={!!errors.generateFor}
            style={styles.input}
          />

          <HelperText
            type="error"
            visible={!!errors.generateFor}
            style={styles.helperText}
          >
            {errors.generateFor}
          </HelperText>

          <TextInput
            label="Mobile"
            value={mobile}
            onChangeText={(text) => {
              const cleaned = text.replace(/[^0-9]/g, '').slice(0, 10);
              setMobile(cleaned);
              if (errors.mobile) {
                setErrors((prev) => ({ ...prev, mobile: '' }));
              }
            }}
            mode="outlined"
            error={!!errors.mobile}
            keyboardType="number-pad"
            style={styles.input}
          />

          <HelperText type="error" visible={!!errors.mobile} style={styles.helperText}>
            {errors.mobile}
          </HelperText>
        </Dialog.Content>

        <Dialog.Actions style={styles.actions}>
          <Button
            mode="outlined"
            onPress={onCancel}
            style={styles.button}
            labelStyle={styles.label}
          >
            Cancel
          </Button>

          <Button
            mode="contained"
            onPress={handleGenerate}
            style={styles.button}
            labelStyle={styles.label}
          >
            Generate
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const createStyles = (theme: AppTheme, dialogWidth: number) =>
  StyleSheet.create({
    dialog: {
      borderRadius: 12,
      backgroundColor: theme.colors.background,
      width: dialogWidth,
      alignSelf: 'center'
    },
    iconWrapper: {
      alignItems: 'center',
      marginTop: 12
    },
    iconContainer: {
      padding: 10,
      borderRadius: 50,
      backgroundColor: theme.colors.lightBackground
    },
    title: {
      fontWeight: '600',
      fontSize: 18,
      textAlign: 'center'
    },
    input: {
      backgroundColor: 'transparent'
    },
    helperText: {
      paddingLeft: 0
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

export default GenerateVideoDialog;
