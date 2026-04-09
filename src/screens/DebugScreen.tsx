import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';

import {
  debugCountVoters,
  debugSyncQueue,
  debugVoters,
  exportDB
} from '../debug/dbDebug';
import { AppTheme } from '../theme';

export default function DebugScreen() {
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  const [voterCount, setVoterCount] = useState<number | null>(null);

  const handleCheckVoters = async () => {
    await debugVoters();
  };

  const handleCountVoters = async () => {
    const count = await debugCountVoters();
    setVoterCount(count);
  };

  const handleCheckSyncQueue = async () => {
    await debugSyncQueue();
  };

  const handleExportDB = async () => {
    await exportDB();
  };

  return (
    <View style={styles.container}>
      <Text variant="titleLarge" style={styles.title}>
        Database debug
      </Text>

      {voterCount !== null && (
        <Text style={styles.count}>Total voters in local DB: {voterCount}</Text>
      )}

      <Button mode="outlined" onPress={handleCountVoters} style={styles.button}>
        Log voter count
      </Button>

      <Button mode="outlined" onPress={handleCheckVoters} style={styles.button}>
        Log voters (first 50)
      </Button>

      <Button mode="outlined" onPress={handleCheckSyncQueue} style={styles.button}>
        Log sync queue
      </Button>

      <Button mode="contained" onPress={handleExportDB} style={styles.button}>
        Export DB file
      </Button>
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 24,
      gap: 12,
      backgroundColor: theme.colors.white
    },
    title: {
      marginBottom: 8
    },
    count: {
      fontSize: 16,
      marginBottom: 8
    },
    button: {
      borderRadius: 8
    }
  });
