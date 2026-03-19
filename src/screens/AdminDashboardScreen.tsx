import {
  getCampaignStats,
  getDashboard,
  getVoterDashboardSummary
} from '../api/dashboardApi';
import BarChart from '../components/BarChart';
import DonutChart from '../components/DonutChart';
import KPICard from '../components/KpiCard';
import { useToast } from '../components/ToastProvider';
import colors from '../constants/colors';
import { usePlatformInfo } from '../hooks/usePlatformInfo';
import { extractErrorMessage } from '../utils/common';
import { getAuthData } from '../utils/storage';
import { Ionicons } from '@expo/vector-icons';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from 'react-native-paper';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 600;

const Tab = createMaterialTopTabNavigator();

const AdminDashboardScreen = () => {
  const { t } = useTranslation();
  const [showVideoCampaign, setShowVideoCampaign] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      const { showVideoCampaign: videoCampaign } = await getAuthData();
      setShowVideoCampaign(String(videoCampaign) === 'true');
    })();
  }, []);

  return (
    <Tab.Navigator
      id="adminDashboardTabs"
      screenOptions={{
        swipeEnabled: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.primaryLight,
        tabBarIndicatorStyle: styles.tabIndicator,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        tabBarStyle: styles.tabBar
      }}
    >
      <Tab.Screen
        name="Voters"
        component={VoterDashboardContent}
        options={{
          tabBarLabel: ({ color }) => (
            <View style={styles.tabLabelRow}>
              <Ionicons name="people" size={16} color={color} style={styles.tabIcon} />
              <Text style={[styles.tabLabelText, { color }]}>
                {t('dashboard.voter.totalVoters')}
              </Text>
            </View>
          )
        }}
      />

      {showVideoCampaign && (
        <Tab.Screen
          name="Videos"
          component={VideoDashboardContent}
          options={{
            tabBarLabel: ({ color }) => (
              <View style={styles.tabLabelRow}>
                <Ionicons
                  name="videocam"
                  size={16}
                  color={color}
                  style={styles.tabIcon}
                />
                <Text style={[styles.tabLabelText, { color }]}>
                  {t('dashboard.videosByUser')}
                </Text>
              </View>
            )
          }}
        />
      )}
    </Tab.Navigator>
  );
};

/* ===================== VIDEO DASHBOARD ===================== */

const VideoDashboardContent = () => {
  const { isWeb } = usePlatformInfo();
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [userStats, setUserStats] = useState([]);
  const [aggregateTotals, setAggregateTotals] = useState({
    totalGeneratedVideos: 0,
    totalSentVideos: 0,
    totalFailedVideos: 0
  });
  const [campaignStats, setCampaignStats] = useState([]);

  useFocusEffect(
    useCallback(() => {
      async function fetchDashboardData() {
        try {
          const { userId } = await getAuthData();

          const [dashboardResponse, campaignStatsResponse] = await Promise.all([
            getDashboard(userId),
            getCampaignStats(userId),
            getVoterDashboardSummary()
          ]);

          const dashboardData = dashboardResponse.data;
          const campaignData = campaignStatsResponse.data;

          setUserStats(
            dashboardData.perUserStats.map((user) => ({
              label: `${user.firstName} ${user.lastName}`,
              value: user.totalGeneratedVideos
            }))
          );

          setAggregateTotals(dashboardData.aggregateTotals || {});

          setCampaignStats(
            campaignData.perCampaignStats.map((campaign) => ({
              label: campaign.campaignName,
              value: campaign.totalGeneratedVideos
            }))
          );
        } catch (error) {
          showToast(extractErrorMessage(error, t('dashboard.fetchDataFail')), 'error');
        }
      }

      fetchDashboardData();
    }, [showToast, t])
  );

  const kpis = [
    {
      title: t('dashboard.status.generated'),
      value: aggregateTotals.totalGeneratedVideos
    },
    { title: t('dashboard.status.sent'), value: aggregateTotals.totalSentVideos },
    { title: t('dashboard.status.failed'), value: aggregateTotals.totalFailedVideos }
  ];

  const noData = aggregateTotals.totalGeneratedVideos === 0;

  return (
    <ScrollView style={styles.container}>
      {isWeb ? (
        <View style={styles.kpiRowSpaced}>
          {kpis.map((item, idx) => (
            <KPICard key={idx} item={item} idx={idx} />
          ))}
        </View>
      ) : isSmallScreen ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.kpiScrollView}
        >
          {kpis.map((item, idx) => (
            <Card key={idx} style={styles.kpiCardSmall}>
              <Text style={styles.kpiTitle}>{item.title}</Text>
              <Text style={styles.kpiValue}>{item.value}</Text>
            </Card>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.kpiGrid}>
          {kpis.map((item, idx) => (
            <Card key={idx} style={styles.kpiCard}>
              <Text style={styles.kpiTitle}>{item.title}</Text>
              <Text style={styles.kpiValue}>{item.value}</Text>
            </Card>
          ))}
        </View>
      )}

      <Card style={styles.chartCard}>
        <Text style={styles.chartTitle}>{t('dashboard.videosByUser')}</Text>
        {userStats.length > 0 && (
          <BarChart
            data={userStats}
            height={220}
            barColor={colors.primary}
            titleColor={colors.primaryDark}
            noData={noData}
          />
        )}
      </Card>

      <Card style={styles.chartCard}>
        <Text style={styles.chartTitle}>{t('dashboard.videosByCampaign')}</Text>
        <DonutChart data={campaignStats} radius={110} holeRadius={55} noData={noData} />
      </Card>
    </ScrollView>
  );
};

