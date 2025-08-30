import React, { useRef, useEffect, useState } from "react";
import { Text, TouchableOpacity, Platform, StyleSheet } from "react-native";
import { useTheme } from "react-native-paper";
import Tooltip from "react-native-walkthrough-tooltip";
import { AppTheme } from "../theme";

type EllipsisCellProps = {
  cellKey: string;
  width: number;
  value: string | React.ReactNode;
  visibleTooltip: string | null;
  setVisibleTooltip: (key: string | null) => void;
  textStyle: any;
  tableWithSelection: boolean;
};

export function EllipsisCell({
  cellKey,
  width,
  value,
  visibleTooltip,
  setVisibleTooltip,
  textStyle,
  tableWithSelection
}: EllipsisCellProps) {
  const theme = useTheme<AppTheme>();
  const styles = createStyles(theme);
  const textRef = useRef<any>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    if (Platform.OS === "web" && textRef.current) {
      const el = textRef.current as HTMLElement;
      setIsTruncated(el.scrollWidth > el.clientWidth);
    }
  }, [value, width]);

  const handleMouseEnter = () => {
    if (Platform.OS === "web" && isTruncated && !tableWithSelection) {
      setVisibleTooltip(cellKey);
    }
  };

  return (
    <Tooltip
      isVisible={visibleTooltip === cellKey}
      content={<Text style={styles.tooltipText}>{value}</Text>}
      placement="top"
      onClose={() => setVisibleTooltip(null)}
      contentStyle={styles.tooltipContent}
      backgroundColor="transparent"
      disableShadow={true}
    >
      <TouchableOpacity
        style={{ width }}
        activeOpacity={0.8}
        onLongPress={() => Platform.OS !== "web" && setVisibleTooltip(cellKey)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setVisibleTooltip(null)}
      >
        <Text
          ref={textRef}
          style={[
            textStyle,
            {
              maxWidth: width,
              overflow: !tableWithSelection ? "hidden" : "visible !important",
              cursor: isTruncated ? "pointer" : "default",
            },
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {value}
        </Text>
      </TouchableOpacity>
    </Tooltip>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    tooltipContent: {
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
      paddingVertical: 6,
      paddingHorizontal: 10,
      maxWidth: 250,
    },
    tooltipText: {
      color: theme.colors.white,
      fontSize: 13,
      lineHeight: 18,
    },
  });
