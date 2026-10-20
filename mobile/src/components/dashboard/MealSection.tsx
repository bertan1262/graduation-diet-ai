import React, { useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { LoggedMealItem, MealType } from '../../types';
import { Colors, getThemeColors, ThemeColors } from '../../constants/colors';
import { Spacing, BorderRadius, Typography } from '../../constants/theme';
import { MealItemCard } from './MealItemCard';
import { useDietStore } from '../../store/useDietStore';

export interface MealSectionProps {
  title: string;
  icon: string;
  mealType: MealType;
  meals: LoggedMealItem[];
  onDeleteMeal: (id: string) => void;
  onQuickAdd: (mealType: MealType) => void;
  onEditMeal?: (meal: LoggedMealItem) => void;
}

export const MealSection: React.FC<MealSectionProps> = ({
  title,
  icon,
  mealType,
  meals,
  onDeleteMeal,
  onQuickAdd,
  onEditMeal,
}) => {
  const isDarkMode = useDietStore((state) => state.isDarkMode);
  const theme = getThemeColors(isDarkMode);
  const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);
  const categoryCalories = meals.reduce((acc, m) => acc + m.calories, 0);

  return (
    <View style={styles.sectionContainer}>
      {/* Section Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Text style={styles.icon}>{icon}</Text>
          <View>
            <Text style={styles.titleText}>{title}</Text>
            <Text style={styles.calorieSubText}>
              {categoryCalories > 0 ? `${categoryCalories} kcal` : '0 kcal'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => onQuickAdd(mealType)}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.addButtonIcon}>+</Text>
          <Text style={styles.addButtonText}>Ekle</Text>
        </TouchableOpacity>
      </View>

      {/* Meals List or Empty State */}
      {meals.length > 0 ? (
        <View style={styles.mealsList}>
          {meals.map((meal) => (
            <MealItemCard
              key={meal.id}
              meal={meal}
              onDelete={onDeleteMeal}
              onEdit={onEditMeal}
            />
          ))}
        </View>
      ) : (
        <TouchableOpacity
          style={styles.emptyContainer}
          onPress={() => onQuickAdd(mealType)}
          activeOpacity={0.7}
        >
          <Text style={styles.emptyText}>Henüz öğün eklenmedi</Text>
          <Text style={styles.emptyActionText}>+ Hızlı Ekle</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const createStyles = (theme: ThemeColors, isDarkMode: boolean) =>
  StyleSheet.create({
    sectionContainer: {
      marginBottom: Spacing.lg,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.sm,
      paddingHorizontal: Spacing.xs,
    },
    titleGroup: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    icon: {
      fontSize: 20,
      marginRight: Spacing.sm,
    },
    titleText: {
      ...Typography.bodyBold,
      color: theme.textPrimary,
    },
    calorieSubText: {
      ...Typography.tiny,
      color: theme.textMuted,
      marginTop: 1,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#1E3A8A' : Colors.primaryLight,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.full,
    },
    addButtonIcon: {
      ...Typography.captionBold,
      color: isDarkMode ? '#93C5FD' : Colors.primaryDark,
      marginRight: 2,
    },
    addButtonText: {
      ...Typography.captionBold,
      color: isDarkMode ? '#93C5FD' : Colors.primaryDark,
    },
    mealsList: {
      marginTop: Spacing.xs,
    },
    emptyContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.surfaceSubtle,
      borderWidth: 1,
      borderColor: theme.border,
      borderStyle: 'dashed',
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      marginTop: Spacing.xs,
    },
    emptyText: {
      ...Typography.caption,
      color: theme.textMuted,
    },
    emptyActionText: {
      ...Typography.captionBold,
      color: isDarkMode ? '#34D399' : Colors.primaryDark,
    },
  });
