import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { Colors, getThemeColors, ThemeColors } from '../../constants/colors';
import { Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { useDietStore } from '../../store/useDietStore';

interface CalorieRingProps {
  consumedCalories: number;
  targetCalories: number;
  size?: number;
  strokeWidth?: number;
}

export const CalorieRing: React.FC<CalorieRingProps> = ({
  consumedCalories,
  targetCalories,
  size = 190,
  strokeWidth = 14,
}) => {
  const isDarkMode = useDietStore((state) => state.isDarkMode);
  const theme = getThemeColors(isDarkMode);
  const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Safe percentage calculation
  const progressRatio = targetCalories > 0 ? consumedCalories / targetCalories : 0;
  const clampedProgress = Math.min(1, Math.max(0, progressRatio));
  const strokeDashoffset = circumference - clampedProgress * circumference;

  const remainingCalories = targetCalories - consumedCalories;
  const isOverTarget = remainingCalories < 0;
  const progressPercent = Math.round(progressRatio * 100);

  // Dynamic semantic color based on target state
  const getStrokeColor = () => {
    if (isOverTarget) return Colors.danger;
    if (progressPercent >= 90) return Colors.calories;
    return theme.primary;
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          {/* Background Track Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={theme.surfaceSubtle}
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Active Progress Arc */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={getStrokeColor()}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </G>
      </Svg>

      {/* Centered Metric Composition */}
      <View style={styles.centerContent}>
        <View
          style={[
            styles.percentBadge,
            {
              backgroundColor: isOverTarget
                ? (isDarkMode ? '#7F1D1D' : '#FEE2E2')
                : (isDarkMode ? '#1E3A8A' : Colors.primaryLight),
            },
          ]}
        >
          <Text
            style={[
              styles.percentText,
              {
                color: isOverTarget
                  ? (isDarkMode ? '#FCA5A5' : Colors.danger)
                  : (isDarkMode ? '#93C5FD' : Colors.primaryDark),
              },
            ]}
          >
            %{progressPercent}
          </Text>
        </View>

        <Text style={styles.consumedText}>{consumedCalories.toLocaleString('tr-TR')}</Text>
        <Text style={styles.unitText}>kcal</Text>

        <View style={styles.remainingPill}>
          <Text style={[styles.remainingText, isOverTarget && styles.remainingOverText]}>
            {isOverTarget
              ? `${Math.abs(remainingCalories).toLocaleString('tr-TR')} kcal aşıldı`
              : `${remainingCalories.toLocaleString('tr-TR')} kcal kaldı`}
          </Text>
        </View>
      </View>
    </View>
  );
};

const createStyles = (theme: ThemeColors, isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      alignSelf: 'center',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      marginVertical: Spacing.sm,
    },
    centerContent: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
    },
    percentBadge: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: BorderRadius.full,
      marginBottom: 4,
    },
    percentText: {
      ...Typography.tiny,
      fontWeight: '700',
    },
    consumedText: {
      fontSize: 32,
      fontWeight: '800',
      color: theme.textPrimary,
      lineHeight: 38,
    },
    unitText: {
      ...Typography.captionBold,
      color: theme.textMuted,
      marginTop: -2,
      letterSpacing: 0.5,
    },
    remainingPill: {
      marginTop: Spacing.xs,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: BorderRadius.full,
      backgroundColor: theme.surfaceSubtle,
    },
    remainingText: {
      ...Typography.tiny,
      color: theme.textSecondary,
      fontWeight: '600',
    },
    remainingOverText: {
      color: Colors.danger,
      fontWeight: '700',
    },
  });
