import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, getThemeColors, ThemeColors } from '../../constants/colors';
import { Spacing, BorderRadius, Typography } from '../../constants/theme';
import { useDietStore } from '../../store/useDietStore';

interface MacroItemProps {
  label: string;
  currentGrams: number;
  targetGrams: number;
  color: string;
  lightColor: string;
  unit?: string;
  theme: ThemeColors;
  isDarkMode: boolean;
  styles: ReturnType<typeof createStyles>;
}

export const MacroItem: React.FC<MacroItemProps> = ({
  label,
  currentGrams,
  targetGrams,
  color,
  lightColor,
  unit = 'g',
  theme,
  isDarkMode,
  styles,
}) => {
  const progressRatio = targetGrams > 0 ? currentGrams / targetGrams : 0;
  const progressPercent = Math.min(100, Math.round(progressRatio * 100));
  const remainingGrams = Math.max(0, Math.round((targetGrams - currentGrams) * 10) / 10);
  const isOver = currentGrams > targetGrams;

  return (
    <View style={styles.macroItemContainer}>
      {/* Header Row: Label, Intake vs Target, Percent */}
      <View style={styles.headerRow}>
        <View style={styles.labelGroup}>
          <View style={[styles.colorDot, { backgroundColor: color }]} />
          <Text style={styles.macroLabel}>{label}</Text>
        </View>

        <View style={styles.valueGroup}>
          <Text style={styles.currentValue}>
            {currentGrams}
            <Text style={styles.targetValue}> / {targetGrams}{unit}</Text>
          </Text>
          <View
            style={[
              styles.percentBadge,
              {
                backgroundColor: isOver
                  ? (isDarkMode ? '#7F1D1D' : '#FEE2E2')
                  : (isDarkMode ? '#1E293B' : lightColor),
              },
            ]}
          >
            <Text
              style={[
                styles.percentText,
                { color: isOver ? (isDarkMode ? '#FCA5A5' : Colors.danger) : color },
              ]}
            >
              %{progressPercent}
            </Text>
          </View>
        </View>
      </View>

      {/* Horizontal Progress Track Bar */}
      <View style={[styles.trackBar, { backgroundColor: theme.surfaceSubtle }]}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${Math.min(100, progressPercent)}%`,
              backgroundColor: isOver ? Colors.danger : color,
            },
          ]}
        />
      </View>

      {/* Footer: Remaining status */}
      <View style={styles.footerRow}>
        <Text style={styles.remainingText}>
          {isOver
            ? `${(currentGrams - targetGrams).toFixed(1)}${unit} aşıldı`
            : `${remainingGrams}${unit} kaldı`}
        </Text>
      </View>
    </View>
  );
};

interface MacroSummaryCardProps {
  proteinGrams: number;
  targetProteinGrams: number;
  carbsGrams: number;
  targetCarbsGrams: number;
  fatGrams: number;
  targetFatGrams: number;
}

export const MacroBar: React.FC<MacroSummaryCardProps> = ({
  proteinGrams,
  targetProteinGrams,
  carbsGrams,
  targetCarbsGrams,
  fatGrams,
  targetFatGrams,
}) => {
  const isDarkMode = useDietStore((state) => state.isDarkMode);
  const theme = getThemeColors(isDarkMode);
  const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Makro Besin Dengesi</Text>

      <MacroItem
        label="Protein"
        currentGrams={proteinGrams}
        targetGrams={targetProteinGrams}
        color={Colors.protein}
        lightColor={Colors.proteinLight}
        theme={theme}
        isDarkMode={isDarkMode}
        styles={styles}
      />

      <View style={styles.itemDivider} />

      <MacroItem
        label="Karbonhidrat"
        currentGrams={carbsGrams}
        targetGrams={targetCarbsGrams}
        color={Colors.carbs}
        lightColor={Colors.carbsLight}
        theme={theme}
        isDarkMode={isDarkMode}
        styles={styles}
      />

      <View style={styles.itemDivider} />

      <MacroItem
        label="Sağlıklı Yağ"
        currentGrams={fatGrams}
        targetGrams={targetFatGrams}
        color={Colors.fat}
        lightColor={Colors.fatLight}
        theme={theme}
        isDarkMode={isDarkMode}
        styles={styles}
      />
    </View>
  );
};

const createStyles = (theme: ThemeColors, isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      width: '100%',
    },
    title: {
      ...Typography.h3,
      color: theme.textPrimary,
      marginBottom: Spacing.md,
    },
    macroItemContainer: {
      marginVertical: Spacing.xs,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.xs,
    },
    labelGroup: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    colorDot: {
      width: 8,
      height: 8,
      borderRadius: BorderRadius.full,
      marginRight: Spacing.sm,
    },
    macroLabel: {
      ...Typography.bodyBold,
      color: theme.textPrimary,
    },
    valueGroup: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    currentValue: {
      ...Typography.bodyBold,
      color: theme.textPrimary,
      marginRight: Spacing.sm,
    },
    targetValue: {
      ...Typography.caption,
      color: theme.textMuted,
      fontWeight: '400',
    },
    percentBadge: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: BorderRadius.full,
    },
    percentText: {
      ...Typography.tiny,
      fontWeight: '700',
    },
    trackBar: {
      height: 8,
      borderRadius: BorderRadius.full,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      borderRadius: BorderRadius.full,
    },
    footerRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 2,
    },
    remainingText: {
      ...Typography.tiny,
      color: theme.textMuted,
    },
    itemDivider: {
      height: 1,
      backgroundColor: theme.border,
      marginVertical: Spacing.sm,
    },
  });
