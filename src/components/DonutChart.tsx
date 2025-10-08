import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import Svg, { G, Path, Text as SvgText } from "react-native-svg";
import colors from "../constants/colors";
import BarChart from "./BarChart";

const DonutChart = ({
  campaignsData,
  radius = 110,
  holeRadius = 55,
  width = 320,
  height = 200,
}) => {
  const aggregatedData = campaignsData.map((c) => ({
    label: c.campaignName,
    totalGeneratedVideos: c.totalGeneratedVideos,
    totalSentVideos: c.totalSentVideos,
    totalFailedVideos: c.totalFailedVideos,
  }));

  const totalValue = aggregatedData.reduce(
    (sum, d) => sum + d.totalGeneratedVideos,
    0
  );
  const [drilledSlice, setDrilledSlice] = useState(null);
  const sliceColors = [colors.primary, colors.primaryLight, colors.darkOrange];

  const createDonutPath = (startAngle, endAngle, radius) => {
    const startX = radius * Math.cos(startAngle);
    const startY = radius * Math.sin(startAngle);
    const endX = radius * Math.cos(endAngle);
    const endY = radius * Math.sin(endAngle);
    const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;
    return `M0,0 L${startX},${startY} A${radius},${radius} 0 ${largeArcFlag} 1 ${endX},${endY} Z`;
  };

  return (
    <View style={{ alignItems: "center", width: "100%" }}>
      {drilledSlice ? (
        <View style={{ width: "100%", alignItems: "center" }}>
          <BarChart
            data={[
              {
                label: drilledSlice.label,
                generated: drilledSlice.totalGeneratedVideos,
                sent: drilledSlice.totalSentVideos,
                failed: drilledSlice.totalFailedVideos,
              },
            ]}
            width={width}
            height={height}
            colors={[colors.primary, colors.primaryLight, colors.darkOrange]}
            titleColor={colors.primaryDark}
            centerSingleGroup={true}
          />

          <Pressable
            onPress={() => setDrilledSlice(null)}
            style={{
              marginTop: 12,
              paddingVertical: 8,
              paddingHorizontal: 16,
              backgroundColor: colors.primaryLight,
              borderRadius: 6,
            }}
          >
            <Text
              style={{ fontSize: 12, fontWeight: "600", color: colors.white }}
            >
              ⬅ Back
            </Text>
          </Pressable>
        </View>
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
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              marginTop: 16,
              justifyContent: "center",
            }}
          >
            {aggregatedData.map((d, i) => (
              <Pressable
                key={i}
                onPress={() => setDrilledSlice(d)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  margin: 6,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 6,
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
                    color: colors.primaryDark,
                    fontWeight: "600",
                  }}
                >
                  {d.label} ({d.totalGeneratedVideos})
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}
    </View>
  );
};

export default DonutChart;
