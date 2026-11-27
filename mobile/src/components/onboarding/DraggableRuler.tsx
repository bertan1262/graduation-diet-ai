import React, { useRef, useState } from 'react';
import { View, Text, Animated, GestureResponderEvent } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ThemeColors } from '../../constants/colors';
import { Spacing, BorderRadius, Typography } from '../../constants/theme';

export interface DraggableRulerProps {
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  theme: ThemeColors;
  onChange: (newValStr: string) => void;
  onDragStateChange?: (dragging: boolean) => void;
}

const TICK_SLOT_WIDTH = 12;

/**
 * Smooth Interactive Tape-Measure Horizontal Ruler (Cal AI / Calz Style)
 * Swiping LEFT (-dx) increases the value; swiping RIGHT (+dx) decreases the value.
 * Uses continuous sub-pixel Animated translation for 60fps fluid gliding with haptic tick clicks.
 */
export const DraggableRuler: React.FC<DraggableRulerProps> = ({
  value,
  min,
  max,
  step,
  unit,
  theme,
  onChange,
  onDragStateChange,
}) => {
  const touchStartRef = useRef({ x: 0, y: 0 });
  const grantPageXRef = useRef(0);
  const startValueRef = useRef(value);
  const lastEmittedStrRef = useRef(
    step < 1 ? value.toFixed(1) : String(Math.round(value))
  );
  const [subPixelAnim] = useState(() => new Animated.Value(0));
  const [isDragging, setIsDragging] = useState(false);

  const handleTouchStart = (evt: GestureResponderEvent) => {
    touchStartRef.current = {
      x: evt.nativeEvent.pageX,
      y: evt.nativeEvent.pageY,
    };
  };

  const handleMoveShouldSetResponder = (evt: GestureResponderEvent) => {
    const dx = evt.nativeEvent.pageX - touchStartRef.current.x;
    const dy = evt.nativeEvent.pageY - touchStartRef.current.y;
    return Math.abs(dx) > 3 && Math.abs(dx) > Math.abs(dy);
  };

  const handleResponderGrant = (evt: GestureResponderEvent) => {
    grantPageXRef.current = evt.nativeEvent.pageX;
    startValueRef.current = value;
    lastEmittedStrRef.current =
      step < 1 ? value.toFixed(1) : String(Math.round(value));
    subPixelAnim.setValue(0);
    setIsDragging(true);
    onDragStateChange?.(true);
    Haptics.selectionAsync().catch(() => {});
  };

  const handleResponderMove = (evt: GestureResponderEvent) => {
    const dx = evt.nativeEvent.pageX - grantPageXRef.current;
    // Natural tape-measure direction:
    // Dragging LEFT (-dx) pulls higher values from the right -> INCREASES value
    // Dragging RIGHT (+dx) pulls lower values from the left -> DECREASES value
    const exactStepsDelta = -dx / TICK_SLOT_WIDTH;
    const exactNext = Math.max(
      min,
      Math.min(max, startValueRef.current + exactStepsDelta * step)
    );

    const snappedStepsFromMin = Math.round((exactNext - min) / step);
    const snappedVal = Math.max(
      min,
      Math.min(max, min + snappedStepsFromMin * step)
    );

    // Continuous sub-step remainder in [-0.5, +0.5] steps -> pixel shift
    const remainderSteps = (exactNext - snappedVal) / step;
    subPixelAnim.setValue(-remainderSteps * TICK_SLOT_WIDTH);

    const formatted =
      step < 1
        ? Number(snappedVal.toFixed(1)).toString()
        : String(Math.round(snappedVal));

    if (formatted !== lastEmittedStrRef.current) {
      lastEmittedStrRef.current = formatted;
      Haptics.selectionAsync().catch(() => {});
      onChange(formatted);
    }
  };

  const finishDrag = () => {
    setIsDragging(false);
    onDragStateChange?.(false);
    Animated.spring(subPixelAnim, {
      toValue: 0,
      useNativeDriver: true,
      speed: 28,
      bounciness: 4,
    }).start();
  };

  // Generate 29 ticks centered around current value
  const totalTicks = 29;
  const centerIdx = 14;

  return (
    <View
      onTouchStart={handleTouchStart}
      onStartShouldSetResponder={() => false}
      onMoveShouldSetResponder={handleMoveShouldSetResponder}
      onResponderTerminationRequest={() => false}
      onResponderGrant={handleResponderGrant}
      onResponderMove={handleResponderMove}
      onResponderRelease={finishDrag}
      onResponderTerminate={finishDrag}
      style={{
        marginTop: Spacing.xs,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.sm,
        borderRadius: BorderRadius.lg,
        backgroundColor: theme.surfaceSubtle,
        borderWidth: 1.5,
        borderColor: isDragging ? theme.primary : theme.border,
        overflow: 'hidden',
      }}
    >
      {/* Center Pointer Triangle */}
      <View style={{ alignItems: 'center', marginBottom: 2 }}>
        <Text style={{ fontSize: 10, color: theme.primary, fontWeight: '900' }}>
          ▼
        </Text>
      </View>

      {/* Smooth Gliding Tick Strip with Fixed Center Indicator */}
      <View
        style={{
          height: 32,
          alignItems: 'center',
          justifyContent: 'flex-end',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <Animated.View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            height: 30,
            transform: [{ translateX: subPixelAnim }],
          }}
        >
          {Array.from({ length: totalTicks }).map((_, idx) => {
            const offsetSteps = idx - centerIdx;
            const tickVal = Math.round((value + offsetSteps * step) * 10) / 10;
            const outOfBounds = tickVal < min || tickVal > max;
            const numericTickIndex = Math.round(tickVal / step);
            const isTenMajor = numericTickIndex % 10 === 0;
            const isFiveMajor = numericTickIndex % 5 === 0;

            return (
              <View
                key={idx}
                style={{
                  width: TICK_SLOT_WIDTH,
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  height: 30,
                  opacity: outOfBounds ? 0.18 : 1,
                }}
              >
                <View
                  style={{
                    width: isTenMajor ? 2.5 : isFiveMajor ? 2 : 1.5,
                    height: isTenMajor ? 22 : isFiveMajor ? 16 : 10,
                    backgroundColor: isTenMajor
                      ? theme.textPrimary
                      : isFiveMajor
                      ? theme.textSecondary
                      : theme.border,
                    borderRadius: 2,
                  }}
                />
              </View>
            );
          })}
        </Animated.View>

        {/* Fixed Center Indicator Needle */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            bottom: 0,
            width: 3.5,
            height: 29,
            borderRadius: 2,
            backgroundColor: theme.primary,
          }}
        />
      </View>

      {/* Dynamic Scale Labels Under Ruler */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingHorizontal: 2,
          marginTop: 5,
        }}
      >
        <Text style={{ ...Typography.tiny, fontSize: 10, color: theme.textMuted }}>
          {Math.max(min, Math.round((value - step * 10) * 10) / 10)} {unit}
        </Text>
        <Text
          style={{
            ...Typography.tiny,
            fontSize: 10,
            fontWeight: '700',
            color: isDragging ? theme.primary : theme.textSecondary,
          }}
        >
          ← Sola Kaydır (+) • Sağa Kaydır (−) →
        </Text>
        <Text style={{ ...Typography.tiny, fontSize: 10, color: theme.textMuted }}>
          {Math.min(max, Math.round((value + step * 10) * 10) / 10)} {unit}
        </Text>
      </View>
    </View>
  );
};
