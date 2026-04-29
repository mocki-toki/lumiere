import {
  DragEventHandler,
  MouseEventHandler,
  PointerEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { useCanHover } from './useCanHover';

const LONG_PRESS_MS = 500;
const MOVE_TOLERANCE_PX = 8;

type TouchLongPressContextMenuProps<T extends HTMLElement> = {
  'data-touch-context-menu': 'true';
  onPointerDown: PointerEventHandler<T>;
  onPointerMove: PointerEventHandler<T>;
  onPointerUp: PointerEventHandler<T>;
  onPointerCancel: PointerEventHandler<T>;
  onPointerLeave: PointerEventHandler<T>;
  onClickCapture: MouseEventHandler<T>;
  onDragStartCapture: DragEventHandler<T>;
};

export const useTouchLongPressContextMenu = <T extends HTMLElement>():
  TouchLongPressContextMenuProps<T> => {
  const canHover = useCanHover();
  const longPressTimerRef = useRef<number>();
  const longPressActiveRef = useRef(false);
  const longPressTriggeredRef = useRef(false);
  const targetRef = useRef<T>();
  const pointerRef = useRef<{ id: number; x: number; y: number }>();

  const clearLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = undefined;
    }
    longPressActiveRef.current = false;
    pointerRef.current = undefined;
    targetRef.current = undefined;
  }, []);

  useEffect(() => () => clearLongPress(), [clearLongPress]);

  return useMemo(
    () => ({
      'data-touch-context-menu': 'true' as const,
      onPointerDown: (event) => {
        if (canHover || event.pointerType !== 'touch') return;

        longPressTriggeredRef.current = false;
        longPressActiveRef.current = true;
        targetRef.current = event.currentTarget;
        pointerRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY };

        longPressTimerRef.current = window.setTimeout(() => {
          if (!longPressActiveRef.current || !targetRef.current || !pointerRef.current) return;

          longPressTriggeredRef.current = true;
          targetRef.current.dispatchEvent(
            new MouseEvent('contextmenu', {
              bubbles: true,
              cancelable: true,
              button: 2,
              clientX: pointerRef.current.x,
              clientY: pointerRef.current.y,
            })
          );
        }, LONG_PRESS_MS);
      },
      onPointerMove: (event) => {
        if (
          canHover ||
          event.pointerType !== 'touch' ||
          !longPressActiveRef.current ||
          !pointerRef.current ||
          pointerRef.current.id !== event.pointerId
        ) {
          return;
        }

        const movedX = Math.abs(event.clientX - pointerRef.current.x);
        const movedY = Math.abs(event.clientY - pointerRef.current.y);
        if (movedX > MOVE_TOLERANCE_PX || movedY > MOVE_TOLERANCE_PX) {
          clearLongPress();
        }
      },
      onPointerUp: (event) => {
        if (canHover || event.pointerType !== 'touch') return;
        clearLongPress();
      },
      onPointerCancel: (event) => {
        if (canHover || event.pointerType !== 'touch') return;
        clearLongPress();
      },
      onPointerLeave: (event) => {
        if (canHover || event.pointerType !== 'touch') return;
        clearLongPress();
      },
      onClickCapture: (event) => {
        if (!longPressTriggeredRef.current) return;
        longPressTriggeredRef.current = false;
        event.preventDefault();
        event.stopPropagation();
      },
      onDragStartCapture: (event) => {
        if (canHover) return;
        event.preventDefault();
      },
    }),
    [canHover, clearLongPress]
  );
};
