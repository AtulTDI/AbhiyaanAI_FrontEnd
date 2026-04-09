import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { ActivityIndicator, Chip, Text, TextInput, useTheme } from 'react-native-paper';
import { DatePickerModal } from 'react-native-paper-dates';

import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import {
  addVoterDemands,
  deleteVoterDemand,
  getDemandCategories,
  getDemandsByCategory,
  getVoterDemands,
  resolveVoterDemand,
  updateVoterDemands
} from '../api/voterDemandApi';
import { getCastes, getSupportTypes } from '../api/voterSurveyApi';
import { usePlatformInfo } from '../hooks/usePlatformInfo';
import { surveyService } from '../services/surveyService';
import { AppTheme } from '../theme';
import type {
  Caste,
  Demand,
  DemandCategory,
  SupportTypeColor,
  VoterDemandItem,
  VoterSurveyRequest
} from '../types/Voter';
import { extractErrorMessage, formatForDisplay, toUtcIsoDate } from '../utils/common';
import { logger } from '../utils/logger';
import { FixedLabel } from './FixedLabel';
import FormDropdown from './FormDropdown';
import { useToast } from './ToastProvider';

/* ================= TYPES ================= */

type Props = {
  voterId?: string;
};

const DEFAULT_SURVEY_DATA: VoterSurveyRequest = {
  supportType: 0,
  supportStrength: 0,
  casteId: null,
  otherCaste: '',
  newAddress: '',
  society: '',
  flatNumber: '',
  email: '',
  secondaryMobileNumber: '',
  dateOfBirth: null,
  demands: [],
  needsFollowUp: false,
  specialVisitDate: null,
  specialVisitRemarks: '',
  specialVisitDone: false,
  specialVisitUserId: null,
  voterDied: false,
  remarks: '',
  isVoted: false,
  surveyedByUserId: null
};
const SUPPORT_STRENGTH_OPTIONS = [
  { label: 'Unknown', value: 0 },
  { label: 'Strong', value: 1 },
  { label: 'Moderate', value: 2 },
  { label: 'Weak', value: 3 }
];

type GridItemProps = {
  children: React.ReactNode;
  isWide: boolean;
};

type FullGridItemProps = {
  children: React.ReactNode;
};

type CardProps = {
  children: React.ReactNode;
  title: string;
};

type RowProps = {
  children: React.ReactNode;
  label: string;
  noDivider?: boolean;
};

type InputRowProps = Omit<
  React.ComponentProps<typeof TextInput>,
  'onChangeText' | 'outlineColor' | 'value' | 'onChange'
> & {
  label?: string;
  maxLength?: number;
  multiline?: boolean;
  noDivider?: boolean;
  onChange: (value: string) => void;
  outlineColor?: string;
  value?: string | null;
};

type BooleanRowProps = {
  label: string;
  noDivider?: boolean;
  onChange: (value: boolean) => void;
  value: boolean;
};

/* ================= COMPONENT ================= */

