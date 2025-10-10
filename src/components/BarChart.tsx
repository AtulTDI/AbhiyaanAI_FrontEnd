import React, { useState, useRef, memo } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import Svg, { G, Text as SvgText, Rect, Line } from "react-native-svg";
import { useTranslation } from "react-i18next";

const Bar = memo(
  ({ x, value, maxValue, chartHeight, width, color, titleColor }: any) => {
    const scaledHeight = (value / maxValue) * chartHeight;
    return (
      <G>
        <Rect
          x={x}
          y={-scaledHeight}
          width={width}
          height={scaledHeight}
          fill={color}
          rx={4}
        />
        {value > 0 && (
          <SvgText
            x={x + width / 2}
            y={-scaledHeight - 8}
            fontSize="12"
            fill={titleColor}
            textAnchor="middle"
            fontWeight="600"
          >
            {value}
          </SvgText>
        )}
      </G>
    );
  }
);

const BarChart = ({
  data,
  width,
  height,
  colors,
  titleColor,
  centerSingleGroup = false,
  noVideosGenerated,
  backgroundColor = "#fdfaf7",
}: any) => {
  const { t } = useTranslation();
  const keys = ["generated", "sent", "failed"];
  const [visibleKeys, setVisibleKeys] = useState(keys);
  const screenWidth = Dimensions.get("window").width;
  const scrollRef = useRef<ScrollView>(null);

  const keyColors: Record<string, string> = {
    generated: colors[0],
    sent: colors[1],
    failed: colors[2],
  };

  const toggleKey = (key: string) =>
    setVisibleKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );

  const topPadding = 30;
  const bottomPadding = 60;
  const leftPadding = 60;
  const rightPadding = 20;
  const dynamicChartHeight = height;
  const barWidth = 24;
  const barSpacing = 12;
  const groupSpacing = 30;
  const fullGroupWidth =
    keys.length * (barWidth + barSpacing) - barSpacing + groupSpacing;

  const allZero =
    visibleKeys.length === 0 ||
    data.every((d) => visibleKeys.every((k) => (d[k] || 0) === 0));

  const rawMaxValue = Math.max(
    1,
    ...data.flatMap((d) => visibleKeys.map((k) => d[k] || 0))
  );
  const visualMaxValue = rawMaxValue === 0 ? 1 : rawMaxValue * 1.1;

  let offsetX = leftPadding;
  if (centerSingleGroup && data.length === 1) {
    offsetX = screenWidth / 2 - fullGroupWidth / 2;
    if (offsetX < leftPadding) offsetX = leftPadding;
  }

  const chartWidth = data.length * fullGroupWidth;
  const svgWidth = Math.max(
    width,
    chartWidth + leftPadding + rightPadding,
    screenWidth
  );

  const yStepCount = 5;
  const yStepValue = Math.ceil(rawMaxValue / yStepCount);
  const ySteps = Array.from(
    { length: yStepCount + 1 },
    (_, i) => i * yStepValue
  );

  return (
    <View
      style={{
        backgroundColor,
        borderRadius: 12,
        paddingVertical: 10,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
      }}
    >
      {/* Legend */}
      {!noVideosGenerated && (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            marginBottom: 12,
            flexWrap: "wrap",
          }}
        >
          {keys.map((k) => {
            const active = visibleKeys.includes(k);
            return (
              <TouchableOpacity
                key={k}
                onPress={() => toggleKey(k)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginHorizontal: 10,
                  marginVertical: 4,
                  opacity: active ? 1 : 0.4,
                }}
              >
                <View
                  style={{
                    width: 14,
                    height: 14,
                    backgroundColor: keyColors[k],
                    borderRadius: 3,
                    marginRight: 6,
                  }}
                />
                <Text
                  style={{
                    fontWeight: active ? "bold" : "normal",
                    color: titleColor,
                  }}
                >
                  {t(`dashboard.status.${k}`)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {allZero || noVideosGenerated ? (
        <View
          style={{ height, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={{ color: titleColor, fontSize: 16, fontWeight: "600" }}>
            {t("dashboard.noData")}
          </Text>
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={true}
          style={{ paddingHorizontal: 5 }}
          contentContainerStyle={{ paddingBottom: 15, minWidth: svgWidth }}
        >
          <Svg height={dynamicChartHeight + bottomPadding} width={svgWidth}>
            {/* Y-axis label */}
            <SvgText
              x={15}
              y={dynamicChartHeight / 2 + topPadding}
              fontSize="14"
              fill={titleColor}
              textAnchor="middle"
              transform={`rotate(-90, 15, ${
                dynamicChartHeight / 2 + topPadding
              })`}
              fontWeight="600"
            >
              {t("videoCount")}
            </SvgText>

            {/* Grid lines */}
            {ySteps.map((y, i) => {
              const yPos =
                dynamicChartHeight -
                (y / visualMaxValue) * dynamicChartHeight +
                topPadding;
              return (
                <G key={`grid-${i}`}>
                  <Line
                    x1={leftPadding - 5}
                    y1={yPos}
                    x2={svgWidth - rightPadding}
                    y2={yPos}
                    stroke="#e0e0e0"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <SvgText
                    x={leftPadding - 10}
                    y={yPos + 4}
                    fontSize="12"
                    fill="#888"
                    textAnchor="end"
                  >
                    {y}
                  </SvgText>
                </G>
              );
            })}

            {/* X-axis line */}
            <Line
              x1={leftPadding - 5}
              y1={dynamicChartHeight + topPadding}
              x2={svgWidth - rightPadding}
              y2={dynamicChartHeight + topPadding}
              stroke="#bbb"
              strokeWidth="1.5"
            />

            {/* Bars */}
            <G y={dynamicChartHeight + topPadding} x={offsetX}>
              {data.map((d, i) => {
                const groupX = i * fullGroupWidth;
                return (
                  <G key={i}>
                    {visibleKeys.map((k) => {
                      const keyIndex = keys.indexOf(k);
                      const x = groupX + keyIndex * (barWidth + barSpacing);
                      const value = d[k] || 0;
                      return (
                        <Bar
                          key={k}
                          x={x}
                          value={value}
                          maxValue={visualMaxValue}
                          chartHeight={dynamicChartHeight}
                          width={barWidth}
                          color={keyColors[k]}
                          titleColor={titleColor}
                        />
                      );
                    })}
                    <SvgText
                      x={
                        groupX +
                        (keys.length * (barWidth + barSpacing)) / 2 -
                        barSpacing / 2
                      }
                      y={20}
                      fontSize="13"
                      fill={titleColor}
                      textAnchor="middle"
                      fontWeight="500"
                    >
                      {d.label}
                    </SvgText>
                  </G>
                );
              })}
            </G>
          </Svg>
        </ScrollView>
      )}
    </View>
  );
};

export default BarChart;