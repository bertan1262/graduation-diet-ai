import React, { useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { LoggedMealItem } from '../../types';
import { Colors, getThemeColors, ThemeColors } from '../../constants/colors';
import { Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { useDietStore } from '../../store/useDietStore';

export interface MealItemCardProps {
  meal: LoggedMealItem;
  onDelete: (id: string) => void;
}

export const MealItemCard: React.FC<MealItemCardProps> = ({ meal, onDelete }) => {
  const isDarkMode = useDietStore((state) => state.isDarkMode);
  const theme = getThemeColors(isDarkMode);
  const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);

  return (
    <View style={styles.card}>
      {/* Left Info: Name, portion, time, and macro pills */}
      <View style={styles.infoCol}>
        <View style={styles.titleRow}>
          <Text style={styles.mealName} numberOfLines={1}>
            {meal.name}
          </Text>
        </View>

        <Text style={styles.metaText}>
          {meal.portionGrams}g • {meal.loggedAt}
        </Text>

        {/* Macro Badges Row */}
        <View style={styles.macroPillsRow}>
          <View
            style={[
              styles.macroPill,
              { backgroundColor: isDarkMode ? '#1E3A8A' : Colors.proteinLight },
            ]}
          >
            <Text
              style={[
                styles.macroPillText,
                { color: isDarkMode ? '#93C5FD' : Colors.protein },
              ]}
            >
              P: {meal.proteinGrams}g
            </Text>
          </View>
          <View
            style={[
              styles.macroPill,
              { backgroundColor: isDarkMode ? '#78350F' : Colors.carbsLight },
            ]}
          >
            <Text
              style={[
                styles.macroPillText,
                { color: isDarkMode ? '#FCD34D' : Colors.calories },
              ]}
            >
              K: {meal.carbsGrams}g
            </Text>
          </View>
          <View
            style={[
              styles.macroPill,
              { backgroundColor: isDarkMode ? '#831843' : Colors.fatLight },
            ]}
          >
            <Text
              style={[
                styles.macroPillText,
                { color: isDarkMode ? '#F472B6' : Colors.fat },
              ]}
            >
              Y: {meal.fatGrams}g
            </Text>
          </View>
        </View>
      </View>

      {/* Right Column: Calories & Delete Action */}
      <View style={styles.actionCol}>
        <View style={styles.calorieBadge}>
          <Text style={styles.calorieValue}>{meal.calories}</Text>
          <Text style={styles.calorieUnit}>kcal</Text>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(meal.id)}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.deleteText}>Sil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (theme: ThemeColors, isDarkMode: boolean) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDarkMode ? '#1E293B' : Colors.surface,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: Spacing.sm,
      ...Shadows.soft,
    },
    infoCol: {
      flex: 1,
      marginRight: Spacing.md,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    mealName: {
      ...Typography.bodyBold,
      color: theme.textPrimary,
    },
    metaText: {
      ...Typography.tiny,
      color: theme.textMuted,
      marginTop: 2,
      marginBottom: Spacing.xs,
    },
    macroPillsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: Spacing.xs,
    },
    macroPill: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: BorderRadius.xs,
    },
    macroPillText: {
      ...Typography.tiny,
      fontWeight: '600',
    },
    actionCol: {
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      minHeight: 52,
    },
    calorieBadge: {
      flexDirection: 'row',
      alignItems: 'baseline',
    },
    calorieValue: {
      ...Typography.bodyBold,
      color: isDarkMode ? '#34D399' : Colors.primaryDark,
      fontSize: 16,
    },
    calorieUnit: {
      ...Typography.tiny,
      color: theme.textMuted,
      marginLeft: 2,
    },
    deleteButton: {
      paddingVertical: 2,
      paddingHorizontal: Spacing.xs,
    },
    deleteText: {
      ...Typography.tiny,
      color: Colors.danger,
      fontWeight: '600',
    },
  });
