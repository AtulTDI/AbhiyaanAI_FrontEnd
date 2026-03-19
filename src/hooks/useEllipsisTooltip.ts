import { usePlatformInfo } from './usePlatformInfo';
import { useCallback, useRef, useState } from 'react';

export function useEllipsisTooltip(cellKey: string) {
  const { isWeb, isMobileWeb } = usePlatformInfo();
  const textRef = useRef<HTMLElement | null>(null);
  const [visibleTooltip, setVisibleTooltip] = useState<string | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (isWeb && !isMobileWeb && textRef.current) {
      const el = textRef.current as HTMLElement;
      if (el.scrollWidth > el.clientWidth) {
        setVisibleTooltip(cellKey);
      }
    }
  }, [cellKey, isMobileWeb, isWeb]);

  const handleMouseLeave = useCallback(() => {
    setVisibleTooltip(null);
  }, []);

  const handleLongPress = useCallback(() => {
    if (!isWeb || isMobileWeb) {
      setVisibleTooltip(cellKey);
    }
  }, [cellKey, isMobileWeb, isWeb]);

  return {
    textRef,
    visibleTooltip,
    setVisibleTooltip,
    handleMouseEnter,
    handleMouseLeave,
    handleLongPress
  };
}
