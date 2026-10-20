import React, { useState, useMemo } from 'react';
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
import { EditPortionModal } from '../components/nutrition/EditPortionModal';
import { AnalyticsScreen } from './AnalyticsScreen';

export const DashboardScreen: React.FC = () => {
  const {
    userProfile,
    todayMeals,
    waterIntakeMl,
    addWater,
    addMeal,
    updateMeal,
    removeMeal,
    getDailySummary,
    isDarkMode,
  } = useDietStore();
  const theme = getThemeColors(isDarkMode);
  const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);
  const summary = getDailySummary();

  const [activeSegment, setActiveSegment] = useState<'today' | 'analytics'>('today');
  const [selectedMealForEdit, setSelectedMealForEdit] = useState<LoggedMealItem | null>(null);

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
        allergens?: string[];
      }
    > = {
      breakfast: {
        name: 'Lor Peynirli Yumurta & Zeytin',
        portionGrams: 180,
        calories: 320,
        proteinGrams: 22,
        carbsGrams: 6,
        fatGrams: 18,
        allergens: ['Yumurta', 'Laktoz'],
      },
      lunch: {
        name: 'Zeytinyağlı Kinoa & Somon',
        portionGrams: 260,
        calories: 490,
        proteinGrams: 35,
        carbsGrams: 30,
        fatGrams: 20,
        allergens: ['Deniz Ürünleri'],
      },
      dinner: {
        name: 'Mercimek Çorbası & Izgara Köfte',
        portionGrams: 310,
        calories: 520,
        proteinGrams: 38,
        carbsGrams: 32,
        fatGrams: 19,
        allergens: ['Gluten'],
      },
      snack: {
        name: 'Yeşil Elma & Fıstık Ezmesi',
        portionGrams: 140,
        calories: 190,
        proteinGrams: 6,
        carbsGrams: 24,
        fatGrams: 8,
        allergens: ['Fındık / Fıstık'],
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
      allergens: preset.allergens,
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Top Segment Switcher: Today vs Analytics */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeSegment === 'today' && styles.segmentBtnActive]}
          onPress={() => setActiveSegment('today')}
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentText, activeSegment === 'today' && styles.segmentTextActive]}>
            📊 Günün Özeti
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentBtn, activeSegment === 'analytics' && styles.segmentBtnActive]}
          onPress={() => setActiveSegment('analytics')}
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentText, activeSegment === 'analytics' && styles.segmentTextActive]}>
            📈 Gelişim & Analiz
          </Text>
        </TouchableOpacity>
      </View>

      {activeSegment === 'analytics' ? (
        <AnalyticsScreen />
      ) : (
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
              onEditMeal={setSelectedMealForEdit}
            />

            <MealSection
              title="Öğle Yemeği"
              icon="☀️"
              mealType="lunch"
              meals={todayMeals.filter((m) => m.mealType === 'lunch')}
              onDeleteMeal={removeMeal}
              onQuickAdd={handleQuickAdd}
              onEditMeal={setSelectedMealForEdit}
            />

            <MealSection
              title="Akşam Yemeği"
              icon="🌙"
              mealType="dinner"
              meals={todayMeals.filter((m) => m.mealType === 'dinner')}
              onDeleteMeal={removeMeal}
              onQuickAdd={handleQuickAdd}
              onEditMeal={setSelectedMealForEdit}
            />

            <MealSection
              title="Ara Öğün"
              icon="🍏"
              mealType="snack"
              meals={todayMeals.filter((m) => m.mealType === 'snack')}
              onDeleteMeal={removeMeal}
              onQuickAdd={handleQuickAdd}
              onEditMeal={setSelectedMealForEdit}
            />
          </View>

          {/* 7-Day SVG Trend & Progress Chart */}
          <WeeklyProgressChart />
        </ScrollView>
      )}

      {/* Milestone 2 & 3: Interactive Food & Portion Edit Modal */}
      <EditPortionModal
        visible={!!selectedMealForEdit}
        meal={selectedMealForEdit}
        onClose={() => setSelectedMealForEdit(null)}
        onSave={(updated) => updateMeal(updated.id, updated)}
        onDelete={removeMeal}
      />
    </View>
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
    segmentContainer: {
      flexDirection: 'row',
      backgroundColor: theme.surfaceSubtle,
      marginHorizontal: Spacing.lg,
      marginTop: Spacing.sm,
      marginBottom: Spacing.xs,
      padding: 4,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: theme.border,
    },
    segmentBtn: {
      flex: 1,
      paddingVertical: Spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: BorderRadius.full,
    },
    segmentBtnActive: {
      backgroundColor: theme.surface,
      ...Shadows.soft,
    },
    segmentText: {
      ...Typography.captionBold,
      color: theme.textMuted,
    },
    segmentTextActive: {
      color: isDarkMode ? theme.primary : Colors.primaryDark,
    },
  });
