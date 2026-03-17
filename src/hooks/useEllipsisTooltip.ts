import { usePlatformInfo } from './usePlatformInfo';
import { useCallback, useRef, useState } from 'react';

export function useEllipsisTooltip(cellKey: string) {
  const { isWeb, isMobileWeb } = usePlatformInfo();
  const textRef = useRef<any>(null);
  const [visibleTooltip, setVisibleTooltip] = useState<string | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (isWeb && !isMobileWeb && textRef.current) {
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
    if (!isWeb || isMobileWeb) {
      setVisibleTooltip(cellKey);
    }
  }, [cellKey]);

  return {
    textRef,
    visibleTooltip,
    setVisibleTooltip,
    handleMouseEnter,
    handleMouseLeave,
    handleLongPress
  };
}
