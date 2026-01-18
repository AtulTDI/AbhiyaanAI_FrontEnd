import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import Svg, { G, Path, Text as SvgText } from "react-native-svg";
import { useTranslation } from "react-i18next";
import colors from "../constants/colors";
import BarChart from "./BarChart";

const DonutChart = ({
  data = [],
  radius = 110,
  holeRadius = 55,
  width = 320,
  height = 200,
  noData = false,
}) => {
  const { t } = useTranslation();
  const [drilledSlice, setDrilledSlice] = useState(null);
  const [showAllLegends, setShowAllLegends] = useState(false);

  if (noData) {
    return (
      <View style={{ height, justifyContent: "center", alignItems: "center" }}>
        <Text
          style={{
            color: colors.primaryDark,
            fontSize: 16,
            fontWeight: "600",
          }}
        >
          {t("dashboard.noData")}
        </Text>
      </View>
    );
  }

  const totalValue = data.reduce((sum, d) => sum + (d.value || 0), 0);

  const sliceColors = [
    colors.primary,
    colors.primaryLight,
    colors.darkOrange,
    colors.softOrange,
    "#22c55e",
    "#6366f1",
  ];

  const createDonutPath = (startAngle, endAngle, radius) => {
    const startX = radius * Math.cos(startAngle);
    const startY = radius * Math.sin(startAngle);
    const endX = radius * Math.cos(endAngle);
    const endY = radius * Math.sin(endAngle);
    const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;

    return `M0,0 L${startX},${startY} A${radius},${radius} 0 ${largeArcFlag} 1 ${endX},${endY} Z`;
  };

  const visibleLegends = showAllLegends ? data : data.slice(0, 4);

  return (
    <View style={{ alignItems: !drilledSlice && "center", width: "100%" }}>
      {drilledSlice ? (
        <>
          <BarChart
            data={[
              {
                label: drilledSlice.label,
                value: drilledSlice.value,
              },
            ]}
            width={10}
            height={height}
            barColor={colors.primary}
            titleColor={colors.primaryDark}
          />

          <View style={{ width: "100%", alignItems: "center" }}>
            <Pressable
              onPress={() => setDrilledSlice(null)}
              style={{
                marginTop: 12,
                paddingVertical: 8,
                paddingHorizontal: 16,
                backgroundColor: colors.primary,
                borderRadius: 8,
              }}
            >
              <Text
                style={{ fontSize: 12, fontWeight: "600", color: colors.white }}
              >
                ⬅ {t("back")}
              </Text>
            </Pressable>
          </View>
        </>
      ) : (
        <>
          {/* Donut */}
          <Svg width={radius * 2.3} height={radius * 2.3}>
            <G transform={`translate(${radius * 1.15},${radius * 1.15})`}>
              {(() => {
                let cumulative = 0;
                return data.map((d, i) => {
                  const startAngle = (cumulative / totalValue) * 2 * Math.PI;
                  cumulative += d.value;
                  const endAngle = (cumulative / totalValue) * 2 * Math.PI;
                  const midAngle = (startAngle + endAngle) / 2;
                  const labelRadius = radius * 0.75;
                  const labelX = labelRadius * Math.cos(midAngle);
                  const labelY = labelRadius * Math.sin(midAngle);

                  return (
                    <G key={i}>
                      <Path
                        d={createDonutPath(startAngle, endAngle, radius)}
                        fill={sliceColors[i % sliceColors.length]}
                      />

                      {d.value / totalValue > 0.03 && (
                        <SvgText
                          x={labelX}
                          y={labelY}
                          fontSize="10"
                          fill={colors.white}
                          fontWeight="600"
                          textAnchor="middle"
                          alignmentBaseline="middle"
                        >
                          {d.value}
                        </SvgText>
                      )}
                    </G>
                  );
                });
              })()}

              {/* Hole */}
              <Path
                d={`M0,0 m-${holeRadius},0 a${holeRadius},${holeRadius} 0 1,0 ${
                  holeRadius * 2
                },0 a${holeRadius},${holeRadius} 0 1,0 -${holeRadius * 2},0`}
                fill={colors.white}
              />
            </G>
          </Svg>

          {/* Legends */}
          {data.length > 0 && (
            <View style={{ marginTop: 16, alignItems: "center" }}>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  justifyContent: "center",
                }}
              >
                {visibleLegends.map((d, i) => (
                  <Pressable
                    key={i}
                    onPress={() => setDrilledSlice(d)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      margin: 6,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 8,
                      backgroundColor: colors.softOrange,
                      borderWidth: 1,
                      borderColor: colors.primaryLight,
                    }}
                  >
                    <View
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 7,
                        backgroundColor: sliceColors[i % sliceColors.length],
                        marginRight: 6,
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 12,
                        color: colors.darkerGrayText,
                        fontWeight: "600",
                        maxWidth: 120,
                      }}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {d.label} ({d.value})
                    </Text>
                  </Pressable>
                ))}
              </View>

              {data.length > 4 && (
                <Pressable
                  onPress={() => setShowAllLegends(!showAllLegends)}
                  style={{ marginTop: 8 }}
                >
                  <Text
                    style={{
                      color: colors.primary,
                      fontWeight: "600",
                      fontSize: 12,
                    }}
                  >
                    {showAllLegends
                      ? t("dashboard.showLess") || "Show Less ▲"
                      : t("dashboard.showMore") || "Show More ▼"}
                  </Text>
                </Pressable>
              )}
            </View>
          )}
        </>
      )}
    </View>
  );
};

export default DonutChart;
