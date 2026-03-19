import React, { useEffect, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  useWindowDimensions,
  View,
  ViewStyle
} from 'react-native';
import {
  ActivityIndicator,
  Button,
  Checkbox,
  Dialog,
  Divider,
  List,
  Portal,
  Searchbar,
  Text,
  useTheme
} from 'react-native-paper';

import { useTranslation } from 'react-i18next';

import { getEligibleFamilyMembers } from '../api/voterApi';
import { useDebounce } from '../hooks/useDebounce';
import { AppTheme } from '../theme';
import { Voter } from '../types/Voter';
import { getAuthData } from '../utils/storage';

type Props = {
  visible: boolean;
  voter: Voter;
  existingIds: string[];
  onClose: () => void;
  onAdd: (members: string[]) => void;
};

const PAGE_SIZE = 50;

export default function AddFamilyMembersDialog({
  visible,
  voter,
  existingIds,
  onClose,
  onAdd
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  const { width } = useWindowDimensions();

  const isTablet = width >= 900;
  const dialogSizeStyle: ViewStyle = {
    width: isTablet ? 520 : '92%',
    height: isTablet ? 620 : 520
  };

  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 400);

  const [list, setList] = useState<Voter[]>([]);
  const [selected, setSelected] = useState<Record<string, Voter>>({});

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [loadedCount, setLoadedCount] = useState(0);

  useEffect(() => {
    if (!visible) return;

    setPage(1);
    setHasMore(true);
    setList([]);
    setTotalCount(0);
    setLoadedCount(0);

    const loadInitialVoters = async () => {
      setLoading(true);

      try {
        const { applicationId } = await getAuthData();
        const res = await getEligibleFamilyMembers(
          applicationId,
          1,
          PAGE_SIZE,
          voter.id,
          debounced
        );

        const filtered = res.data.data.filter(
          (candidate: Voter) =>
            candidate.id !== voter.id && !existingIds.includes(candidate.id)
        );

        const total = res.data.totalRecords ?? 0;
        const newlyLoaded = res.data.data.length;

        setTotalCount(total);
        setLoadedCount(newlyLoaded);
        setList(filtered);
        setHasMore(newlyLoaded > 0 && newlyLoaded < total);
        setPage(2);
      } finally {
        setLoading(false);
      }
    };

    void loadInitialVoters();
  }, [debounced, existingIds, visible, voter.id]);

  const fetchVoters = async (reset = false) => {
    if (loading) return;
    if (!reset && !hasMore) return;

    setLoading(true);

    try {
      const { applicationId } = await getAuthData();
      const requestPage = reset ? 1 : page;

      const res = await getEligibleFamilyMembers(
        applicationId,
        requestPage,
        PAGE_SIZE,
        voter.id,
        debounced
      );

      const filtered = res.data.data.filter(
        (v: Voter) => v.id !== voter.id && !existingIds.includes(v.id)
      );

      const total = res.data.totalRecords ?? 0;

      if (reset) {
        setTotalCount(total);
        setLoadedCount(0);
      }

      const newlyLoaded = res.data.data.length;

      setLoadedCount((prev) => (reset ? newlyLoaded : prev + newlyLoaded));

      setList((prev) => (reset ? filtered : [...prev, ...filtered]));

      const noMoreFromServer = res.data.data.length === 0;
      const reachedTotal = loadedCount + newlyLoaded >= total;

      setHasMore(!noMoreFromServer && !reachedTotal);

      setPage(reset ? 2 : requestPage + 1);
    } finally {
      setLoading(false);
    }
  };

  const toggle = (v: Voter) => {
    setSelected((prev) => {
      const copy = { ...prev };
      if (copy[v.id]) {
        delete copy[v.id];
      } else {
        copy[v.id] = v;
      }
      return copy;
    });
  };

  const confirm = () => {
    const members = Object.values(selected).map((v) => v.id);
    onAdd(members);
    setSelected({});
  };

  return (
    <Portal>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
        style={styles.keyboardAvoidingView}
      >
        <Dialog
          visible={visible}
          onDismiss={onClose}
          style={[styles.dialog, dialogSizeStyle]}
        >
          <View style={styles.header}>
            <Text style={styles.title}>{t('voter.addFamilyMembers')}</Text>
            <Text style={styles.subtitle}>{t('voter.addFamilySubtitle')}</Text>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.topSection}>
            <Searchbar
              placeholder={t('voter.searchVoters')}
              value={search}
              onChangeText={setSearch}
              style={styles.search}
              inputStyle={styles.searchInput}
            />
          </View>

          <View style={styles.counterBar}>
            <Text style={styles.counterText}>
              {t('survey.showing', { defaultValue: 'Showing' })}{' '}
              <Text style={styles.counterHighlight}>{loadedCount}</Text>{' '}
              {t('survey.of', { defaultValue: 'of' })}{' '}
              <Text style={styles.counterHighlight}>{totalCount}</Text>
            </Text>
          </View>

          <Dialog.Content style={styles.dialogContent}>
            {loading && list.length === 0 && (
              <View style={styles.overlayLoader}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
              </View>
            )}

            <FlatList
              data={list}
              keyExtractor={(i) => i.id}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="none"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContentContainer}
              ListFooterComponent={
                hasMore ? (
                  <View style={styles.listFooter}>
                    {loading ? (
                      <ActivityIndicator size="small" />
                    ) : (
                      <Button
                        mode="outlined"
                        onPress={() => fetchVoters(false)}
                        compact
                        style={styles.loadMoreButton}
                        labelStyle={styles.loadMoreButtonLabel}
                      >
                        {t('survey.loadMore', { defaultValue: 'Load More' })}
                      </Button>
                    )}
                  </View>
                ) : null
              }
              ListEmptyComponent={
                !loading ? (
                  <Text style={styles.emptyText}>{t('voter.noData')}</Text>
                ) : null
              }
              renderItem={({ item }) => {
                const checked = !!selected[item.id];
                return (
                  <List.Item
                    title={item.fullName}
                    description={t(`voter.gender${item.gender}`, {
                      defaultValue: item.gender
                    })}
                    titleStyle={styles.listTitle}
                    descriptionStyle={styles.listDescription}
                    onPress={() => toggle(item)}
                    style={[styles.listItem, checked && styles.listItemSelected]}
                    left={() => (
                      <Checkbox
                        status={checked ? 'checked' : 'unchecked'}
                        color={theme.colors.primary}
                      />
                    )}
                  />
                );
              }}
            />
          </Dialog.Content>

          <Divider style={styles.divider} />

          <View style={styles.actions}>
            <Button
              onPress={onClose}
              style={styles.actionButton}
              textColor={theme.colors.textSecondary}
            >
              {t('cancel')}
            </Button>
            <Button
              mode="contained"
              disabled={Object.keys(selected).length === 0}
              style={styles.actionButton}
              onPress={confirm}
            >
              {t('voter.addWithCount', {
                count: Object.keys(selected).length
              })}
            </Button>
          </View>
        </Dialog>
      </KeyboardAvoidingView>
    </Portal>
  );
}

