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
import { getDashboard } from "../api/dashboardApi";
import { extractErrorMessage } from "../utils/common";
import { useToast } from "../components/ToastProvider";
import BarChart from "../components/BarChart";
import DonutChart from "../components/DonutChart";
import colors from "../constants/colors";

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

  useFocusEffect(
    useCallback(() => {
      async function fetchDashboard() {
        try {
          const response = await getDashboard();
          setUserStats(
            response.data.perUserStats.map((user) => ({
              label: `${user.firstName} ${user.lastName}`,
              generated: user.totalGeneratedVideos,
              sent: user.totalSentVideos,
              failed: user.totalFailedVideos,
            }))
          );

          setAggregateTotals(response.data.aggregateTotals || {});
        } catch (error) {
          showToast(
            extractErrorMessage(error, "Error fetching stats"),
            "error"
          );
        }
      }
      fetchDashboard();
    }, [])
  );

  const campaignData = [
    {
      id: "c1",
      campaignName: "Campaign A",
      firstName: "Alice",
      lastName: "Smith",
      totalGeneratedVideos: 120,
      totalSentVideos: 100,
      totalFailedVideos: 5,
    },
    {
      id: "c3",
      campaignName: "Campaign B",
      firstName: "Charlie",
      lastName: "Brown",
      totalGeneratedVideos: 90,
      totalSentVideos: 85,
      totalFailedVideos: 4,
    },
    {
      id: "c5",
      campaignName: "Campaign C",
      firstName: "Ethan",
      lastName: "Davis",
      totalGeneratedVideos: 75,
      totalSentVideos: 65,
      totalFailedVideos: 3,
    },
    {
      id: "c7",
      campaignName: "Campaign D",
      firstName: "George",
      lastName: "Taylor",
      totalGeneratedVideos: 100,
      totalSentVideos: 90,
      totalFailedVideos: 5,
    },
    {
      id: "c9",
      campaignName: "Campaign E",
      firstName: "Ian",
      lastName: "Thomas",
      totalGeneratedVideos: 85,
      totalSentVideos: 75,
      totalFailedVideos: 4,
    },
    {
      id: "c11",
      campaignName: "Campaign F",
      firstName: "Kevin",
      lastName: "Martin",
      totalGeneratedVideos: 70,
      totalSentVideos: 60,
      totalFailedVideos: 2,
    },
    {
      id: "c12",
      campaignName: "Campaign G",
      firstName: "Laura",
      lastName: "Lee",
      totalGeneratedVideos: 55,
      totalSentVideos: 50,
      totalFailedVideos: 1,
    },
  ];

  const kpis = [
    {
      title: t("dashboard.generated"),
      value: aggregateTotals.totalGeneratedVideos,
    },
    { title: t("dashboard.sent"), value: aggregateTotals.totalSentVideos },
    { title: t("dashboard.failed"), value: aggregateTotals.totalFailedVideos },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* KPI CARDS */}
      {isWeb ? (
        // Web: all KPIs in one row
        <View style={[styles.kpiRow, { justifyContent: "space-between" }]}>
          {kpis.map((item, idx) => (
            <Card
              key={idx}
              style={[styles.kpiCard, { flex: 1, marginHorizontal: 8 }]}
            >
              <Text style={styles.kpiTitle}>{item.title}</Text>
              <Text style={styles.kpiValue}>{item.value}</Text>
            </Card>
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
          />
        )}
      </Card>

      {/* DONUT CHART */}
      {/* <Card style={styles.chartCard}>
        <Text style={styles.chartTitle}>{t("dashboard.videosByCampaign")}</Text>
        <DonutChart campaignsData={campaignData} radius={110} holeRadius={55} />
      </Card> */}
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
    marginBottom: 8,
  },
});

export default AdminDashboardScreen;
