import React, { useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Colors, getThemeColors, ThemeColors } from '../../constants/colors';
import { Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { useDietStore } from '../../store/useDietStore';

interface WaterTrackerProps {
  currentMl: number;
  goalMl: number;
  onAddWater: (amountMl: number) => void;
}

export const WaterTracker: React.FC<WaterTrackerProps> = ({
  currentMl,
  goalMl,
  onAddWater,
}) => {
  const isDarkMode = useDietStore((state) => state.isDarkMode);
  const theme = getThemeColors(isDarkMode);
  const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);

  const progressRatio = goalMl > 0 ? currentMl / goalMl : 0;
  const progressPercent = Math.min(100, Math.round(progressRatio * 100));
  const remainingMl = Math.max(0, goalMl - currentMl);
  const isGoalReached = currentMl >= goalMl;

  return (
    <View style={styles.container}>
      {/* Header Info */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Text style={styles.icon}>💧</Text>
          <View>
            <Text style={styles.title}>Günlük Su Takibi</Text>
            <Text style={styles.subtitle}>
              {currentMl.toLocaleString('tr-TR')} / {goalMl.toLocaleString('tr-TR')} ml
              {isGoalReached ? ' • Hedefe ulaşıldı! 🎉' : ` • ${remainingMl.toLocaleString('tr-TR')} ml kaldı`}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.percentBadge,
            {
              backgroundColor: isGoalReached
                ? (isDarkMode ? '#065F46' : Colors.primaryLight)
                : (isDarkMode ? '#1E3A8A' : Colors.waterLight),
            },
          ]}
        >
          <Text
            style={[
              styles.percentText,
              {
                color: isGoalReached
                  ? (isDarkMode ? '#6EE7B7' : Colors.primaryDark)
                  : (isDarkMode ? '#93C5FD' : Colors.water),
              },
            ]}
          >
            %{progressPercent}
          </Text>
        </View>
      </View>

      {/* Horizontal Water Progress Bar */}
      <View style={styles.trackBar}>
        <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
      </View>

      {/* Action Buttons Row */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.waterAddButton}
          onPress={() => onAddWater(250)}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonIcon}>🥛</Text>
          <Text style={styles.waterAddButtonText}>+250 ml (Bardak)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.waterAddButtonSecondary}
          onPress={() => onAddWater(500)}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonIcon}>🍶</Text>
          <Text style={styles.waterAddButtonSecondaryText}>+500 ml (Şişe)</Text>
        </TouchableOpacity>

        {currentMl > 0 && (
          <TouchableOpacity
            style={styles.undoButton}
            onPress={() => onAddWater(-250)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.undoText}>Geri Al</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const createStyles = (theme: ThemeColors, isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      width: '100%',
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    titleGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    icon: {
      fontSize: 28,
      marginRight: Spacing.sm,
    },
    title: {
      ...Typography.h3,
      color: theme.textPrimary,
    },
    subtitle: {
      ...Typography.caption,
      color: theme.textMuted,
      marginTop: 2,
    },
    percentBadge: {
      paddingHorizontal: Spacing.md,
      paddingVertical: 4,
      borderRadius: BorderRadius.full,
      marginLeft: Spacing.sm,
    },
    percentText: {
      ...Typography.captionBold,
    },
    trackBar: {
      height: 10,
      backgroundColor: theme.surfaceSubtle,
      borderRadius: BorderRadius.full,
      overflow: 'hidden',
      marginVertical: Spacing.sm,
    },
    progressBar: {
      height: '100%',
      backgroundColor: Colors.water,
      borderRadius: BorderRadius.full,
    },
    actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: Spacing.sm,
    },
    waterAddButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.water,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.full,
      marginRight: Spacing.sm,
      ...Shadows.soft,
    },
    buttonIcon: {
      fontSize: 14,
      marginRight: 4,
    },
    waterAddButtonText: {
      ...Typography.captionBold,
      color: Colors.textInverse,
    },
    waterAddButtonSecondary: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#1E293B' : Colors.waterLight,
      borderWidth: isDarkMode ? 1 : 0,
      borderColor: isDarkMode ? '#334155' : 'transparent',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.full,
      marginRight: Spacing.sm,
    },
    waterAddButtonSecondaryText: {
      ...Typography.captionBold,
      color: isDarkMode ? '#38BDF8' : Colors.water,
    },
    undoButton: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
    },
    undoText: {
      ...Typography.tiny,
      color: theme.textMuted,
      textDecorationLine: 'underline',
    },
  });
