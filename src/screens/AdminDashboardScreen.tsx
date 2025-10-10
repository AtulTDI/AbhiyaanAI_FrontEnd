import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import { Card } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "@react-navigation/native";
import { getCampaignStats, getDashboard } from "../api/dashboardApi";
import { extractErrorMessage } from "../utils/common";
import { useToast } from "../components/ToastProvider";
import BarChart from "../components/BarChart";
import DonutChart from "../components/DonutChart";
import KPICard from "../components/KpiCard";
import colors from "../constants/colors";
import { getAuthData } from "../utils/storage";

const { width } = Dimensions.get("window");
const chartWidth = width - 64;
const isWeb = Platform.OS === "web";
const isSmallScreen = width < 600;

const AdminDashboardScreen = () => {
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
          ]);

          const dashboardData = dashboardResponse.data;
          const campaignData = campaignStatsResponse.data;

          setUserStats(
            dashboardData.perUserStats.map((user) => ({
              label: `${user.firstName} ${user.lastName}`,
              generated: user.totalGeneratedVideos,
              sent: user.totalSentVideos,
              failed: user.totalFailedVideos,
            }))
          );
          setAggregateTotals(dashboardData.aggregateTotals || {});

          setCampaignStats(
            campaignData.perCampaignStats.map((campaign) => ({
              label: campaign.campaignName,
              generated: campaign.totalGeneratedVideos,
              sent: campaign.totalSentVideos,
              failed: campaign.totalFailedVideos,
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

  return (
    <ScrollView style={styles.container}>
      {/* KPI CARDS */}
      {isWeb ? (
        // Web: all KPIs in one row
        <View style={[styles.kpiRow, { justifyContent: "space-between" }]}>
          {kpis.map((item, idx) => (
            <KPICard item={item} idx={idx} />
          ))}
        </View>
      ) : isSmallScreen ? (
        // Small Mobile: horizontal scroll
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
        // Tablet: 2x2 grid
        <View style={styles.kpiGrid}>
          {kpis.map((item, idx) => (
            <Card key={idx} style={styles.kpiCard}>
              <Text style={styles.kpiTitle}>{item.title}</Text>
              <Text style={styles.kpiValue}>{item.value}</Text>
            </Card>
          ))}
        </View>
      )}

      {/* BAR CHART */}
      <Card style={styles.chartCard}>
        <Text style={styles.chartTitle}>{t("dashboard.videosByUser")}</Text>
        {userStats.length > 0 && (
          <BarChart
            data={userStats}
            width={chartWidth}
            height={220}
            colors={[colors.primary, colors.primaryLight, colors.darkOrange]}
            titleColor={colors.primaryDark}
            noVideosGenerated={aggregateTotals.totalGeneratedVideos === 0}
          />
        )}
      </Card>

      {/* DONUT CHART */}
      <Card style={styles.chartCard}>
        <Text style={styles.chartTitle}>{t("dashboard.videosByCampaign")}</Text>
        <DonutChart
          campaignsData={campaignStats}
          radius={110}
          holeRadius={55}
          noVideosGenerated={aggregateTotals.totalGeneratedVideos === 0}
        />
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.white },
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
  kpiTitle: { fontSize: 16, fontWeight: "600", color: colors.primary },
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
