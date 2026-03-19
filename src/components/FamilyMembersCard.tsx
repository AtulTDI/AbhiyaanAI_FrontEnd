import { addFamilyMember, getFamilyMembers, removeFamilyMember } from '../api/voterApi';
import { AppTheme } from '../theme';
import { Voter } from '../types/Voter';
import { extractErrorMessage } from '../utils/common';
import AddFamilyMembersDialog from './AddFamilyMemberDialog';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';
import { useToast } from './ToastProvider';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View
} from 'react-native';
import { Button, IconButton, Text, useTheme } from 'react-native-paper';

type Props = {
  voter: Voter;
  onSelectMember: (id: string) => void;
};

export default function FamilyMembersCard({ voter, onSelectMember }: Props) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const theme = useTheme<AppTheme>();
  const { width } = useWindowDimensions();

  const isWeb = width >= 768;
  const styles = createStyles(theme, isWeb);

  const [members, setMembers] = useState<Voter[]>([]);
  const [loading, setLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  /* ================= FETCH ================= */

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getFamilyMembers(voter.id);
      setMembers(res?.data?.members ?? []);
    } finally {
      setLoading(false);
    }
  }, [voter.id]);

  useEffect(() => {
    void fetchMembers();
  }, [fetchMembers]);

  /* ================= DELETE ================= */

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      await removeFamilyMember(deleteId);
      await fetchMembers();
      showToast(t('voter.deleteFamilyMemberSuccess'), 'success');
    } catch (e: unknown) {
      showToast(extractErrorMessage(e, t('voter.deleteFamilyMemberFail')), 'error');
    } finally {
      setDeleteOpen(false);
      setDeleteId(null);
    }
  };

  /* ================= ADD MEMBER ================= */

  const handleAddMembers = async (members: string[]) => {
    const data = {
      sourceVoterId: voter.id,
      targetVoterIds: members
    };

    try {
      await addFamilyMember(data);
      await fetchMembers();
      showToast(t('voter.addFamilyMemberSuccess'), 'success');
    } catch (e: unknown) {
      showToast(extractErrorMessage(e, t('voter.addFail')), 'error');
    }
  };

  /* ================= RENDER ================= */

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('voter.familyMembers')}</Text>

        <Button
          mode="contained"
          compact
          style={styles.addButton}
          onPress={() => setAddOpen(true)}
        >
          {t('voter.addFamilyMember')}
        </Button>
      </View>

      {loading && <ActivityIndicator size="small" color={theme.colors.primary} />}

      {!loading && members.length === 0 && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>{t('voter.noFamilyMembers')}</Text>
        </View>
      )}

      <View style={styles.grid}>
        {members.map((m) => (
          <View key={m.id} style={styles.memberWrapper}>
            <Pressable onPress={() => onSelectMember(m.id)}>
              <View style={styles.memberCard}>
                <View style={styles.accentStrip} />

                <View style={styles.cardContent}>
                  <View style={styles.topRow}>
                    <View style={styles.textBlock}>
                      <Text variant="titleMedium" style={styles.memberName}>
                        {m.fullName}
                      </Text>

                      <Text style={styles.metaText}>
                        {t('voter.ageGender', {
                          age: m.age,
                          gender: t(`voter.gender${m.gender}`, {
                            defaultValue: m.gender
                          })
                        })}
                      </Text>
                    </View>

                    <IconButton
                      icon="delete"
                      size={18}
                      iconColor={theme.colors.error}
                      style={styles.deleteButton}
                      onPress={() => {
                        setDeleteId(m.id);
                        setDeleteOpen(true);
                      }}
                    />
                  </View>

                  {!!m.fatherHusbandName && (
                    <Text style={styles.relationText}>
                      {t('voter.fatherHusband')}:{' '}
                      <Text style={styles.relationValue}>{m.fatherHusbandName}</Text>
                    </Text>
                  )}

                  <View
                    style={[
                      styles.statusBadge,
                      m.isVerified ? styles.statusVerified : styles.statusUnverified
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        m.isVerified
                          ? styles.statusVerifiedText
                          : styles.statusUnverifiedText
                      ]}
                    >
                      {m.isVerified ? t('voter.verified') : t('voter.notVerified')}
                    </Text>
                  </View>
                </View>
              </View>
            </Pressable>
          </View>
        ))}
      </View>

      {/* Delete Dialog */}
      <DeleteConfirmationDialog
        visible={deleteOpen}
        title={t('voter.deleteFamilyMember')}
        message={t('voter.confirmDeleteFamilyMember')}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
      />

      {/* Add Dialog */}
      {addOpen && (
        <AddFamilyMembersDialog
          visible={addOpen}
          voter={voter}
          existingIds={members.map((m) => m.id)}
          onClose={() => setAddOpen(false)}
          onAdd={(newMembers) => {
            handleAddMembers(newMembers);
            setAddOpen(false);
          }}
        />
      )}
    </View>
  );
}

const createStyles = (theme: AppTheme, isWeb: boolean) =>
  StyleSheet.create({
    container: {
      width: '100%',
      gap: 12
    },
    header: {
      width: '100%',
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const
    },
    title: {
      fontWeight: '700' as const,
      fontSize: 16,
      color: theme.colors.primary
    },
    addButton: {
      borderRadius: 10,
      paddingHorizontal: 6
    },
    emptyCard: {
      width: '100%',
      backgroundColor: theme.colors.paperBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.subtleBorder,
      padding: 14
    },
    emptyText: {
      color: theme.colors.textSecondary
    },
    grid: {
      width: '100%',
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const
    },
    memberWrapper: {
      width: isWeb ? '50%' : '100%',
      padding: isWeb ? 6 : 4
    },
    memberCard: {
      backgroundColor: theme.colors.white,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.subtleBorder,
      flexDirection: 'row' as const,
      overflow: 'hidden' as const
    },
    accentStrip: {
      width: 4,
      backgroundColor: theme.colors.primaryLight
    },
    cardContent: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 14
    },
    topRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'flex-start' as const
    },
    textBlock: {
      flex: 1,
      paddingRight: 8
    },
    memberName: {
      fontWeight: '600' as const,
      color: theme.colors.primary
    },
    metaText: {
      marginTop: 2,
      fontSize: 13,
      color: theme.colors.textSecondary
    },
    deleteButton: {
      margin: 0
    },
    relationText: {
      marginTop: 6,
      fontSize: 13,
      color: theme.colors.textSecondary
    },
    relationValue: {
      color: theme.colors.textPrimary
    },
    statusBadge: {
      marginTop: 8,
      alignSelf: 'flex-start' as const,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8
    },
    statusVerified: {
      backgroundColor: theme.colors.successBackground
    },
    statusUnverified: {
      backgroundColor: theme.colors.errorBackground
    },
    statusText: {
      fontSize: 12,
      fontWeight: '500' as const
    },
    statusVerifiedText: {
      color: theme.colors.successText
    },
    statusUnverifiedText: {
      color: theme.colors.errorText
    }
  });
