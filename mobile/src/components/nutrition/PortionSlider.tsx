import React, { useRef, useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  GestureResponderEvent,
  LayoutChangeEvent,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, getThemeColors, ThemeColors } from '../../constants/colors';
import { Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { useDietStore } from '../../store/useDietStore';
import { ServingUnitType } from '../../types';

export interface PortionSliderProps {
  value: number;
  baseValue: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (grams: number) => void;
}

interface UnitDefinition {
  id: ServingUnitType;
  label: string;
  shortLabel: string;
  icon: string;
  getGramsPerUnit: (baseVal: number) => number;
  stepCount: number;
  presets: number[];
}

const SERVING_UNITS: UnitDefinition[] = [
  {
    id: 'g',
    label: 'Gram',
    shortLabel: 'g',
    icon: '⚖️',
    getGramsPerUnit: () => 1,
    stepCount: 25,
    presets: [0.5, 1.0, 1.5, 2.0],
  },
  {
    id: 'portion',
    label: 'Porsiyon',
    shortLabel: 'Pors.',
    icon: '🍽️',
    getGramsPerUnit: (baseVal) => (baseVal > 0 ? baseVal : 180),
    stepCount: 0.5,
    presets: [0.5, 1, 1.5, 2],
  },
  {
    id: 'piece',
    label: 'Adet',
    shortLabel: 'Adet',
    icon: '🥚',
    getGramsPerUnit: () => 60,
    stepCount: 1,
    presets: [1, 2, 3, 4],
  },
  {
    id: 'slice',
    label: 'Dilim',
    shortLabel: 'Dilim',
    icon: '🍞',
    getGramsPerUnit: () => 30,
    stepCount: 1,
    presets: [1, 2, 3, 4],
  },
  {
    id: 'bowl',
    label: 'Kase',
    shortLabel: 'Kase',
    icon: '🥣',
    getGramsPerUnit: () => 200,
    stepCount: 0.5,
    presets: [0.5, 1, 1.5, 2],
  },
];

export const PortionSlider: React.FC<PortionSliderProps> = ({
  value,
  baseValue,
  min = 15,
  max = 2000,
  step = 5,
  onChange,
}) => {
  const isDarkMode = useDietStore((state) => state.isDarkMode);
  const theme = getThemeColors(isDarkMode);
  const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);

  const [selectedUnit, setSelectedUnit] = useState<ServingUnitType>('g');
  const [, setTrackWidth] = useState<number>(0);
  const trackWidthRef = useRef<number>(0);
  const startValueRef = useRef<number>(value);
  const grantPageXRef = useRef<number>(0);

  const activeUnitDef =
    SERVING_UNITS.find((u) => u.id === selectedUnit) || SERVING_UNITS[0];
  const gramsPerUnit = activeUnitDef.getGramsPerUnit(baseValue);

  // Clamp helper
  const clamp = (val: number, minimum: number, maximum: number) => {
    return Math.min(Math.max(val, minimum), maximum);
  };

  const handleResponderGrant = (evt: GestureResponderEvent) => {
    grantPageXRef.current = evt.nativeEvent.pageX;
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
  };

  const handleResponderMove = (evt: GestureResponderEvent) => {
    if (trackWidthRef.current > 0) {
      const dx = evt.nativeEvent.pageX - grantPageXRef.current;
      const deltaGrams = (dx / trackWidthRef.current) * (max - min);
      const rawGrams = startValueRef.current + deltaGrams;
      const stepped = Math.round(rawGrams / step) * step;
      onChange(clamp(stepped, min, max));
    }
  };

  const onTrackLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setTrackWidth(w);
    trackWidthRef.current = w;
  };

  const progressPercent = clamp(((value - min) / (max - min)) * 100, 0, 100);
  const multiplier = (value / (baseValue || 1)).toFixed(1);

  // Formatted unit badge value
  const formattedUnitCount = useMemo(() => {
    if (selectedUnit === 'g') return `${value}g`;
    const count = Math.round((value / gramsPerUnit) * 10) / 10;
    return `${count} ${activeUnitDef.label}`;
  }, [value, selectedUnit, gramsPerUnit, activeUnitDef]);

  // Step change buttons (adapts to selected unit)
  const adjustByStep = (direction: -1 | 1) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (selectedUnit === 'g') {
      const nextVal = clamp(Math.round((value + direction * 25) / 5) * 5, min, max);
      onChange(nextVal);
    } else {
      const deltaGrams = Math.round(activeUnitDef.stepCount * gramsPerUnit);
      const nextVal = clamp(value + direction * deltaGrams, min, max);
      onChange(nextVal);
    }
  };

  const handleSelectUnit = (unit: UnitDefinition) => {
    Haptics.selectionAsync().catch(() => {});
    setSelectedUnit(unit.id);
    if (unit.id !== 'g') {
      // Snap cleanly to 1 unit if switching to a specialized unit for immediate clarity
      const unitGrams = unit.getGramsPerUnit(baseValue);
      const currentCount = Math.max(0.5, Math.round((value / unitGrams) * 2) / 2);
      onChange(clamp(Math.round(currentCount * unitGrams), min, max));
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header Row with Unit/Gram Display and Multiplier Badge */}
      <View style={styles.headerRow}>
        <View style={styles.labelGroup}>
          <Text style={styles.labelTitle}>⚖️ Porsiyon & Birim Ayarı</Text>
          <Text style={styles.labelSubtitle}>
            {selectedUnit === 'g'
              ? 'Gramajı ihtiyacınıza göre uyarlayın'
              : `1 ${activeUnitDef.label} ≈ ${gramsPerUnit}g baz alındı`}
          </Text>
        </View>

        <View style={styles.gramBadge}>
          <Text style={styles.gramText}>{formattedUnitCount}</Text>
          <View style={styles.multiplierTag}>
            <Text style={styles.multiplierText}>
              {selectedUnit === 'g' ? `${multiplier}x` : `${value}g`}
            </Text>
          </View>
        </View>
      </View>

      {/* Waistline & Cal AI Inspired Multi-Unit Switcher Pills */}
      <View style={styles.unitTabsRow}>
        {SERVING_UNITS.map((u) => {
          const isActive = selectedUnit === u.id;
          return (
            <TouchableOpacity
              key={u.id}
              style={[styles.unitTab, isActive && styles.unitTabActive]}
              onPress={() => handleSelectUnit(u)}
              activeOpacity={0.75}
            >
              <Text style={styles.unitTabIcon}>{u.icon}</Text>
              <Text style={[styles.unitTabText, isActive && styles.unitTabTextActive]}>
                {u.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Interactive Slider Row with - / + Stepper Buttons */}
      <View style={styles.sliderRow}>
        {/* Decrease Button */}
        <TouchableOpacity
          style={styles.stepperButton}
          onPress={() => adjustByStep(-1)}
          disabled={value <= min}
          activeOpacity={0.7}
        >
          <Text style={styles.stepperText}>−</Text>
        </TouchableOpacity>

        {/* Touch Track (Direct drag & seek enabled) */}
        <View
          style={styles.trackContainer}
          onLayout={onTrackLayout}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderTerminationRequest={() => false}
          onResponderGrant={handleResponderGrant}
          onResponderMove={handleResponderMove}
        >
          {/* Background Track */}
          <View style={styles.trackBackground} pointerEvents="none" />

          {/* Filled Emerald Active Bar */}
          <View
            style={[styles.trackFill, { width: `${progressPercent}%` }]}
            pointerEvents="none"
          />

          {/* Custom Draggable Thumb */}
          <View
            style={[
              styles.thumb,
              { left: `${progressPercent}%` },
            ]}
            pointerEvents="none"
          >
            <View style={styles.thumbCenterDot} pointerEvents="none" />
          </View>
        </View>

        {/* Increase Button */}
        <TouchableOpacity
          style={styles.stepperButton}
          onPress={() => adjustByStep(1)}
          disabled={value >= max}
          activeOpacity={0.7}
        >
          <Text style={styles.stepperText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Dynamic Quick Preset Chips (Adapts to active Serving Unit) */}
      <View style={styles.presetsRow}>
        {activeUnitDef.presets.map((presetVal) => {
          const targetGrams =
            selectedUnit === 'g'
              ? clamp(Math.round(baseValue * presetVal), min, max)
              : clamp(Math.round(gramsPerUnit * presetVal), min, max);
          const isSelected = Math.abs(value - targetGrams) < 5;
          const chipLabel =
            selectedUnit === 'g'
              ? `${presetVal.toFixed(1)}x`
              : `${presetVal} ${activeUnitDef.shortLabel}`;

          return (
            <TouchableOpacity
              key={`${selectedUnit}-${presetVal}`}
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
                {chipLabel}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const createStyles = (theme: ThemeColors, isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.surface,
      borderRadius: BorderRadius.xl,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: theme.border,
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
      paddingRight: Spacing.xs,
    },
    labelTitle: {
      ...Typography.bodyBold,
      color: theme.textPrimary,
    },
    labelSubtitle: {
      ...Typography.tiny,
      color: theme.textMuted,
      marginTop: 1,
    },
    gramBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? theme.primaryMuted : Colors.primaryMuted,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: isDarkMode ? theme.primary : Colors.primaryLight,
    },
    gramText: {
      ...Typography.bodyBold,
      fontSize: 16,
      color: isDarkMode ? theme.primary : Colors.primaryDark,
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
    unitTabsRow: {
      flexDirection: 'row',
      gap: 4,
      marginBottom: Spacing.sm,
      backgroundColor: theme.surfaceSubtle,
      padding: 4,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
    },
    unitTab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 6,
      paddingHorizontal: 2,
      borderRadius: BorderRadius.md,
      gap: 3,
    },
    unitTabActive: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.primary,
      ...Shadows.subtle,
    },
    unitTabIcon: {
      fontSize: 11,
    },
    unitTabText: {
      ...Typography.tiny,
      fontSize: 10,
      color: theme.textSecondary,
      fontWeight: '600',
    },
    unitTabTextActive: {
      color: isDarkMode ? theme.primary : Colors.primaryDark,
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
      backgroundColor: theme.surfaceSubtle,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    },
    stepperText: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.textPrimary,
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
      backgroundColor: theme.surfaceSubtle,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: theme.border,
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
      backgroundColor: theme.surfaceSubtle,
      paddingVertical: 6,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'transparent',
    },
    presetChipActive: {
      backgroundColor: isDarkMode ? theme.primaryMuted : Colors.primaryLight,
      borderColor: Colors.primary,
    },
    presetChipText: {
      ...Typography.tiny,
      color: theme.textSecondary,
      fontWeight: '600',
    },
    presetChipTextActive: {
      color: isDarkMode ? theme.primary : Colors.primaryDark,
      fontWeight: '700',
    },
  });
