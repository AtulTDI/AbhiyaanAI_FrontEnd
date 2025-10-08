import React, { useEffect, useState, useRef } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import Svg, { G, Text as SvgText, Rect } from "react-native-svg";
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedProps,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";

const AnimatedRect = Animated.createAnimatedComponent(Rect);

const AnimatedBar = ({
  sharedValue,
  maxValue,
  chartHeight,
  x,
  barWidth,
  color,
  value,
  titleColor,
}) => {
  const animatedProps = useAnimatedProps(() => {
    const scaledHeight = (sharedValue.value / maxValue) * chartHeight;
    return { height: scaledHeight, y: -scaledHeight };
  });

  return (
    <G>
      <AnimatedRect
        animatedProps={animatedProps}
        x={x}
        width={barWidth}
        fill={color}
        rx={3}
      />
      {value > 0 && (
        <SvgText
          x={x + barWidth / 2}
          y={-(value / maxValue) * chartHeight - 10}
          fontSize="14"
          fill={titleColor}
          textAnchor="middle"
          fontWeight="600"
        >
          {value}
        </SvgText>
      )}
    </G>
  );
};

const BarChart = ({
  data,
  width,
  height,
  colors,
  titleColor,
  centerSingleGroup = false,
}) => {
  const { t } = useTranslation();
  const keys = ["generated", "sent", "failed"];
  const [visibleKeys, setVisibleKeys] = useState(keys);
  const screenWidth = Dimensions.get("window").width;

  const keyColors = {
    generated: colors[0],
    sent: colors[1],
    failed: colors[2],
  };

  const toggleKey = (key) => {
    setVisibleKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const animatedHeightsRef = useRef(
    data.map(() => keys.map(() => useSharedValue(0)))
  );
  const animatedHeights = animatedHeightsRef.current;

  useEffect(() => {
    if (animatedHeightsRef.current.length < data.length) {
      const extra = Array.from(
        { length: data.length - animatedHeightsRef.current.length },
        () => keys.map(() => useSharedValue(0))
      );
      animatedHeightsRef.current = [...animatedHeightsRef.current, ...extra];
    }
  }, [data.length]);

  useEffect(() => {
    data.forEach((d, i) => {
      keys.forEach((k, j) => {
        if (animatedHeights[i] && animatedHeights[i][j]) {
          animatedHeights[i][j].value = withSpring(d[k] || 0, { damping: 15 });
        }
      });
    });
  }, [data]);

  const maxValue = Math.max(
    1,
    ...data.flatMap((d) => visibleKeys.map((k) => d[k] || 0))
  );

  const topPadding = 20;
  const dynamicChartHeight = height;
  const barWidth = 24;
  const barSpacing = 12;
  const groupSpacing = 40;
  const fullGroupWidth = keys.length * (barWidth + barSpacing) + groupSpacing;

  const allZero =
    visibleKeys.length === 0 ||
    data.every((d) => visibleKeys.every((k) => (d[k] || 0) === 0));

  let offsetX = 0;
  if (centerSingleGroup && data.length === 1) {
    offsetX = screenWidth / 2 - fullGroupWidth / 2;
    if (offsetX < 0) offsetX = 0;
  }

  const chartWidth = data.length * fullGroupWidth;
  const svgWidth = Math.max(width, chartWidth);

  return (
    <View style={{ marginBottom: 24 }}>
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
                {k.charAt(0).toUpperCase() + k.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {allZero ? (
        <View
          style={{ height, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={{ color: titleColor, fontSize: 16, fontWeight: "600" }}>
            {t("dashboard.noData")}
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal={svgWidth > width || data.length > 1}
          showsHorizontalScrollIndicator={false}
        >
          <Svg
            height={dynamicChartHeight + 60}
            width={Math.max(svgWidth, screenWidth)}
          >
            <G y={dynamicChartHeight + topPadding} x={offsetX}>
              {data.map((d, i) => {
                const groupX = i * fullGroupWidth + barSpacing;
                return (
                  <G key={i}>
                    {visibleKeys.map((k, j) => {
                      const keyIndex = keys.indexOf(k);
                      if (!animatedHeights[i] || !animatedHeights[i][keyIndex])
                        return null;

                      const x = groupX + keyIndex * (barWidth + barSpacing);
                      const value = d[k] || 0;

                      return (
                        <AnimatedBar
                          key={j}
                          sharedValue={animatedHeights[i][keyIndex]}
                          maxValue={maxValue}
                          chartHeight={dynamicChartHeight - topPadding}
                          x={x}
                          barWidth={barWidth}
                          color={keyColors[k]}
                          value={value}
                          titleColor={titleColor}
                        />
                      );
                    })}

                    <SvgText
                      x={groupX + (keys.length * (barWidth + barSpacing)) / 2}
                      y={35}
                      fontSize="14"
                      fill={titleColor}
                      textAnchor="middle"
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