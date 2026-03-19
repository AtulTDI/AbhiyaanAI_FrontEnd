import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { G, Path, Text as SvgText } from 'react-native-svg';

import { useTranslation } from 'react-i18next';

import colors from '../constants/colors';
import BarChart from './BarChart';

const DonutChart = ({
  data = [],
  radius = 110,
  holeRadius = 55,
  width: _width = 320,
  height = 200,
  noData = false
}) => {
  const { t } = useTranslation();
  const [drilledSlice, setDrilledSlice] = useState(null);
  const [showAllLegends, setShowAllLegends] = useState(false);
  const styles = createStyles(height, !!drilledSlice);

  if (noData) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>{t('dashboard.noData')}</Text>
      </View>
    );
  }

  const totalValue = data.reduce((sum, d) => sum + (d.value || 0), 0);

  const sliceColors = [
    colors.primary,
    colors.primaryLight,
    colors.darkOrange,
    colors.softOrange,
    '#22c55e',
    '#6366f1'
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

  const getLegendDotStyle = (backgroundColor: string) => ({
    ...styles.legendDot,
    backgroundColor
  });

  return (
    <View style={drilledSlice ? styles.rootDrilled : styles.rootCentered}>
      {drilledSlice ? (
        <>
          <BarChart
            data={[
              {
                label: drilledSlice.label,
                value: drilledSlice.value
              }
            ]}
            height={height}
            barColor={colors.primary}
            titleColor={colors.primaryDark}
          />

          <View style={styles.drilldownActions}>
            <Pressable onPress={() => setDrilledSlice(null)} style={styles.backButton}>
              <Text style={styles.backButtonText}>⬅ {t('back')}</Text>
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
            <View style={styles.legendsContainer}>
              <View style={styles.legendsGrid}>
                {visibleLegends.map((d, i) => (
                  <Pressable
                    key={i}
                    onPress={() => setDrilledSlice(d)}
                    style={styles.legendItem}
                  >
                    <View
                      style={getLegendDotStyle(sliceColors[i % sliceColors.length])}
                    />
                    <Text
                      style={styles.legendLabel}
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
                  style={styles.showMoreButton}
                >
                  <Text style={styles.showMoreText}>
                    {showAllLegends
                      ? t('dashboard.showLess') || 'Show Less ▲'
                      : t('dashboard.showMore') || 'Show More ▼'}
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

const createStyles = (height: number, isDrilled: boolean) =>
  StyleSheet.create({
    emptyState: {
      height,
      justifyContent: 'center' as const,
      alignItems: 'center' as const
    },
    emptyText: {
      color: colors.primaryDark,
      fontSize: 16,
      fontWeight: '600' as const
    },
    rootCentered: {
      alignItems: 'center' as const,
      width: '100%'
    },
    rootDrilled: {
      width: '100%',
      alignItems: isDrilled ? undefined : ('center' as const)
    },
    drilldownActions: {
      width: '100%',
      alignItems: 'center' as const
    },
    backButton: {
      marginTop: 12,
      paddingVertical: 8,
      paddingHorizontal: 16,
      backgroundColor: colors.primary,
      borderRadius: 8
    },
    backButtonText: {
      fontSize: 12,
      fontWeight: '600' as const,
      color: colors.white
    },
    legendsContainer: {
      marginTop: 16,
      alignItems: 'center' as const
    },
    legendsGrid: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      justifyContent: 'center' as const
    },
    legendItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      margin: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: colors.softOrange,
      borderWidth: 1,
      borderColor: colors.primaryLight
    },
    legendDot: {
      width: 14,
      height: 14,
      borderRadius: 7,
      marginRight: 6
    },
    legendLabel: {
      fontSize: 12,
      color: colors.darkerGrayText,
      fontWeight: '600' as const,
      maxWidth: 120
    },
    showMoreButton: {
      marginTop: 8
    },
    showMoreText: {
      color: colors.primary,
      fontWeight: '600' as const,
      fontSize: 12
    }
  });

export default DonutChart;
