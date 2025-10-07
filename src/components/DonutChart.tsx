import React, { useState } from "react";
import { View, Text, Platform, Pressable } from "react-native";
import Svg, { G, Path, Text as SvgText } from "react-native-svg";
import colors from "../constants/colors";

const DonutChart = ({
  data,
  radius = 110,
  holeRadius = 55,
  textColor = colors.textPrimary,
}) => {
  const totalValue = data.reduce((s, d) => s + d.value, 0);
  const [enabledSlices, setEnabledSlices] = useState(data.map(() => true));
  const [selectedSlice, setSelectedSlice] = useState(null);

  const sliceColors = [colors.primary, colors.primaryLight, colors.darkOrange];

  return (
    <View style={{ alignItems: "center" }}>
      <Svg width={radius * 2.3} height={radius * 2.3}>
        <G transform={`translate(${radius * 1.15},${radius * 1.15})`}>
          {(() => {
            let cumulative = 0;
            return data.map((d, i) => {
              const startAngle = (cumulative / totalValue) * 2 * Math.PI;
              cumulative += d.value;
              const endAngle = (cumulative / totalValue) * 2 * Math.PI;
              const midAngle = (startAngle + endAngle) / 2;

              const startX = radius * Math.cos(startAngle);
              const startY = radius * Math.sin(startAngle);
              const endX = radius * Math.cos(endAngle);
              const endY = radius * Math.sin(endAngle);
              const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;
              const path = `M0,0 L${startX},${startY} A${radius},${radius} 0 ${largeArcFlag} 1 ${endX},${endY} Z`;

              const labelRadius = radius * 0.75;
              const labelX = labelRadius * Math.cos(midAngle);
              const labelY = labelRadius * Math.sin(midAngle);

              const isEnabled = enabledSlices[i];

              // Web vs Mobile press handling
              if (Platform.OS === "web") {
                return (
                  <G
                    key={i}
                    onMouseEnter={() => isEnabled && setSelectedSlice(d)}
                    onMouseLeave={() => setSelectedSlice(null)}
                  >
                    <Path
                      d={path}
                      fill={
                        isEnabled ? sliceColors[i % sliceColors.length] : "#ccc"
                      }
                    />
                    {isEnabled && d.value / totalValue > 0.03 && (
                      <SvgText
                        x={labelX}
                        y={labelY}
                        fontSize="10"
                        fill={textColor}
                        fontWeight="600"
                        textAnchor="middle"
                        alignmentBaseline="middle"
                        pointerEvents="none"
                      >
                        {d.value}
                      </SvgText>
                    )}
                  </G>
                );
              } else {
                return (
                  <G key={i}>
                    <Path
                      d={path}
                      fill={
                        isEnabled ? sliceColors[i % sliceColors.length] : "#ccc"
                      }
                      onPress={() => isEnabled && setSelectedSlice(d)}
                    />
                    {isEnabled && d.value / totalValue > 0.03 && (
                      <SvgText
                        x={labelX}
                        y={labelY}
                        fontSize="10"
                        fill={textColor}
                        fontWeight="600"
                        textAnchor="middle"
                        alignmentBaseline="middle"
                        pointerEvents="none"
                      >
                        {d.value}
                      </SvgText>
                    )}
                  </G>
                );
              }
            });
          })()}

          {/* Hole */}
          <Path
            d={`M0,0 m-${holeRadius},0 a${holeRadius},${holeRadius} 0 1,0 ${
              holeRadius * 2
            },0 a${holeRadius},${holeRadius} 0 1,0 -${holeRadius * 2},0`}
            fill="white"
          />
        </G>
      </Svg>

      {selectedSlice && (
        <View
          style={{
            marginTop: 8,
            padding: 6,
            backgroundColor: "#f0f0f0",
            borderRadius: 6,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: "600", color: "#333" }}>
            {selectedSlice.label}: {selectedSlice.value}
          </Text>
        </View>
      )}

      {/* Legends */}
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          marginTop: 12,
          justifyContent: "center",
        }}
      >
        {data.map((d, i) => (
          <Pressable
            key={i}
            onPress={() =>
              setEnabledSlices((prev) =>
                prev.map((v, idx) => (idx === i ? !v : v))
              )
            }
            style={{ flexDirection: "row", alignItems: "center", margin: 4 }}
          >
            <View
              style={{
                width: 14,
                height: 14,
                borderRadius: 7,
                backgroundColor: enabledSlices[i]
                  ? sliceColors[i % sliceColors.length]
                  : "#ccc",
                marginRight: 4,
              }}
            />
            <Text
              style={{
                fontSize: 12,
                color: enabledSlices[i] ? "#333" : "#aaa",
              }}
            >
              {d.label} ({d.value})
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

export default DonutChart;
