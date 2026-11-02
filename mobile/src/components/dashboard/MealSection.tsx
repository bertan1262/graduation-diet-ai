import React, { useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
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

  const handlePressAdd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onQuickAdd(mealType);
  };

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
          onPress={handlePressAdd}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.addButtonIcon}>+</Text>
          <Text style={styles.addButtonText}>Ekle</Text>
        </TouchableOpacity>
      </View>

      {/* Meals List or Modernized Interactive Empty State Slot */}
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
          onPress={handlePressAdd}
          activeOpacity={0.75}
        >
          <View style={styles.emptyLeftGroup}>
            <Text style={styles.emptyIcon}>{icon}</Text>
            <View>
              <Text style={styles.emptyTitle}>Henüz {title} eklenmedi</Text>
              <Text style={styles.emptySubText}>Tabağını kaydetmek için dokun</Text>
            </View>
          </View>
          <View style={styles.emptyActionPill}>
            <Text style={styles.emptyActionText}>+ Hızlı Ekle</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const createStyles = (theme: ThemeColors, isDarkMode: boolean) =>
  StyleSheet.create({
    sectionContainer: {
      marginBottom: Spacing.md + 2,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.xs + 2,
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
      backgroundColor: isDarkMode ? '#1E293B' : Colors.primaryLight,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs - 1,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: isDarkMode ? '#334155' : 'transparent',
    },
    addButtonIcon: {
      ...Typography.captionBold,
      color: isDarkMode ? '#93C5FD' : Colors.primaryDark,
      marginRight: 3,
    },
    addButtonText: {
      ...Typography.captionBold,
      color: isDarkMode ? '#93C5FD' : Colors.primaryDark,
    },
    mealsList: {
      marginTop: 2,
    },
    emptyContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#0F172A' : theme.surfaceSubtle,
      borderWidth: 1.5,
      borderColor: isDarkMode ? '#334155' : theme.border,
      borderStyle: 'dashed',
      borderRadius: BorderRadius.xl,
      paddingVertical: Spacing.md - 2,
      paddingHorizontal: Spacing.md,
      marginTop: 4,
    },
    emptyLeftGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    emptyIcon: {
      fontSize: 18,
      marginRight: Spacing.sm,
      opacity: 0.8,
    },
    emptyTitle: {
      ...Typography.captionBold,
      color: theme.textSecondary,
    },
    emptySubText: {
      ...Typography.tiny,
      color: theme.textMuted,
      marginTop: 1,
    },
    emptyActionPill: {
      paddingHorizontal: Spacing.sm + 2,
      paddingVertical: 5,
      borderRadius: BorderRadius.full,
      backgroundColor: isDarkMode ? '#1E3A8A' : Colors.primaryLight,
    },
    emptyActionText: {
      ...Typography.tiny,
      fontWeight: '700',
      color: isDarkMode ? '#93C5FD' : Colors.primaryDark,
    },
  });