/* ================= STYLES ================= */

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    keyboardAvoidingView: {
      flex: 1,
      justifyContent: 'center'
    },
    dialog: {
      borderRadius: 16,
      backgroundColor: theme.colors.white,
      alignSelf: 'center',
      maxHeight: '85%',
      display: 'flex'
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 14,
      backgroundColor: theme.colors.paperBackground,
      marginTop: 0,
      borderRadius: 16
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.primary
    },
    subtitle: {
      marginTop: 4,
      fontSize: 13,
      color: theme.colors.textSecondary
    },
    divider: {
      backgroundColor: theme.colors.divider
    },
    topSection: {
      paddingHorizontal: 12,
      paddingTop: 8,
      paddingBottom: 6
    },
    search: {
      backgroundColor: theme.colors.white,
      borderWidth: 1,
      borderColor: theme.colors.subtleBorder,
      borderRadius: 12,
      height: 44,
      minHeight: 44
    },
    searchInput: {
      fontSize: 14,
      minHeight: 44,
      height: 44
    },
    counterBar: {
      paddingHorizontal: 16,
      paddingVertical: 6,
      backgroundColor: theme.colors.paperBackground,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider
    },
    counterText: {
      fontSize: 13,
      color: theme.colors.textSecondary
    },
    counterHighlight: {
      fontWeight: '700',
      color: theme.colors.primary
    },
    dialogContent: {
      flex: 1,
      paddingHorizontal: 0
    },
    listContentContainer: {
      paddingHorizontal: 12
    },
    listFooter: {
      padding: 8,
      alignItems: 'center'
    },
    listItem: {
      paddingVertical: 4,
      paddingRight: 8,
      backgroundColor: theme.colors.white
    },
    loadMoreButton: {
      borderRadius: 8,
      minWidth: 100,
      height: 32,
      justifyContent: 'center'
    },
    loadMoreButtonLabel: {
      fontSize: 12,
      lineHeight: 14
    },
    listItemSelected: {
      backgroundColor: theme.colors.softOrange,
      borderRadius: 4
    },
    listTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textPrimary
    },
    listDescription: {
      fontSize: 12,
      color: theme.colors.textSecondary
    },
    emptyText: {
      textAlign: 'center',
      paddingVertical: 24,
      color: theme.colors.textSecondary,
      fontSize: 13
    },
    actions: {
      display: 'flex',
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 16,
      justifyContent: 'space-between'
    },
    actionButton: {
      borderRadius: 10
    },
    overlayLoader: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.6)',
      zIndex: 10
    }
  });
