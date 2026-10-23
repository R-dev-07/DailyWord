import { useCallback, useMemo, useRef } from 'react';
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

/**
 * Props for a ScrollView that calls `onReached` once its bottom has been on screen
 * (including content short enough to fit without scrolling). Used to mark a chapter as read.
 */
export function useReachedEnd(enabled: boolean, onReached: () => void) {
  const metrics = useRef({ offset: 0, view: 0, content: 0 });
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const callbackRef = useRef(onReached);
  callbackRef.current = onReached;

  const check = useCallback(() => {
    const { offset, view, content } = metrics.current;
    if (enabledRef.current && view > 0 && content > 0 && offset + view >= content - 48) callbackRef.current();
  }, []);

  const props = useMemo(() => ({
    scrollEventThrottle: 200,
    onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => { metrics.current.offset = event.nativeEvent.contentOffset.y; check(); },
    onLayout: (event: LayoutChangeEvent) => { metrics.current.view = event.nativeEvent.layout.height; check(); },
    onContentSizeChange: (_width: number, height: number) => { metrics.current.content = height; check(); },
  }), [check]);

  const reset = useCallback(() => { metrics.current.offset = 0; }, []);
  return { props, reset };
}
