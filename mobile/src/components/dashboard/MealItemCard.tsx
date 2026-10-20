import React, { useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { LoggedMealItem } from '../../types';
import { Colors, getThemeColors, ThemeColors } from '../../constants/colors';
import { Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { useDietStore } from '../../store/useDietStore';

export interface MealItemCardProps {
  meal: LoggedMealItem;
  onDelete: (id: string) => void;
  onEdit?: (meal: LoggedMealItem) => void;
}

export const MealItemCard: React.FC<MealItemCardProps> = ({ meal, onDelete, onEdit }) => {
  const isDarkMode = useDietStore((state) => state.isDarkMode);
  const theme = getThemeColors(isDarkMode);
  const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onEdit && onEdit(meal)}
      activeOpacity={onEdit ? 0.75 : 1}
    >
      {/* Left Info: Name, portion, time, warnings and macro pills */}
      <View style={styles.infoCol}>
        <View style={styles.titleRow}>
          <Text style={styles.mealName} numberOfLines={1}>
            {meal.name}
          </Text>
          {onEdit && <Text style={styles.editHintIcon}>✏️</Text>}
        </View>

        <Text style={styles.metaText}>
          {meal.portionGrams}g • {meal.loggedAt}
        </Text>

        {/* Milestone 3: Allergen & Clinical Warning Pills */}
        {(meal.warningMessage || (meal.allergens && meal.allergens.length > 0)) && (
          <View style={styles.allergenRow}>
            {meal.warningMessage ? (
              <View style={[styles.warningPill, { backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2' }]}>
                <Text style={[styles.warningPillText, { color: theme.danger }]}>
                  {meal.warningMessage}
                </Text>
              </View>
            ) : null}
            {meal.allergens?.map((alg, idx) => (
              <View
                key={`alg-${idx}`}
                style={[
                  styles.allergenPill,
                  { backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7' },
                ]}
              >
                <Text style={[styles.allergenPillText, { color: theme.calories }]}>
                  ⚠️ {alg}
                </Text>
              </View>
            ))}
          </View>
        )}

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
    </TouchableOpacity>
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
    editHintIcon: {
      fontSize: 12,
      marginLeft: Spacing.xs,
      opacity: 0.7,
    },
    allergenRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
      marginBottom: Spacing.xs,
    },
    warningPill: {
      paddingHorizontal: Spacing.xs,
      paddingVertical: 1,
      borderRadius: BorderRadius.xs,
    },
    warningPillText: {
      ...Typography.tiny,
      fontWeight: '700',
      fontSize: 10,
    },
    allergenPill: {
      paddingHorizontal: Spacing.xs,
      paddingVertical: 1,
      borderRadius: BorderRadius.xs,
    },
    allergenPillText: {
      ...Typography.tiny,
      fontWeight: '700',
      fontSize: 10,
    },
  });
