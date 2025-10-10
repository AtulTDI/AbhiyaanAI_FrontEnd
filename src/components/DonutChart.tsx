import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import Svg, { G, Path, Text as SvgText } from "react-native-svg";
import { useTranslation } from "react-i18next";
import colors from "../constants/colors";
import BarChart from "./BarChart";

const DonutChart = ({
  campaignsData,
  radius = 110,
  holeRadius = 55,
  width = 320,
  height = 200,
  noVideosGenerated = false,
}) => {
  const { t } = useTranslation();
  const [drilledSlice, setDrilledSlice] = useState(null);
  const [showAllLegends, setShowAllLegends] = useState(false);

  if (noVideosGenerated) {
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

  const aggregatedData =
    campaignsData?.map((c) => ({
      label: c.label || "Unknown",
      totalGeneratedVideos: c.generated ?? c.total ?? 0,
      totalSentVideos: c.sent ?? 0,
      totalFailedVideos: c.failed ?? 0,
    })) || [];

  const totalValue = aggregatedData.reduce(
    (sum, d) => sum + d.totalGeneratedVideos,
    0
  );

  const sliceColors = [colors.primary, colors.primaryLight, colors.darkOrange];

  const createDonutPath = (startAngle, endAngle, radius) => {
    const startX = radius * Math.cos(startAngle);
    const startY = radius * Math.sin(startAngle);
    const endX = radius * Math.cos(endAngle);
    const endY = radius * Math.sin(endAngle);
    const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;
    return `M0,0 L${startX},${startY} A${radius},${radius} 0 ${largeArcFlag} 1 ${endX},${endY} Z`;
  };

  const visibleLegends = showAllLegends
    ? aggregatedData
    : aggregatedData.slice(0, 4);

  return (
    <View style={{ alignItems: !drilledSlice && "center", width: "100%" }}>
      {drilledSlice ? (
        <>
          <BarChart
            data={[
              {
                label: drilledSlice.label,
                generated: drilledSlice.totalGeneratedVideos,
                sent: drilledSlice.totalSentVideos,
                failed: drilledSlice.totalFailedVideos,
              },
            ]}
            width={10}
            height={height}
            colors={[colors.primary, colors.primaryLight, colors.darkOrange]}
            titleColor={colors.primaryDark}
            noVideosGenerated={noVideosGenerated}
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
          {/* Donut Chart */}
          <Svg width={radius * 2.3} height={radius * 2.3}>
            <G transform={`translate(${radius * 1.15},${radius * 1.15})`}>
              {(() => {
                let cumulative = 0;
                return aggregatedData.map((d, i) => {
                  const startAngle = (cumulative / totalValue) * 2 * Math.PI;
                  cumulative += d.totalGeneratedVideos;
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
                      {d.totalGeneratedVideos / totalValue > 0.03 && (
                        <SvgText
                          x={labelX}
                          y={labelY}
                          fontSize="10"
                          fill={colors.white}
                          fontWeight="600"
                          textAnchor="middle"
                          alignmentBaseline="middle"
                          pointerEvents="none"
                        >
                          {d.totalGeneratedVideos}
                        </SvgText>
                      )}
                    </G>
                  );
                });
              })()}

              {/* Donut Hole */}
              <Path
                d={`M0,0 m-${holeRadius},0 a${holeRadius},${holeRadius} 0 1,0 ${
                  holeRadius * 2
                },0 a${holeRadius},${holeRadius} 0 1,0 -${holeRadius * 2},0`}
                fill={colors.white}
              />
            </G>
          </Svg>

          {/* Legends */}
          {aggregatedData.length > 0 && (
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
                        maxWidth: 120, // Prevent text overflow
                      }}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {d.label} ({d.totalGeneratedVideos})
                    </Text>
                  </Pressable>
                ))}
              </View>

              {aggregatedData.length > 4 && (
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