/* ===================== VOTER DASHBOARD ===================== */

const VoterDashboardContent = () => {
  const { isWeb } = usePlatformInfo();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [voterData, setVoterData] = useState(null);

  useFocusEffect(
    useCallback(() => {
      async function fetchVoterDashboard() {
        try {
          const response = await getVoterDashboardSummary();
          setVoterData(response.data);
        } catch (error) {
          showToast(extractErrorMessage(error), 'error');
        }
      }
      fetchVoterDashboard();
    }, [showToast])
  );

  if (!voterData) {
    return (
      <View style={styles.loadingContainer}>
        <Text>{t('dashboard.voter.loading')}</Text>
      </View>
    );
  }

  const noData = voterData.totalVoters === 0;

  const kpis = [
    { title: t('dashboard.voter.totalVoters'), value: voterData.totalVoters },
    { title: t('dashboard.voter.verified'), value: voterData.verification.verified },
    { title: t('dashboard.voter.surveyed'), value: voterData.survey.surveyed },
    { title: t('dashboard.voter.starVoters'), value: voterData.starVoters.count }
  ];

  const genderData = [
    { label: t('dashboard.voter.male'), value: voterData.genderStats.male },
    { label: t('dashboard.voter.female'), value: voterData.genderStats.female },
    { label: t('dashboard.voter.other'), value: voterData.genderStats.other }
  ];

  const verificationData = [
    { label: t('dashboard.voter.verified'), value: voterData.verification.verified },
    { label: t('dashboard.voter.pending'), value: voterData.verification.unverified }
  ];

  const surveyData = [
    { label: t('dashboard.voter.surveyed'), value: voterData.survey.surveyed },
    { label: t('dashboard.voter.pending'), value: voterData.survey.pending }
  ];

  const ageGroupData = [
    { label: t('dashboard.voter.ageGroups.18_25'), value: voterData.ageGroups.age18To25 },
    { label: t('dashboard.voter.ageGroups.26_35'), value: voterData.ageGroups.age26To35 },
    { label: t('dashboard.voter.ageGroups.36_45'), value: voterData.ageGroups.age36To45 },
    { label: t('dashboard.voter.ageGroups.46_60'), value: voterData.ageGroups.age46To60 },
    {
      label: t('dashboard.voter.ageGroups.60_plus'),
      value: voterData.ageGroups.age60Plus
    }
  ];

  const supportData = [
    {
      label: t('dashboard.voter.support.ours'),
      value: voterData.supportStats.ours.count,
      color: voterData.supportStats.ours.color
    },
    {
      label: t('dashboard.voter.support.opponent'),
      value: voterData.supportStats.opponent.count,
      color: voterData.supportStats.opponent.color
    },
    {
      label: t('dashboard.voter.support.neutral'),
      value: voterData.supportStats.neutral.count,
      color: voterData.supportStats.neutral.color
    },
    {
      label: t('dashboard.voter.support.unknown'),
      value: voterData.supportStats.unknown.count,
      color: voterData.supportStats.unknown.color
    },
    {
      label: t('dashboard.voter.support.outOfStation'),
      value: voterData.supportStats.outOfStation.count,
      color: voterData.supportStats.outOfStation.color
    },
    {
      label: t('dashboard.voter.support.needSpecialVisit'),
      value: voterData.supportStats.needSpecialVisit.count,
      color: voterData.supportStats.needSpecialVisit.color
    },
    {
      label: t('dashboard.voter.support.beneficiary'),
      value: voterData.supportStats.beneficiary.count,
      color: voterData.supportStats.beneficiary.color
    }
  ];

  const casteData = voterData.casteStats.map((c) => ({
    label: c.casteId ? t(`survey.castes.${c.casteNameEn}`) : c.casteNameEn,
    value: c.count
  }));

  return (
    <ScrollView style={styles.container}>
      {isWeb ? (
        <View style={styles.kpiRowSpaced}>
          {kpis.map((item, idx) => (
            <KPICard key={idx} item={item} idx={idx} />
          ))}
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.kpiScrollView}
        >
          {kpis.map((item, idx) => (
            <Card key={idx} style={styles.kpiCardVoter}>
              <Text style={styles.kpiTitle}>{item.title}</Text>
              <Text style={styles.kpiValue}>{item.value}</Text>
            </Card>
          ))}
        </ScrollView>
      )}

      <View style={isWeb ? styles.chartsRowWeb : styles.chartsRowMobile}>
        <Card style={[styles.chartCard, styles.chartCardFlex]}>
          <Text style={styles.chartTitle}>{t('dashboard.voter.votersByGender')}</Text>
          <DonutChart data={genderData} radius={110} holeRadius={55} noData={noData} />
        </Card>

        <Card style={[styles.chartCard, styles.chartCardFlex]}>
          <Text style={styles.chartTitle}>{t('dashboard.voter.verificationStatus')}</Text>
          <DonutChart
            data={verificationData}
            radius={110}
            holeRadius={55}
            noData={noData}
          />
        </Card>

        <Card style={[styles.chartCard, styles.chartCardFlex]}>
          <Text style={styles.chartTitle}>{t('dashboard.voter.surveyStatus')}</Text>
          <DonutChart data={surveyData} radius={110} holeRadius={55} noData={noData} />
        </Card>
      </View>

      <Card style={styles.chartCard}>
        <Text style={styles.chartTitle}>{t('dashboard.voter.votersByAgeGroup')}</Text>
        <BarChart
          data={ageGroupData}
          height={220}
          barColor={colors.primary}
          titleColor={colors.primaryDark}
          noData={noData}
        />
      </Card>

      <Card style={styles.chartCard}>
        <Text style={styles.chartTitle}>{t('dashboard.voter.votersBySupportType')}</Text>
        <BarChart
          data={supportData}
          height={220}
          barColor={colors.primary}
          titleColor={colors.primaryDark}
          noData={noData}
        />
      </Card>

      <Card style={styles.chartCard}>
        <Text style={styles.chartTitle}>{t('dashboard.voter.votersByCaste')}</Text>
        <BarChart
          data={casteData}
          height={220}
          barColor={colors.primary}
          titleColor={colors.primaryDark}
          noData={noData}
        />
      </Card>
    </ScrollView>
  );
};

