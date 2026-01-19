import React, { useRef, memo } from "react";
import { ScrollView, View, Text, Dimensions } from "react-native";
import Svg, { G, Text as SvgText, Rect, Line } from "react-native-svg";
import { useTranslation } from "react-i18next";

const Bar = memo(
  ({ x, value, maxValue, chartHeight, width, color, titleColor }) => {
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
  data = [],
  width,
  height,
  barColor = "#3b82f6",
  titleColor = "#1f2937",
  noData = false,
  backgroundColor = "#fdfaf7",
}) => {
  const { t } = useTranslation();
  const screenWidth = Dimensions.get("window").width;
  const scrollRef = useRef(null);

  const topPadding = 30;
  const bottomPadding = 80;
  const leftPadding = 60;
  const rightPadding = 20;
  const dynamicChartHeight = height;

  const barWidth = 24;
  const groupSpacing = 60;

  const allZero = noData || data.every((d) => (d.value || 0) === 0);

  const rawMaxValue = Math.max(1, ...data.map((d) => d.value || 0));
  const visualMaxValue = rawMaxValue === 0 ? 1 : rawMaxValue * 1.1;

  const chartWidth = data.length * (barWidth + groupSpacing);
  const svgWidth = chartWidth + leftPadding + rightPadding;
  const scrollNeeded = svgWidth > screenWidth;
  const offsetX = leftPadding;

  const yStepCount = 5;
  const yStepValue = Math.ceil(rawMaxValue / yStepCount);
  const ySteps = Array.from(
    { length: yStepCount + 1 },
    (_, i) => i * yStepValue
  );

  const splitLabel = (label) => {
    if (!label) return ["", ""];

    const words = label.split(" ");
    if (words.length <= 2) {
      return [words.join(" "), ""];
    }

    const mid = Math.ceil(words.length / 2);
    const firstLine = words.slice(0, mid).join(" ");
    const secondLine = words.slice(mid).join(" ");

    return [firstLine, secondLine];
  };

  const renderChartContent = (svgW) => (
    <Svg height={dynamicChartHeight + bottomPadding} width={svgW}>
      <SvgText
        x={15}
        y={dynamicChartHeight / 2 + topPadding}
        fontSize="14"
        fill={titleColor}
        textAnchor="middle"
        transform={`rotate(-90, 15, ${dynamicChartHeight / 2 + topPadding})`}
        fontWeight="600"
      >
        {t("value") || "Value"}
      </SvgText>

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
              x2={svgW - rightPadding}
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

      <Line
        x1={leftPadding - 5}
        y1={dynamicChartHeight + topPadding}
        x2={svgW - rightPadding}
        y2={dynamicChartHeight + topPadding}
        stroke="#bbb"
        strokeWidth="1.5"
      />

      <G y={dynamicChartHeight + topPadding} x={offsetX}>
        {data.map((d, i) => {
          const x = i * (barWidth + groupSpacing);
          const [line1, line2] = splitLabel(d.label);

          return (
            <G key={i}>
              <Bar
                x={x}
                value={d.value || 0}
                maxValue={visualMaxValue}
                chartHeight={dynamicChartHeight}
                width={barWidth}
                color={d.color || barColor}
                titleColor={titleColor}
              />

              <SvgText
                x={x + barWidth / 2}
                y={25}
                fontSize="12"
                fill={titleColor}
                textAnchor="middle"
                fontWeight="500"
              >
                {line1}
              </SvgText>

              {line2 ? (
                <SvgText
                  x={x + barWidth / 2}
                  y={40}
                  fontSize="12"
                  fill={titleColor}
                  textAnchor="middle"
                  fontWeight="500"
                >
                  {line2}
                </SvgText>
              ) : null}
            </G>
          );
        })}
      </G>
    </Svg>
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
      {allZero ? (
        <View
          style={{ height, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={{ color: titleColor, fontSize: 16, fontWeight: "600" }}>
            {t("dashboard.noData")}
          </Text>
        </View>
      ) : scrollNeeded ? (
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={true}
          style={{ paddingHorizontal: 5 }}
          contentContainerStyle={{
            paddingBottom: 15,
            width: svgWidth,
          }}
        >
          {renderChartContent(svgWidth)}
        </ScrollView>
      ) : (
        <View style={{ paddingHorizontal: 5, paddingBottom: 15 }}>
          {renderChartContent(screenWidth - 10)}
        </View>
      )}
    </View>
  );
};

export default BarChart;
