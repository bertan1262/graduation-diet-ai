import React, { useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { Colors, getThemeColors, ThemeColors } from '../constants/colors';
import { Spacing, BorderRadius, Typography, Shadows } from '../constants/theme';
import { LoggedMealItem, MealType } from '../types';
import { useDietStore } from '../store/useDietStore';
import { CalorieRing } from '../components/dashboard/CalorieRing';
import { MacroBar } from '../components/dashboard/MacroBar';
import { WaterTracker } from '../components/dashboard/WaterTracker';
import { MealSection } from '../components/dashboard/MealSection';
import { WeeklyProgressChart } from '../components/dashboard/WeeklyProgressChart';

export const DashboardScreen: React.FC = () => {
  const { userProfile, todayMeals, waterIntakeMl, addWater, addMeal, removeMeal, getDailySummary, isDarkMode } = useDietStore();
  const theme = getThemeColors(isDarkMode);
  const styles = useMemo(() => createStyles(theme, isDarkMode), [isDarkMode]);
  const summary = getDailySummary();

  const handleQuickAdd = (mealType: MealType) => {
    const presets: Record<
      MealType,
      {
        name: string;
        portionGrams: number;
        calories: number;
        proteinGrams: number;
        carbsGrams: number;
        fatGrams: number;
      }
    > = {
      breakfast: {
        name: 'Lor Peynirli Yumurta & Zeytin',
        portionGrams: 180,
        calories: 320,
        proteinGrams: 22,
        carbsGrams: 6,
        fatGrams: 18,
      },
      lunch: {
        name: 'Zeytinyağlı Kinoa & Somon',
        portionGrams: 260,
        calories: 490,
        proteinGrams: 35,
        carbsGrams: 30,
        fatGrams: 20,
      },
      dinner: {
        name: 'Mercimek Çorbası & Izgara Köfte',
        portionGrams: 310,
        calories: 520,
        proteinGrams: 38,
        carbsGrams: 32,
        fatGrams: 19,
      },
      snack: {
        name: 'Yeşil Elma & Fıstık Ezmesi',
        portionGrams: 140,
        calories: 190,
        proteinGrams: 6,
        carbsGrams: 24,
        fatGrams: 8,
      },
    };

    const preset = presets[mealType];
    addMeal({
      name: preset.name,
      mealType,
      portionGrams: preset.portionGrams,
      calories: preset.calories,
      proteinGrams: preset.proteinGrams,
      carbsGrams: preset.carbsGrams,
      fatGrams: preset.fatGrams,
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Daily Target & Circular Calorie Ring Card */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Günün Kalori Dengesi</Text>
          <View style={styles.percentBadge}>
            <Text style={styles.percentText}>%{summary.calorieProgressPercent}</Text>
          </View>
        </View>

        {/* Central Circular Calorie Progress Ring */}
        <CalorieRing
          consumedCalories={summary.totalCalories}
          targetCalories={userProfile.targetCalories}
        />

        {/* Live Reactive Metric Row */}
        <View style={styles.metricRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{summary.totalCalories}</Text>
            <Text style={styles.metricLabel}>Alınan (kcal)</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: theme.primary }]}>
              {summary.remainingCalories}
            </Text>
            <Text style={styles.metricLabel}>Kalan (kcal)</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{userProfile.targetCalories}</Text>
            <Text style={styles.metricLabel}>Hedef (kcal)</Text>
          </View>
        </View>
      </View>

      {/* Reactive Macronutrients Card */}
      <View style={styles.card}>
        <MacroBar
          proteinGrams={summary.totalProtein}
          targetProteinGrams={userProfile.targetProteinGrams}
          carbsGrams={summary.totalCarbs}
          targetCarbsGrams={userProfile.targetCarbsGrams}
          fatGrams={summary.totalFat}
          targetFatGrams={userProfile.targetFatGrams}
        />
      </View>

      {/* Interactive Water Tracker Card */}
      <View style={styles.card}>
        <WaterTracker
          currentMl={waterIntakeMl}
          goalMl={userProfile.waterGoalMl}
          onAddWater={addWater}
        />
      </View>

      {/* Categorized Meals Card */}
      <View style={styles.card}>
        <View style={styles.mealsHeaderRow}>
          <Text style={styles.sectionTitle}>Bugün Tüketilen Öğünler</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{todayMeals.length} Öğün</Text>
          </View>
        </View>

        <MealSection
          title="Kahvaltı"
          icon="🌅"
          mealType="breakfast"
          meals={todayMeals.filter((m) => m.mealType === 'breakfast')}
          onDeleteMeal={removeMeal}
          onQuickAdd={handleQuickAdd}
        />

        <MealSection
          title="Öğle Yemeği"
          icon="☀️"
          mealType="lunch"
          meals={todayMeals.filter((m) => m.mealType === 'lunch')}
          onDeleteMeal={removeMeal}
          onQuickAdd={handleQuickAdd}
        />

        <MealSection
          title="Akşam Yemeği"
          icon="🌙"
          mealType="dinner"
          meals={todayMeals.filter((m) => m.mealType === 'dinner')}
          onDeleteMeal={removeMeal}
          onQuickAdd={handleQuickAdd}
        />

        <MealSection
          title="Ara Öğün"
          icon="🍏"
          mealType="snack"
          meals={todayMeals.filter((m) => m.mealType === 'snack')}
          onDeleteMeal={removeMeal}
          onQuickAdd={handleQuickAdd}
        />
      </View>

      {/* 7-Day SVG Trend & Progress Chart */}
      <WeeklyProgressChart />
    </ScrollView>
  );
};

const createStyles = (theme: ThemeColors, isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      padding: Spacing.lg,
      backgroundColor: theme.background,
    },
    card: {
      backgroundColor: theme.surface,
      borderRadius: BorderRadius.xl,
      padding: Spacing.xl,
      borderWidth: 1,
      borderColor: theme.border,
      ...Shadows.card,
      marginBottom: Spacing.lg,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cardTitle: {
      ...Typography.h2,
      color: theme.textPrimary,
    },
    cardSubtitle: {
      ...Typography.body,
      color: theme.textMuted,
      marginTop: Spacing.xs,
    },
    bold: {
      fontWeight: '700',
      color: theme.textPrimary,
    },
    percentBadge: {
      backgroundColor: isDarkMode ? theme.primaryMuted : Colors.primaryLight,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.full,
    },
    percentText: {
      ...Typography.captionBold,
      color: isDarkMode ? theme.primary : Colors.primaryDark,
    },
    metricRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: Spacing.lg,
      paddingTop: Spacing.lg,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    metricItem: {
      flex: 1,
      alignItems: 'center',
    },
    metricValue: {
      ...Typography.h1,
      color: theme.textPrimary,
    },
    metricLabel: {
      ...Typography.caption,
      color: theme.textMuted,
      marginTop: 2,
    },
    divider: {
      width: 1,
      height: 36,
      backgroundColor: theme.border,
    },
    sectionTitle: {
      ...Typography.h3,
      color: theme.textPrimary,
    },
    mealsHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    countBadge: {
      backgroundColor: isDarkMode ? theme.primaryMuted : Colors.primaryLight,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: BorderRadius.full,
    },
    countBadgeText: {
      ...Typography.tiny,
      color: isDarkMode ? theme.primary : Colors.primaryDark,
      fontWeight: '700',
    },
  });
