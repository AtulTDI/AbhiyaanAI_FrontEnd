import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Card } from "react-native-paper";
import colors from "../constants/colors";

const KPICard = ({ item, idx }) => {
  return (
    <Card key={idx} style={styles.kpiCard}>
      <View style={styles.cardContent}>
        <Text style={styles.kpiTitle}>{item.title}</Text>
        <Text style={styles.kpiValue}>{item.value}</Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  kpiCard: {
    flex: 1,
    marginHorizontal: 8,
    borderRadius: 16,
    backgroundColor: colors.paperBackground,
    borderWidth: 1,
    borderColor: colors.mutedBorder,
    elevation: 3,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  cardContent: {
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  kpiTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#d97706",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  kpiValue: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.primary,
  },
});

export default KPICard;