export default function SurveyTab({ voterId }: Props) {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  const { showToast } = useToast();
  const { width } = useWindowDimensions();
  const { isAndroid } = usePlatformInfo();

  const isWide = width >= 1024;

  const [data, setData] = useState<VoterSurveyRequest>(DEFAULT_SURVEY_DATA);
  const [loading, setLoading] = useState(true);
  const [dobOpen, setDobOpen] = useState(false);
  const [specialVisitOpen, setSpecialVisitOpen] = useState(false);

  const [supportTypes, setSupportTypes] = useState<SupportTypeColor[]>([]);
  const [castes, setCastes] = useState<Caste[]>([]);
  const [demandCategories, setDemandCategories] = useState<DemandCategory[]>([]);
  const [demandsByCategory, setDemandsByCategory] = useState<Record<string, Demand[]>>(
    {}
  );
  const [openDemands, setOpenDemands] = useState<Record<number, boolean>>({});

  const loadDemandsForExisting = useCallback(async (demands: VoterDemandItem[]) => {
    const uniqueCategoryIds = [
      ...new Set(demands.map((d) => d.categoryId).filter(Boolean))
    ];

    await Promise.all(
      uniqueCategoryIds.map(async (categoryId) => {
        const res = await getDemandsByCategory(categoryId);
        setDemandsByCategory((prev) =>
          prev[categoryId]
            ? prev
            : {
                ...prev,
                [categoryId]: res.data ?? []
              }
        );
      })
    );
  }, []);

  const loadSurvey = useCallback(async () => {
    try {
      const surveyLocal = await surveyService.getSurveyByVoterId(voterId);

      if (!surveyLocal) {
        setData(DEFAULT_SURVEY_DATA);
        setOpenDemands({});
        return;
      }

      const demandRes = await getVoterDemands(voterId);
      const demands = demandRes.data ?? [];

      const mappedData: VoterSurveyRequest = {
        ...DEFAULT_SURVEY_DATA,
        demands,
        id: surveyLocal.id ?? undefined,
        supportType: surveyLocal.supportType ?? 0,
        supportStrength: surveyLocal.supportStrength ?? 0,
        casteId: surveyLocal.otherCaste ? 'other' : (surveyLocal.casteId ?? null),
        otherCaste: surveyLocal.otherCaste ?? '',
        newAddress: surveyLocal.newAddress ?? '',
        society: surveyLocal.society ?? '',
        flatNumber: surveyLocal.flatNumber ?? '',
        email: surveyLocal.email ?? '',
        secondaryMobileNumber: surveyLocal.secondaryMobileNumber ?? '',
        dateOfBirth: surveyLocal.dateOfBirth ?? null,
        needsFollowUp: Boolean(surveyLocal.needsFollowUp),
        voterDied: Boolean(surveyLocal.voterDied),
        isVoted: Boolean(surveyLocal.isVoted),
        specialVisitDone: Boolean(surveyLocal.specialVisitDone),
        specialVisitDate: surveyLocal.specialVisitDate ?? null,
        specialVisitRemarks: surveyLocal.specialVisitRemarks ?? '',
        remarks: surveyLocal.remarks ?? '',
        surveyedByUserId: surveyLocal.surveyedByUserId ?? undefined
      };

      logger.log('[SurveyTab.loadSurvey] mapped data:', JSON.stringify(mappedData));
      setData(mappedData);

      const initialOpen: Record<number, boolean> = {};
      demands.forEach((_, index) => {
        initialOpen[index] = false;
      });
      setOpenDemands(initialOpen);

      await loadDemandsForExisting(demands);
    } catch (e) {
      showToast(extractErrorMessage(e), 'error');
    } finally {
      setLoading(false);
    }
  }, [loadDemandsForExisting, showToast, voterId]);

  const loadSupportTypes = useCallback(async () => {
    try {
      const res = await getSupportTypes();
      setSupportTypes(res.data ?? []);
    } catch (e) {
      showToast(extractErrorMessage(e), 'error');
    }
  }, [showToast]);

  const loadCastes = useCallback(async () => {
    try {
      const res = await getCastes();
      const unique = Object.values(
        (res.data ?? []).reduce(
          (acc, item) => {
            acc[item.nameEn] = item;
            return acc;
          },
          {} as Record<string, Caste>
        )
      );

      setCastes([...unique, { id: 'other', nameEn: 'Other', nameMr: 'इतर' }]);
    } catch (e) {
      showToast(extractErrorMessage(e), 'error');
    }
  }, [showToast]);

  const loadDemandCategories = useCallback(async () => {
    try {
      const res = await getDemandCategories();
      setDemandCategories(res.data ?? []);
    } catch (e) {
      showToast(extractErrorMessage(e), 'error');
    }
  }, [showToast]);

  const loadDemands = async (categoryId: string) => {
    if (demandsByCategory[categoryId]) return;
    const res = await getDemandsByCategory(categoryId);
    setDemandsByCategory((p) => ({ ...p, [categoryId]: res.data ?? [] }));
  };

  useEffect(() => {
    void loadSurvey();
    void loadSupportTypes();
    void loadCastes();
    void loadDemandCategories();
  }, [loadCastes, loadDemandCategories, loadSupportTypes, loadSurvey]);

  const update = <K extends keyof VoterSurveyRequest>(k: K, v: VoterSurveyRequest[K]) =>
    setData((d) => ({ ...d, [k]: v }));

  const updateMobile = (value: string) => {
    const digits = value.replace(/\D/g, '');

    if (digits.length > (data.secondaryMobileNumber?.length ?? 0) + 1) {
      update('secondaryMobileNumber', digits.slice(-10));
    } else if (digits.length <= 10) {
      update('secondaryMobileNumber', digits);
    }
  };

  const isValidMobile = (num?: string) => {
    if (!num) return true;
    return /^\d{10}$/.test(num);
  };

  const isValidEmail = (email?: string) => {
    if (!email) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isAtLeast18 = (isoDate?: string | null) => {
    if (!isoDate) return true;
    const birthDate = new Date(isoDate);
    const today = new Date();

    const age = today.getFullYear() - birthDate.getFullYear();
    const hasBirthdayPassed =
      today.getMonth() > birthDate.getMonth() ||
      (today.getMonth() === birthDate.getMonth() &&
        today.getDate() >= birthDate.getDate());

    return hasBirthdayPassed ? age >= 18 : age - 1 >= 18;
  };

  /* ================= DEMANDS ================= */

  const addDemand = () => {
    if ((data.demands?.length ?? 0) >= 5) return;
    const newIndex = data.demands?.length ?? 0;
    update('demands', [...(data.demands ?? []), {}]);
    setOpenDemands((p) => ({ ...p, [newIndex]: true }));
  };

  const updateDemand = (index: number, patch: Partial<VoterDemandItem>) => {
    const list = [...(data.demands ?? [])];
    list[index] = { ...list[index], ...patch };
    update('demands', list);
  };

  const removeDemand = async (index: number) => {
    const list = [...(data.demands ?? [])];
    if (list[index].id) {
      await deleteVoterDemand(list[index].id);
      showToast(t('survey.deleteDemandSuccess'), 'success');
    }
    list.splice(index, 1);
    update('demands', list);
  };

  const getDemandTitle = (d: VoterDemandItem, index: number) => {
    if (!d.demandId || !d.categoryId) {
      return `${t('survey.demand')} ${index + 1}`;
    }

    const demand = demandsByCategory[d.categoryId]?.find((x) => x.id === d.demandId);

    return demand?.demandEn || `${t('survey.demand')} ${index + 1}`;
  };

  const toggleResolved = async (index: number) => {
    const demand = data.demands[index];

    await resolveVoterDemand({
      voterDemandId: demand.id!,
      resolutionNote: ''
    });

    updateDemand(index, {
      isResolved: !demand.isResolved
    });
  };

  const handleSave = async () => {
    try {
      if (!isValidMobile(data?.secondaryMobileNumber)) {
        showToast(t('voter.mobileInvalid'), 'error');
        return;
      }

      if (!isValidEmail(data?.email)) {
        showToast(t('voter.emailInvalid'), 'error');
        return;
      }

      if (!isAtLeast18(data?.dateOfBirth)) {
        showToast(t('voter.dobUnder18'), 'error');
        return;
      }

      const { demands, ...surveyPayload } = data;
      const cleanedPayload = {
        voterId,
        ...surveyPayload,
        casteId: data.casteId === 'other' ? null : data.casteId
      };

      if (data.id) {
        logger.log('Cleaned Payload:', cleanedPayload);
        await surveyService.updateSurvey(data.id, cleanedPayload);
      } else {
        await surveyService.addSurvey(cleanedPayload);
      }

      const existingDemandsPayload = demands
        .filter((d) => d.id)
        .map((d) => ({
          voterDemandId: d.id,
          voterId,
          demandCategoryId: d.categoryId ?? null,
          demandId: d.demandId ?? null,
          description: d.description ?? null
        }));

      const newDemands = demands.filter((d) => !d.id);

      await Promise.all([
        existingDemandsPayload.length && updateVoterDemands(existingDemandsPayload),
        newDemands.length && addVoterDemands(voterId, newDemands)
      ]);

      loadSurvey();

      showToast(t(data?.id ? 'survey.updateSuccess' : 'survey.addSuccess'), 'success');
    } catch (e) {
      showToast(extractErrorMessage(e), 'error');
    }
  };

  const handleReset = () => {
    setData(DEFAULT_SURVEY_DATA);
    showToast(t('survey.resetDone'), 'info');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  const maxDob = new Date();
  maxDob.setFullYear(maxDob.getFullYear() - 18);

  return (
    <>
      <View style={styles.grid}>
        {/* BASIC */}
        <GridItem isWide={isWide}>
          <Card title={t('voter.surveyBasic')}>
            <DropdownRow label={t('voter.colorCode')}>
              <FormDropdown
                value={String(data.supportType ?? 0)}
                options={supportTypes.map((s) => ({
                  label: t(`survey.supportType.${s.label}`, s.label),
                  value: String(s.value),
                  itemStyle: {
                    backgroundColor: s.colorCode + '20'
                  },
                  colorCode: s.colorCode
                }))}
                onSelect={(v) => update('supportType', Number(v))}
                noMargin
                customOutline
              />
            </DropdownRow>

            <DropdownRow label={t('voter.supportStrength')}>
              <FormDropdown
                value={String(data.supportStrength ?? 0)}
                options={SUPPORT_STRENGTH_OPTIONS.map((s) => ({
                  label: t(`survey.supportStrength.${s.label}`, s.label),
                  value: String(s.value)
                }))}
                onSelect={(v) => update('supportStrength', Number(v))}
                noMargin
                customOutline
              />
            </DropdownRow>

            <DropdownRow label={t('voter.caste')} noDivider>
              <FormDropdown
                value={String(data.casteId ?? null)}
                options={castes.map((s) => ({
                  label: t(`survey.castes.${s.nameEn}`, s.nameEn),
                  value: String(s.id)
                }))}
                onSelect={(v) => update('casteId', v)}
                noMargin
                customOutline
              />
            </DropdownRow>

            {data.casteId === 'other' && (
              <InputRow
                value={data.otherCaste}
                onChange={(v) => update('otherCaste', v)}
                noDivider
              />
            )}
          </Card>
        </GridItem>

        {/* ADDRESS */}
        <GridItem isWide={isWide}>
          <Card title={t('voter.surveyAddress')}>
            <InputRow
              label={t('voter.newAddress')}
              multiline
              value={data.newAddress}
              onChange={(v) => update('newAddress', v)}
            />
            <InputRow
              label={t('voter.society')}
              value={data.society}
              onChange={(v) => update('society', v)}
            />
            <InputRow
              label={t('voter.flatNo')}
              value={data.flatNumber}
              onChange={(v) => update('flatNumber', v)}
              noDivider
            />
          </Card>
        </GridItem>

        {/* CONTACT */}
        <GridItem isWide={isWide}>
          <Card title={t('voter.surveyContact')}>
            <InputRow
              label={t('voter.mobile1')}
              value={data.secondaryMobileNumber}
              keyboardType="phone-pad"
              onChange={updateMobile}
              outlineColor={
                data.secondaryMobileNumber && !isValidMobile(data.secondaryMobileNumber)
                  ? theme.colors.error
                  : theme.colors.subtleBorder
              }
            />
            <InputRow
              label={t('voter.email')}
              value={data.email}
              onChange={(v) => update('email', v)}
              outlineColor={
                data.email && !isValidEmail(data.email)
                  ? theme.colors.error
                  : theme.colors.subtleBorder
              }
            />

            <Row label={t('voter.dob')} noDivider>
              <Pressable onPress={() => setDobOpen(true)} style={styles.dateField}>
                <Text style={styles.dateText}>
                  {data.dateOfBirth
                    ? formatForDisplay(data.dateOfBirth)
                    : t('voter.selectDate')}
                </Text>

                <Ionicons name="calendar-outline" size={16} />
              </Pressable>
            </Row>

            <DatePickerModal
              locale="en"
              mode="single"
              label={t('voter.selectDate')}
              saveLabel={t('save')}
              visible={dobOpen}
              date={data.dateOfBirth ? new Date(data.dateOfBirth) : maxDob}
              validRange={{
                endDate: maxDob
              }}
              onDismiss={() => setDobOpen(false)}
              onConfirm={({ date }) => {
                setDobOpen(false);
                if (date) {
                  update('dateOfBirth', toUtcIsoDate(date));
                }
              }}
            />
          </Card>
        </GridItem>

        {/* STATUS */}
        <GridItem isWide={isWide}>
          <Card title={t('voter.surveyStatus')}>
            <BooleanRow
              label={t('voter.deceased')}
              value={data.voterDied}
              onChange={(v) => update('voterDied', v)}
            />
            <BooleanRow
              label={t('voter.voted')}
              value={data.isVoted}
              onChange={(v) => update('isVoted', v)}
            />
            <BooleanRow
              label={t('voter.needsFollowUp')}
              value={data.needsFollowUp}
              onChange={(v) => update('needsFollowUp', v)}
              noDivider
            />
          </Card>
        </GridItem>

        {/* ADDITIONAL INFO */}
        <FullGridItem>
          <Card title={t('voter.additionalInfo')}>
            <InputRow
              label={t('voter.remarks')}
              multiline
              value={data.remarks}
              onChange={(v) => update('remarks', v)}
            />

            <Row label={t('voter.specialVisitDate')}>
              <Pressable
                onPress={() => setSpecialVisitOpen(true)}
                style={styles.dateField}
              >
                <Text style={styles.dateText}>
                  {data.specialVisitDate
                    ? formatForDisplay(data.specialVisitDate)
                    : t('voter.selectDate')}
                </Text>
                <Ionicons name="calendar-outline" size={16} />
              </Pressable>
            </Row>

            <InputRow
              label={t('voter.specialVisitRemarks')}
              multiline
              value={data.specialVisitRemarks}
              onChange={(v) => update('specialVisitRemarks', v)}
              noDivider
            />
            <DatePickerModal
              locale="en"
              mode="single"
              label={t('voter.selectDate')}
              saveLabel={t('save')}
              visible={specialVisitOpen}
              date={data.specialVisitDate ? new Date(data.specialVisitDate) : new Date()}
              onDismiss={() => setSpecialVisitOpen(false)}
              onConfirm={({ date }) => {
                setSpecialVisitOpen(false);
                if (date) {
                  update('specialVisitDate', toUtcIsoDate(date));
                }
              }}
            />
          </Card>
        </FullGridItem>

        {/* DEMANDS */}
        <FullGridItem>
          <Card title={t('voter.demands')}>
            {(data.demands ?? []).map((d, i) => {
              const isOpen = openDemands[i];

              return (
                <View key={i} style={styles.demandCard}>
                  {/* HEADER */}
                  <Pressable
                    style={styles.demandHeader}
                    onPress={() =>
                      setOpenDemands((prev) => ({
                        ...prev,
                        [i]: !prev[i]
                      }))
                    }
                  >
                    <Text style={styles.demandTitle} numberOfLines={1}>
                      {getDemandTitle(d, i)}
                    </Text>

                    <View style={styles.demandHeaderActions}>
                      {d.id && d.isResolved && (
                        <Chip
                          compact
                          style={styles.resolvedChip}
                          textStyle={styles.resolvedChipText}
                        >
                          {t('survey.resolved')}
                        </Chip>
                      )}

                      {!d.isResolved && d.id && (
                        <Pressable
                          onPress={() => toggleResolved(i)}
                          style={styles.resolveButton}
                        >
                          <Ionicons
                            name="checkmark-done-outline"
                            size={14}
                            color={theme.colors.white}
                          />
                          <Text style={styles.resolveText}>{t('survey.resolve')}</Text>
                        </Pressable>
                      )}

                      {!d.isResolved && (
                        <Pressable onPress={() => removeDemand(i)} hitSlop={10}>
                          <Ionicons
                            name="trash-outline"
                            size={18}
                            color={theme.colors.error}
                          />
                        </Pressable>
                      )}

                      <Ionicons
                        name={isOpen ? 'chevron-up-outline' : 'chevron-down-outline'}
                        size={18}
                        color={
                          d.isResolved
                            ? theme.colors.disabledText
                            : theme.colors.textPrimary
                        }
                      />
                    </View>
                  </Pressable>

                  {/* BODY */}
                  {isOpen && (
                    <>
                      <View style={[styles.demandRow, !isWide && styles.demandRowMobile]}>
                        <View style={styles.demandCol}>
                          <FixedLabel
                            label={t('survey.demandCategory')}
                            disabled={d.isResolved}
                          />
                          <FormDropdown
                            placeholder={t('placeholder.selectCategory')}
                            value={String(d.categoryId ?? '')}
                            options={demandCategories.map((c) => ({
                              label: t(`survey.demandCategories.${c.nameEn}`),
                              value: c.id
                            }))}
                            disabled={d.isResolved}
                            onSelect={(v) => {
                              updateDemand(i, {
                                categoryId: v,
                                demandId: undefined
                              });
                              if (v) loadDemands(v);
                            }}
                            noMargin
                            customOutline
                          />
                        </View>

                        <View style={styles.demandCol}>
                          <FixedLabel
                            label={t('survey.demand')}
                            disabled={d.isResolved}
                          />
                          <FormDropdown
                            placeholder={t('placeholder.selectDemand')}
                            value={String(d.demandId ?? '')}
                            options={(demandsByCategory[d.categoryId] ?? []).map((x) => ({
                              label: t(`survey.demands.${x.demandEn}`),
                              value: x.id
                            }))}
                            disabled={!d.categoryId || d.isResolved}
                            onSelect={(v) => updateDemand(i, { demandId: v })}
                            noMargin
                            customOutline
                          />
                        </View>
                      </View>

                      <TextInput
                        mode="outlined"
                        multiline
                        numberOfLines={3}
                        placeholder={t('survey.demandDescription')}
                        placeholderTextColor={theme.colors.placeholder}
                        value={d.description}
                        disabled={d.isResolved}
                        style={[
                          styles.demandDescriptionInput,
                          isAndroid && styles.demandDescriptionInputAndroid
                        ]}
                        onChangeText={(v) => updateDemand(i, { description: v })}
                      />
                    </>
                  )}
                </View>
              );
            })}

            {(data.demands?.length ?? 0) < 5 && (
              <Pressable onPress={addDemand} style={styles.addDemandBtn}>
                <Ionicons
                  name="add-circle-outline"
                  size={18}
                  color={theme.colors.primary}
                />
                <Text style={styles.addDemandText}>{t('survey.addDemand')}</Text>
              </Pressable>
            )}
          </Card>
        </FullGridItem>
      </View>

      {/* SAVE BAR */}
      <View style={styles.saveBar}>
        <View style={styles.saveRow}>
          <Pressable onPress={handleReset} style={styles.resetButton}>
            <Ionicons name="refresh-outline" size={18} color={theme.colors.primary} />
            <Text style={styles.resetText}>{t('reset')}</Text>
          </Pressable>

          <Pressable onPress={handleSave} style={styles.saveButton}>
            <Ionicons name="save-outline" size={18} color="white" />
            <Text style={styles.saveText}>{t('save')}</Text>
          </Pressable>
        </View>
      </View>
    </>
  );
}

/* ================= HELPERS ================= */

function GridItem({ isWide, children }: GridItemProps) {
  return (
    <View
      style={[
        rowStyles.gridItem,
        isWide ? rowStyles.gridItemWide : rowStyles.gridItemFull
      ]}
    >
      {children}
    </View>
  );
}

function FullGridItem({ children }: FullGridItemProps) {
  return <View style={rowStyles.gridItemFull}>{children}</View>;
}

function Card({ title, children }: CardProps) {
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ label, children, noDivider }: RowProps) {
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  return (
    <View style={[rowStyles.row, noDivider ? styles.rowNoDivider : styles.rowDivider]}>
      <Text style={rowStyles.label}>{label}</Text>
      <View style={rowStyles.value}>{children}</View>
    </View>
  );
}

function DropdownRow({
  label,
  children,
  noDivider
}: {
  label: string;
  children: React.ReactNode;
  noDivider?: boolean;
}) {
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  const { isWeb, isMobileWeb } = usePlatformInfo();

  if (isWeb && !isMobileWeb) {
    return (
      <Row label={label} noDivider={noDivider}>
        {children}
      </Row>
    );
  }

  return (
    <View style={[styles.mobileRowContainer, noDivider && styles.rowNoDivider]}>
      <Text style={styles.mobileRowLabel}>{label}</Text>
      {children}
    </View>
  );
}

function InputRow({
  label,
  onChange,
  multiline,
  noDivider,
  value,
  keyboardType,
  maxLength,
  outlineColor,
  ...props
}: InputRowProps) {
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  const { isWeb, isMobileWeb } = usePlatformInfo();
  const [selection, setSelection] = useState<{ start: number; end: number }>();

  if (isWeb && !isMobileWeb) {
    return (
      <Row label={label} noDivider={noDivider}>
        <TextInput
          {...props}
          value={value}
          dense
          mode="outlined"
          multiline={multiline}
          numberOfLines={multiline ? 4 : 1}
          maxLength={maxLength}
          onChangeText={onChange}
          selection={selection}
          onBlur={() => {
            setSelection({ start: 0, end: 0 });
          }}
          onFocus={() => {
            setSelection(undefined);
          }}
          outlineColor={outlineColor ?? theme.colors.subtleBorder}
          activeOutlineColor={theme.colors.primary}
          style={[styles.webInput, multiline && styles.webInputMultiline]}
        />
      </Row>
    );
  }

  return (
    <View style={[styles.mobileRowContainer, noDivider && styles.rowNoDivider]}>
      <Text style={styles.mobileRowLabel}>{label}</Text>

      <TextInput
        {...props}
        value={value}
        dense
        mode="outlined"
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        onChangeText={onChange}
        selection={selection}
        keyboardType={keyboardType}
        onBlur={() => {
          setSelection({ start: 0, end: 0 });
        }}
        onFocus={() => {
          setSelection(undefined);
        }}
        outlineColor={outlineColor ?? theme.colors.subtleBorder}
        activeOutlineColor={theme.colors.primary}
        style={[styles.mobileInput, multiline && styles.mobileInputMultiline]}
      />
    </View>
  );
}

function BooleanRow({ label, value, noDivider, onChange }: BooleanRowProps) {
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  const { t } = useTranslation();
  return (
    <Row label={label} noDivider={noDivider}>
      <View style={rowStyles.inlineWrap}>
        {[true, false].map((v) => (
          <Chip
            key={String(v)}
            compact
            selected={value === v}
            onPress={() => onChange(v)}
            style={value === v ? styles.booleanChipSelected : styles.booleanChip}
          >
            {v ? t('yes') : t('no')}
          </Chip>
        ))}
      </View>
    </Row>
  );
}

/* ================= STYLES ================= */

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12
  },
  label: {
    width: 170,
    fontSize: 14,
    color: '#888'
  },
  value: { flex: 1 },
  inlineWrap: { flexDirection: 'row', gap: 8 },
  gridItem: {
    padding: 8,
    alignSelf: 'stretch'
  },
  gridItemWide: {
    flexBasis: '50%'
  },
  gridItemFull: {
    flexBasis: '100%',
    padding: 8
  }
});

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    loadingContainer: {
      padding: 24
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'stretch',
      marginHorizontal: -8
    },

    card: {
      flex: 1,
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.subtleBorder,
      backgroundColor: theme.colors.paperBackground
    },

    sectionTitle: {
      fontSize: 15,
      fontWeight: '700',
      marginBottom: 10,
      color: theme.colors.textTertiary
    },
    rowDivider: {
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider
    },
    rowNoDivider: {
      borderBottomWidth: 0
    },
    mobileRowContainer: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
      gap: 6
    },
    mobileRowLabel: {
      fontSize: 14,
      color: '#888'
    },
    webInput: {
      minHeight: 44,
      maxHeight: 160,
      fontSize: 15,
      backgroundColor: theme.colors.white,
      textAlignVertical: 'top'
    },
    webInputMultiline: {
      minHeight: 80
    },
    mobileInput: {
      minHeight: 44,
      maxHeight: 180,
      fontSize: 14,
      backgroundColor: theme.colors.white,
      textAlignVertical: 'top',
      borderColor: theme.colors.subtleBorder
    },
    mobileInputMultiline: {
      minHeight: 90,
      paddingTop: 8
    },
    booleanChip: {
      backgroundColor: theme.colors.paperBackground
    },
    booleanChipSelected: {
      backgroundColor: theme.colors.softOrange
    },

    dateField: {
      height: 44,
      borderWidth: 1,
      borderColor: theme.colors.inputBorder,
      borderRadius: 6,
      paddingHorizontal: 10,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.colors.white
    },

    dateText: {
      fontSize: 14
    },

    demandCard: {
      marginBottom: 16,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.divider,
      backgroundColor: theme.colors.white
    },

    addDemandBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginVertical: 8
    },

    addDemandText: {
      color: theme.colors.primary,
      fontWeight: '600'
    },

    demandHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center'
    },

    demandHeaderActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12
    },

    demandHeaderRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8
    },

    demandTitle: {
      fontSize: 14,
      fontWeight: '600'
    },

    demandRow: {
      flexDirection: 'row',
      gap: 12,
      marginVertical: 12
    },

    demandRowMobile: {
      flexDirection: 'column'
    },

    demandCol: {
      flex: 1
    },

    removeDemand: {
      alignSelf: 'flex-end',
      marginTop: 6
    },

    saveBar: {
      marginTop: 16,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.divider,
      backgroundColor: theme.colors.white
    },

    saveRow: {
      flexDirection: 'row',
      gap: 12
    },

    resetButton: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 6
    },

    resetText: {
      color: theme.colors.primary,
      fontWeight: '600'
    },

    saveButton: {
      flex: 1,
      backgroundColor: theme.colors.primary,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 6
    },

    saveText: {
      color: theme.colors.white,
      fontWeight: '600'
    },

    resolveButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 8,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary
    },

    resolveText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.white
    },
    resolvedChip: {
      backgroundColor: theme.colors.successBackground
    },
    resolvedChipText: {
      fontSize: 12
    },
    demandDescriptionInput: {
      fontSize: 14,
      backgroundColor: theme.colors.white,
      paddingVertical: 0
    },
    demandDescriptionInputAndroid: {
      paddingVertical: 8
    }
  });
