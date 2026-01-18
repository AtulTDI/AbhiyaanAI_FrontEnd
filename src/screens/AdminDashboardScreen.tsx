import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Dimensions } from "react-native";
import { Card } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "@react-navigation/native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { Ionicons } from "@expo/vector-icons";

import {
  getCampaignStats,
  getDashboard,
  getVoterDashboardSummary,
} from "../api/dashboardApi";
import { extractErrorMessage } from "../utils/common";
import { useToast } from "../components/ToastProvider";
import BarChart from "../components/BarChart";
import DonutChart from "../components/DonutChart";
import KPICard from "../components/KpiCard";
import colors from "../constants/colors";
import { usePlatformInfo } from "../hooks/usePlatformInfo";
import { getAuthData } from "../utils/storage";

const { width } = Dimensions.get("window");
const chartWidth = width - 64;
const isSmallScreen = width < 600;

const Tab = createMaterialTopTabNavigator();

/**
 * -------------------------------
 * MAIN WRAPPER WITH TABS + IONICONS (OPTION 1)
 * -------------------------------
 */
const AdminDashboardScreen = () => {
  return (
    <Tab.Navigator
      id="adminDashboardTabs"
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.primaryLight,

        tabBarIndicatorStyle: {
          backgroundColor: colors.primary,
          height: 4,
          borderRadius: 2,
        },

        tabBarLabelStyle: {
          fontSize: 14,
          fontWeight: "700",
          textTransform: "none",
        },

        tabBarItemStyle: {
          paddingVertical: 8,
        },

        tabBarStyle: {
          backgroundColor: colors.white,
          elevation: 4,
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 6,
        },
      }}
    >
      <Tab.Screen
        name="Voters"
        component={VoterDashboardContent}
        options={{
          tabBarLabel: ({ color }) => (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name="people"
                size={16}
                color={color}
                style={{ marginRight: 6 }}
              />
              <Text style={{ fontWeight: "700", color }}>Voters</Text>
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="Videos"
        component={VideoDashboardContent}
        options={{
          tabBarLabel: ({ color }) => (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name="videocam"
                size={16}
                color={color}
                style={{ marginRight: 6 }}
              />
              <Text style={{ fontWeight: "700", color }}>Videos</Text>
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

/**
 * -------------------------------
 * VIDEO DASHBOARD (UNCHANGED LOGIC)
 * -------------------------------
 */
const VideoDashboardContent = () => {
  const { isWeb } = usePlatformInfo();
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [userStats, setUserStats] = useState([]);
  const [aggregateTotals, setAggregateTotals] = useState({
    totalGeneratedVideos: 0,
    totalSentVideos: 0,
    totalFailedVideos: 0,
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
            getVoterDashboardSummary(),
          ]);

          const dashboardData = dashboardResponse.data;
          const campaignData = campaignStatsResponse.data;

          setUserStats(
            dashboardData.perUserStats.map((user) => ({
              label: `${user.firstName} ${user.lastName}`,
              value: user.totalGeneratedVideos,
            }))
          );

          setAggregateTotals(dashboardData.aggregateTotals || {});

          setCampaignStats(
            campaignData.perCampaignStats.map((campaign) => ({
              label: campaign.campaignName,
              value: campaign.totalGeneratedVideos,
            }))
          );
        } catch (error) {
          showToast(
            extractErrorMessage(error, t("dashboard.fetchDataFail")),
            "error"
          );
        }
      }

      fetchDashboardData();
    }, [])
  );

  const kpis = [
    {
      title: t("dashboard.status.generated"),
      value: aggregateTotals.totalGeneratedVideos,
    },
    {
      title: t("dashboard.status.sent"),
      value: aggregateTotals.totalSentVideos,
    },
    {
      title: t("dashboard.status.failed"),
      value: aggregateTotals.totalFailedVideos,
    },
  ];

  const noData = aggregateTotals.totalGeneratedVideos === 0;

  return (
    <ScrollView style={styles.container}>
      {isWeb ? (
        <View style={[styles.kpiRow, { justifyContent: "space-between" }]}>
          {kpis.map((item, idx) => (
            <KPICard key={idx} item={item} idx={idx} />
          ))}
        </View>
      ) : isSmallScreen ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 20 }}
        >
          {kpis.map((item, idx) => (
            <Card
              key={idx}
              style={[styles.kpiCard, { width: 140, marginRight: 12 }]}
            >
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
        <Text style={styles.chartTitle}>{t("dashboard.videosByUser")}</Text>
        {userStats.length > 0 && (
          <BarChart
            data={userStats}
            width={chartWidth}
            height={220}
            barColor={colors.primary}
            titleColor={colors.primaryDark}
            noData={noData}
          />
        )}
      </Card>

      <Card style={styles.chartCard}>
        <Text style={styles.chartTitle}>{t("dashboard.videosByCampaign")}</Text>
        <DonutChart
          data={campaignStats}
          radius={110}
          holeRadius={55}
          noData={noData}
        />
      </Card>
    </ScrollView>
  );
};

/**
 * -------------------------------
 * VOTER DASHBOARD (UNCHANGED LOGIC)
 * -------------------------------
 */
const VoterDashboardContent = () => {
  const { isWeb } = usePlatformInfo();
  const { showToast } = useToast();
  const [voterData, setVoterData] = useState(null);

  useFocusEffect(
    useCallback(() => {
      async function fetchVoterDashboard() {
        try {
          const response = await getVoterDashboardSummary();
          setVoterData(response.data);
        } catch (error) {
          showToast(extractErrorMessage(error), "error");
        }
      }
      fetchVoterDashboard();
    }, [])
  );

  if (!voterData) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text>Loading...</Text>
      </View>
    );
  }

  const noData = voterData.totalVoters === 0;

  const kpis = [
    { title: "Total Voters", value: voterData.totalVoters },
    { title: "Verified", value: voterData.verification.verified },
    { title: "Surveyed", value: voterData.survey.surveyed },
    { title: "Star Voters", value: voterData.starVoters.count },
  ];

  const genderData = [
    { label: "Male", value: voterData.genderStats.male },
    { label: "Female", value: voterData.genderStats.female },
    { label: "Other", value: voterData.genderStats.other },
  ];

  const verificationData = [
    { label: "Verified", value: voterData.verification.verified },
    { label: "Unverified", value: voterData.verification.unverified },
  ];

  const surveyData = [
    { label: "Surveyed", value: voterData.survey.surveyed },
    { label: "Pending", value: voterData.survey.pending },
  ];

  const ageGroupData = [
    { label: "18-25", value: voterData.ageGroups.age18To25 },
    { label: "26-35", value: voterData.ageGroups.age26To35 },
    { label: "36-45", value: voterData.ageGroups.age36To45 },
    { label: "46-60", value: voterData.ageGroups.age46To60 },
    { label: "60+", value: voterData.ageGroups.age60Plus },
  ];

  const supportData = [
    { label: "Ours", value: voterData.supportStats.ours },
    { label: "Neutral", value: voterData.supportStats.neutral },
    { label: "Opponent", value: voterData.supportStats.opponent },
    { label: "Undecided", value: voterData.supportStats.undecided },
    { label: "Out of Station", value: voterData.supportStats.outOfstation },
    { label: "Beneficiary", value: voterData.supportStats.beneficiary },
  ];

  return (
    <ScrollView style={styles.container}>
      {isWeb ? (
        <View style={[styles.kpiRow, { justifyContent: "space-between" }]}>
          {kpis.map((item, idx) => (
            <KPICard key={idx} item={item} idx={idx} />
          ))}
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 20 }}
        >
          {kpis.map((item, idx) => (
            <Card
              key={idx}
              style={[styles.kpiCard, { width: 160, marginRight: 12 }]}
            >
              <Text style={styles.kpiTitle}>{item.title}</Text>
              <Text style={styles.kpiValue}>{item.value}</Text>
            </Card>
          ))}
        </ScrollView>
      )}

      <View
        style={{
          flexDirection: isWeb ? "row" : "column",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <Card style={[styles.chartCard, { flex: 1 }]}>
          <Text style={styles.chartTitle}>Voters by Gender</Text>
          <DonutChart
            data={genderData}
            radius={110}
            holeRadius={55}
            noData={noData}
          />
        </Card>

        <Card style={[styles.chartCard, { flex: 1 }]}>
          <Text style={styles.chartTitle}>Verification Status</Text>
          <DonutChart
            data={verificationData}
            radius={110}
            holeRadius={55}
            noData={noData}
          />
        </Card>

        <Card style={[styles.chartCard, { flex: 1 }]}>
          <Text style={styles.chartTitle}>Survey Status</Text>
          <DonutChart
            data={surveyData}
            radius={110}
            holeRadius={55}
            noData={noData}
          />
        </Card>
      </View>

      <Card style={styles.chartCard}>
        <Text style={styles.chartTitle}>Voters by Age Group</Text>
        <BarChart
          data={ageGroupData}
          width={chartWidth}
          height={220}
          barColor={colors.primary}
          titleColor={colors.primaryDark}
          noData={noData}
        />
      </Card>

      <Card style={styles.chartCard}>
        <Text style={styles.chartTitle}>Voters by Support Type</Text>
        <BarChart
          data={supportData}
          width={chartWidth}
          height={220}
          barColor={colors.primary}
          titleColor={colors.primaryDark}
          noData={noData}
        />
      </Card>
    </ScrollView>
  );
};

/* -------- STYLES (UNCHANGED) -------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.white,
  },
  kpiRow: {
    flexDirection: "row",
    marginBottom: 20,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  kpiCard: {
    flexBasis: "48%",
    padding: 18,
    borderRadius: 14,
    backgroundColor: colors.white,
    elevation: 8,
    marginBottom: 12,
  },
  kpiTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 6,
    color: colors.primaryDark,
  },
  chartCard: {
    marginBottom: 20,
    borderRadius: 14,
    backgroundColor: colors.white,
    elevation: 10,
    padding: 12,
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.primary,
    textAlign: "left",
    marginBottom: 12,
  },
});

export default AdminDashboardScreen;