/* -------- STYLES -------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.white
  },
  loadingContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center'
  },

  // Tab bar
  tabBar: {
    backgroundColor: colors.white,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6
  },
  tabIndicator: {
    backgroundColor: colors.primary,
    height: 4,
    borderRadius: 2
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'none'
  },
  tabItem: {
    paddingVertical: 8
  },
  tabLabelRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  tabIcon: {
    marginRight: 6
  },
  tabLabelText: {
    fontWeight: '700'
  },

  // KPI
  kpiRow: {
    flexDirection: 'row',
    marginBottom: 20
  },
  kpiRowSpaced: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  kpiScrollView: {
    marginBottom: 20
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  kpiCard: {
    flexBasis: '48%',
    padding: 18,
    borderRadius: 14,
    backgroundColor: colors.white,
    elevation: 8,
    marginBottom: 12
  },
  kpiCardSmall: {
    width: 140,
    marginRight: 12,
    padding: 18,
    borderRadius: 14,
    backgroundColor: colors.white,
    elevation: 8,
    marginBottom: 12
  },
  kpiCardVoter: {
    width: 160,
    marginRight: 12,
    padding: 18,
    borderRadius: 14,
    backgroundColor: colors.white,
    elevation: 8,
    marginBottom: 12
  },
  kpiTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 6,
    color: colors.primaryDark
  },

  // Charts
  chartCard: {
    marginBottom: 20,
    borderRadius: 14,
    backgroundColor: colors.white,
    elevation: 10,
    padding: 12
  },
  chartCardFlex: {
    flex: 1
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'left',
    marginBottom: 12
  },
  chartsRowWeb: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16
  },
  chartsRowMobile: {
    flexDirection: 'column',
    gap: 16
  }
});

export default AdminDashboardScreen;
