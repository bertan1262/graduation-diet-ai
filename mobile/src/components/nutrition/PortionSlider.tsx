import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
  LayoutChangeEvent,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';

export interface PortionSliderProps {
  value: number;
  baseValue: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (grams: number) => void;
}

export const PortionSlider: React.FC<PortionSliderProps> = ({
  value,
  baseValue,
  min = 50,
  max = 2000,
  step = 10,
  onChange,
}) => {
  const [trackWidth, setTrackWidth] = useState<number>(0);
  const trackWidthRef = useRef<number>(0);
  const startValueRef = useRef<number>(value);

  // Clamp helper
  const clamp = (val: number, minimum: number, maximum: number) => {
    return Math.min(Math.max(val, minimum), maximum);
  };

  // PanResponder for direct 60fps touch dragging (Zero async measure lag)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_evt, gestureState) => Math.abs(gestureState.dx) > 1,
      // Prevent parent ScrollView from canceling the horizontal drag gesture
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        startValueRef.current = value;
        // Direct tap seek if tapped on the track
        if (trackWidthRef.current > 0 && evt.nativeEvent.locationX !== undefined) {
          const progress = clamp(evt.nativeEvent.locationX / trackWidthRef.current, 0, 1);
          const tappedGrams = min + progress * (max - min);
          const stepped = Math.round(tappedGrams / step) * step;
          const finalVal = clamp(stepped, min, max);
          startValueRef.current = finalVal;
          onChange(finalVal);
        }
      },
      onPanResponderMove: (_evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        if (trackWidthRef.current > 0) {
          const deltaGrams = (gestureState.dx / trackWidthRef.current) * (max - min);
          const rawGrams = startValueRef.current + deltaGrams;
          const stepped = Math.round(rawGrams / step) * step;
          onChange(clamp(stepped, min, max));
        }
      },
    })
  ).current;

  const onTrackLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setTrackWidth(w);
    trackWidthRef.current = w;
  };

  const progressPercent = clamp(((value - min) / (max - min)) * 100, 0, 100);
  const multiplier = (value / (baseValue || 1)).toFixed(1);

  // Step change buttons (-25g / +25g)
  const adjustBy = (delta: number) => {
    const nextVal = clamp(Math.round((value + delta) / 5) * 5, min, max);
    onChange(nextVal);
  };

  // Quick Preset Multipliers (pure multipliers scaling relative to scanned dish)
  const PRESETS = [
    { label: '0.5x', multiplier: 0.5 },
    { label: '1.0x', multiplier: 1.0 },
    { label: '1.5x', multiplier: 1.5 },
    { label: '2.0x', multiplier: 2.0 },
  ];

  return (
    <View style={styles.container}>
      {/* Top Header Row with Gram Display and Multiplier Badge */}
      <View style={styles.headerRow}>
        <View style={styles.labelGroup}>
          <Text style={styles.labelTitle}>⚖️ Porsiyon Ayarı</Text>
          <Text style={styles.labelSubtitle}>Gramajı ihtiyacınıza göre uyarlayın (Max 2000g)</Text>
        </View>

        <View style={styles.gramBadge}>
          <Text style={styles.gramText}>{value}g</Text>
          <View style={styles.multiplierTag}>
            <Text style={styles.multiplierText}>{multiplier}x</Text>
          </View>
        </View>
      </View>

      {/* Interactive Slider Row with - / + Stepper Buttons */}
      <View style={styles.sliderRow}>
        {/* Decrease Button */}
        <TouchableOpacity
          style={styles.stepperButton}
          onPress={() => adjustBy(-25)}
          disabled={value <= min}
          activeOpacity={0.7}
        >
          <Text style={styles.stepperText}>−</Text>
        </TouchableOpacity>

        {/* PanResponder Touch Track (Direct drag & seek enabled) */}
        <View
          style={styles.trackContainer}
          onLayout={onTrackLayout}
          {...panResponder.panHandlers}
        >
          {/* Background Track */}
          <View style={styles.trackBackground} />

          {/* Filled Emerald Active Bar */}
          <View style={[styles.trackFill, { width: `${progressPercent}%` }]} />

          {/* Custom Draggable Thumb */}
          <View
            style={[
              styles.thumb,
              { left: `${progressPercent}%` },
            ]}
          >
            <View style={styles.thumbCenterDot} />
          </View>
        </View>

        {/* Increase Button */}
        <TouchableOpacity
          style={styles.stepperButton}
          onPress={() => adjustBy(25)}
          disabled={value >= max}
          activeOpacity={0.7}
        >
          <Text style={styles.stepperText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Preset Multiplier Chips (Clean multipliers without hardcoded grams) */}
      <View style={styles.presetsRow}>
        {PRESETS.map((p) => {
          const targetGrams = clamp(Math.round(baseValue * p.multiplier), min, max);
          const isSelected = Math.abs(value - targetGrams) < 5;
          return (
            <TouchableOpacity
              key={p.label}
              style={[styles.presetChip, isSelected && styles.presetChipActive]}
              onPress={() => onChange(targetGrams)}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.presetChipText,
                  isSelected && styles.presetChipTextActive,
                ]}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    ...Shadows.subtle,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  labelGroup: {
    flex: 1,
  },
  labelTitle: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  labelSubtitle: {
    ...Typography.tiny,
    color: Colors.textMuted,
    marginTop: 1,
  },
  gramBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryMuted,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  gramText: {
    ...Typography.h3,
    color: Colors.primaryDark,
    fontWeight: '800',
  },
  multiplierTag: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
    marginLeft: Spacing.xs,
  },
  multiplierText: {
    ...Typography.tiny,
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginVertical: Spacing.xs,
  },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepperText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  trackContainer: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    position: 'relative',
  },
  trackBackground: {
    width: '100%',
    height: 8,
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  trackFill: {
    position: 'absolute',
    height: 8,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
  thumb: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: Colors.primary,
    marginLeft: -13,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  thumbCenterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  presetChip: {
    flex: 1,
    backgroundColor: Colors.surfaceSubtle,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  presetChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  presetChipText: {
    ...Typography.tiny,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  presetChipTextActive: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },
});
