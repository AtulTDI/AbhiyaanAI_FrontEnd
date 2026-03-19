import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';

import { useFocusEffect } from '@react-navigation/native';

import {
  createChannel,
  deleteChannelById,
  getAllChannels,
  updateChannelSetting
} from '../api/channelApi';
import CreateChannelForm from '../components/ChannelForm';
import ChannelsTable from '../components/ChannelsTable';
import DeleteConfirmationDialog from '../components/DeleteConfirmationDialog';
import { useToast } from '../components/ToastProvider';
import { AppTheme } from '../theme';
import { Channel } from '../types/Channel';
import { extractErrorMessage, sortByDateDesc } from '../utils/common';

export default function AddChannelScreen() {
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  const { showToast } = useToast();

  const [channels, setChannels] = useState<Channel[]>([]);
  const [showAddChannelView, setShowAddChannelView] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [channelToEdit, setChannelToEdit] = useState<Channel | null>(null);
  const [formSubmitLoading, setFormSubmitLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchChannels = useCallback(async () => {
    try {
      const response = await getAllChannels();
      const sortedChannels = sortByDateDesc(
        response?.data || [],
        'createdAt' as keyof Channel
      );
      setChannels(sortedChannels);
    } catch {
      showToast('Failed to load channels', 'error');
    }
  }, [showToast]);

  useFocusEffect(
    useCallback(() => {
      setShowAddChannelView(false);
      setChannelToEdit(null);
      void fetchChannels();
    }, [fetchChannels])
  );

  const addChannel = async (data: { channelName: string; applicationId: string }) => {
    try {
      setFormSubmitLoading(true);
      await createChannel(data);
      setFormSubmitLoading(false);
      await fetchChannels();
      setShowAddChannelView(false);
      setChannelToEdit(null);
      showToast('Channel added successfully', 'success');
    } catch {
      showToast('Failed to add channel', 'error');
      setFormSubmitLoading(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await updateChannelSetting(id);
      await fetchChannels();
      showToast('Channel updated', 'success');
    } catch (error) {
      showToast(extractErrorMessage(error, 'Failed to update channel'), 'error');
    }
  };

  const handleDeleteRequest = (id: string) => {
    setSelectedChannelId(id);
    setDeleteDialogVisible(true);
  };

  const confirmDeleteChannel = async () => {
    if (selectedChannelId) {
      try {
        setDeleteLoading(true);
        await deleteChannelById(selectedChannelId);
        await fetchChannels();
        showToast('Channel deleted successfully!', 'success');
      } catch (error) {
        showToast(extractErrorMessage(error, 'Failed to delete channel'), 'error');
      } finally {
        setDeleteLoading(false);
      }
      setSelectedChannelId(null);
      setDeleteDialogVisible(false);
    }
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text variant="titleLarge" style={styles.heading}>
            {showAddChannelView
              ? `${channelToEdit ? 'Edit' : 'Add'} Channel`
              : 'Channels'}
          </Text>
          {!showAddChannelView && (
            <Button
              mode="contained"
              onPress={() => setShowAddChannelView(true)}
              icon="plus"
              labelStyle={styles.addButtonLabel}
              buttonColor={theme.colors.primary}
              style={styles.addButton}
            >
              Add Channel
            </Button>
          )}
        </View>

        {showAddChannelView ? (
          <CreateChannelForm
            onCreate={addChannel}
            setShowAddChannelView={setShowAddChannelView}
            formSubmitLoading={formSubmitLoading}
          />
        ) : (
          <ChannelsTable
            channels={channels}
            onDelete={handleDeleteRequest}
            onUpdateSettings={handleToggle}
          />
        )}
      </ScrollView>

      <DeleteConfirmationDialog
        visible={deleteDialogVisible}
        title="Delete Channel"
        message="Are you sure you want to delete this channel?"
        deleteLoading={deleteLoading}
        onCancel={() => setDeleteDialogVisible(false)}
        onConfirm={confirmDeleteChannel}
      />
    </>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      padding: 16,
      backgroundColor: theme.colors.white,
      flexGrow: 1
    },
    heading: {
      fontWeight: 'bold',
      color: theme.colors.primary
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16
    },
    addButtonLabel: {
      fontWeight: 'bold',
      fontSize: 14,
      color: theme.colors.onPrimary
    },
    addButton: {
      borderRadius: 5
    }
  });
