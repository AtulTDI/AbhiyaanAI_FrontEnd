import { AppTheme } from '../theme';
import React, { useEffect, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity
} from 'react-native';
import { useTheme } from 'react-native-paper';
import Tooltip from 'react-native-walkthrough-tooltip';

type EllipsisCellProps = {
  cellKey: string;
  width: number;
  value: string | React.ReactNode;
  visibleTooltip: string | null;
  setVisibleTooltip: (key: string | null) => void;
  textStyle: StyleProp<TextStyle>;
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
  const textRef = useRef<Text | null>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web' && textRef.current) {
      const el = textRef.current as unknown as HTMLElement;
      setIsTruncated(el.scrollWidth > el.clientWidth);
    }
  }, [value, width]);

  const handleMouseEnter = () => {
    if (Platform.OS === 'web' && isTruncated && !tableWithSelection) {
      setVisibleTooltip(cellKey);
    }
  };

  const Ellipsis = () => (
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
        style={[styles.touchable, { width }]}
        activeOpacity={0.8}
        onLongPress={() => Platform.OS !== 'web' && setVisibleTooltip(cellKey)}
      >
        <Text
          ref={textRef}
          style={[
            textStyle,
            styles.cellText,
            { maxWidth: width },
            !tableWithSelection ? styles.cellTextHidden : styles.cellTextVisible,
            isTruncated ? styles.cursorPointer : styles.cursorDefault
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {value}
        </Text>
      </TouchableOpacity>
    </Tooltip>
  );

  if (Platform.OS === 'web') {
    return (
      <Pressable onHoverIn={handleMouseEnter} onHoverOut={() => setVisibleTooltip(null)}>
        <Ellipsis />
      </Pressable>
    );
  }

  return <Ellipsis />;
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    touchable: {
      // width is dynamic, set inline
    },
    cellText: {
      // maxWidth is dynamic, set inline
    },
    cellTextHidden: {
      overflow: 'hidden'
    },
    cellTextVisible: {
      overflow: 'visible' as 'hidden' | 'visible' | 'scroll' | undefined
    },
    cursorPointer: {
      cursor: 'pointer'
    },
    cursorDefault: {
      cursor: 'auto'
    },
    tooltipContent: {
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
      paddingVertical: 6,
      paddingHorizontal: 10,
      maxWidth: 250
    },
    tooltipText: {
      color: theme.colors.white,
      fontSize: 13,
      lineHeight: 18
    }
  });
