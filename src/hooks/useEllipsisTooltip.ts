import { useRef, useState, useCallback } from "react";
import { Platform } from "react-native";

export function useEllipsisTooltip(cellKey: string) {
  const textRef = useRef<any>(null);
  const [visibleTooltip, setVisibleTooltip] = useState<string | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (Platform.OS === "web" && textRef.current) {
      const el = textRef.current as HTMLElement;
      if (el.scrollWidth > el.clientWidth) {
        setVisibleTooltip(cellKey);
      }
    }
  }, [cellKey]);

  const handleMouseLeave = useCallback(() => {
    setVisibleTooltip(null);
  }, []);

  const handleLongPress = useCallback(() => {
    if (Platform.OS !== "web") {
      setVisibleTooltip(cellKey);
    }
  }, [cellKey]);

  return {
    textRef,
    visibleTooltip,
    setVisibleTooltip,
    handleMouseEnter,
    handleMouseLeave,
    handleLongPress,
  };
}
