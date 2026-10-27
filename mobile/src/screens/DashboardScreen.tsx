import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
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
import { FoodAnalysisModal } from '../components/nutrition/FoodAnalysisModal';
import { RecipeBuilderModal } from '../components/nutrition/RecipeBuilderModal';
import { AnalyticsScreen } from './AnalyticsScreen';

export const DashboardScreen: React.FC = () => {
  const {
    userProfile,
    todayMeals,
    waterIntakeMl,
    streakDays,
    pendingAnalysis,
    clearPendingAnalysis,
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
  const [selectedMealForEdit, setSelectedMealForEdit] = useState<LoggedMealItem | null>(
    null
  );
  const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);
  const [isRecipeBuilderOpen, setIsRecipeBuilderOpen] = useState(false);

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
        fiberGrams: number;
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
        fiberGrams: 1.8,
        allergens: ['Yumurta', 'Laktoz'],
      },
      lunch: {
        name: 'Zeytinyağlı Kinoa & Somon',
        portionGrams: 260,
        calories: 490,
        proteinGrams: 35,
        carbsGrams: 30,
        fatGrams: 20,
        fiberGrams: 5.2,
        allergens: ['Deniz Ürünleri'],
      },
      dinner: {
        name: 'Mercimek Çorbası & Izgara Köfte',
        portionGrams: 310,
        calories: 520,
        proteinGrams: 38,
        carbsGrams: 32,
        fatGrams: 19,
        fiberGrams: 6.4,
        allergens: ['Gluten'],
      },
      snack: {
        name: 'Yeşil Elma & Fıstık Ezmesi',
        portionGrams: 140,
        calories: 190,
        proteinGrams: 6,
        carbsGrams: 24,
        fatGrams: 8,
        fiberGrams: 4.5,
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
      fiberGrams: preset.fiberGrams,
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
          <Text
            style={[
              styles.segmentText,
              activeSegment === 'today' && styles.segmentTextActive,
            ]}
          >
            📊 Günün Özeti
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.segmentBtn,
            activeSegment === 'analytics' && styles.segmentBtnActive,
          ]}
          onPress={() => setActiveSegment('analytics')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.segmentText,
              activeSegment === 'analytics' && styles.segmentTextActive,
            ]}
          >
            📈 Gelişim & Analiz
          </Text>
        </TouchableOpacity>
      </View>

      {activeSegment === 'analytics' ? (
        <AnalyticsScreen />
      ) : (
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* Phase 3.1: Cal AI Asynchronous Background Food Analyzing Card */}
          {pendingAnalysis.status !== 'idle' && (
            <View
              style={[
                styles.bgAnalysisCard,
                pendingAnalysis.status === 'ready' && styles.bgAnalysisCardReady,
              ]}
            >
              <View style={styles.bgAnalysisRow}>
                {pendingAnalysis.imageUri ? (
                  <Image
                    source={{ uri: pendingAnalysis.imageUri }}
                    style={styles.bgAnalysisThumb}
                  />
                ) : (
                  <View style={styles.bgAnalysisThumbPlaceholder}>
                    <Text style={{ fontSize: 22 }}>🍽️</Text>
                  </View>
                )}

                <View style={styles.bgAnalysisInfo}>
                  <View style={styles.bgStatusBadgeRow}>
                    {pendingAnalysis.status === 'analyzing' ? (
                      <ActivityIndicator
                        size="small"
                        color={theme.primary}
                        style={{ marginRight: 6 }}
                      />
                    ) : (
                      <Text style={{ fontSize: 13, marginRight: 4 }}>✨</Text>
                    )}
                    <Text style={styles.bgAnalysisBadgeText}>
                      {pendingAnalysis.status === 'analyzing'
                        ? 'ARKA PLANDA ANALİZ EDİLİYOR...'
                        : 'YAPAY ZEKA ANALİZİ TAMAMLANDI!'}
                    </Text>
                  </View>

                  <Text style={styles.bgAnalysisTitle} numberOfLines={1}>
                    {pendingAnalysis.status === 'analyzing'
                      ? 'Tabağınızdaki besinler hesaplanıyor'
                      : pendingAnalysis.detectedFoods &&
                        pendingAnalysis.detectedFoods.length > 0
                      ? pendingAnalysis.detectedFoods.map((f) => f.foodName).join(' + ')
                      : 'Izgara Tavuk Göğsü + Kinoa Salatası'}
                  </Text>

                  <Text style={styles.bgAnalysisSub}>
                    {pendingAnalysis.status === 'analyzing'
                      ? 'Beklemeden günlüğünüzde gezinmeye devam edebilirsiniz.'
                      : 'Porsiyonları incelemek ve günlüğe kaydetmek için dokunun.'}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={clearPendingAnalysis}
                  style={styles.bgDismissBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.bgDismissText}>✕</Text>
                </TouchableOpacity>
              </View>

              {pendingAnalysis.status === 'ready' && (
                <TouchableOpacity
                  style={styles.bgReviewButton}
                  onPress={() => setIsPendingModalOpen(true)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.bgReviewButtonText}>
                    🍽️ Tabağı İncele & Günlüğe Onayla
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Daily Target & Circular Calorie Ring Card */}
          <View style={styles.card}>
            {/* Phase 1.1: Cal AI Gamification Row (Streak + Health Score 0-100 Badge) */}
            <View style={styles.gamificationRow}>
              <View style={styles.streakPill}>
                <Text style={styles.streakIcon}>🔥</Text>
                <Text style={styles.streakText}>{streakDays} Günlük Seri</Text>
              </View>

              <View
                style={[
                  styles.healthScorePill,
                  summary.healthScore >= 80
                    ? styles.healthScoreHigh
                    : summary.healthScore >= 50
                    ? styles.healthScoreMid
                    : styles.healthScoreLow,
                ]}
              >
                <Text style={styles.healthScoreEmoji}>🛡️</Text>
                <Text style={styles.healthScoreValue}>
                  Sağlık Skoru: {summary.healthScore}/100
                </Text>
                <Text style={styles.healthScoreSub}>• {summary.healthScoreLabel}</Text>
              </View>
            </View>

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

          {/* Reactive Macronutrients & Micronutrients Accordion Card */}
          <View style={styles.card}>
            <MacroBar
              proteinGrams={summary.totalProtein}
              targetProteinGrams={userProfile.targetProteinGrams}
              carbsGrams={summary.totalCarbs}
              targetCarbsGrams={userProfile.targetCarbsGrams}
              fatGrams={summary.totalFat}
              targetFatGrams={userProfile.targetFatGrams}
              fiberGrams={summary.totalFiber}
              sugarGrams={summary.totalSugar}
              sodiumMg={summary.totalSodium}
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
              <View>
                <Text style={styles.sectionTitle}>Bugün Tüketilen Öğünler</Text>
                <Text style={styles.mealsSubtitleText}>
                  {todayMeals.length} kayıtlı öğün • Birim ve gramaj düzenlenebilir
                </Text>
              </View>

              <TouchableOpacity
                style={styles.recipeBuilderBtn}
                onPress={() => setIsRecipeBuilderOpen(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.recipeBuilderBtnText}>👩‍🍳 Özel Tarif</Text>
              </TouchableOpacity>
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

      {/* Phase 3.1: Background Analysis Review Modal */}
      <FoodAnalysisModal
        visible={isPendingModalOpen}
        imageUri={pendingAnalysis.imageUri || null}
        detectedFood={pendingAnalysis.detectedFood}
        detectedFoods={pendingAnalysis.detectedFoods}
        onClose={() => setIsPendingModalOpen(false)}
        onConfirm={() => {
          setIsPendingModalOpen(false);
          clearPendingAnalysis();
        }}
      />

      {/* Phase 4.2: Waistline Custom Recipe Builder Modal */}
      <RecipeBuilderModal
        visible={isRecipeBuilderOpen}
        onClose={() => setIsRecipeBuilderOpen(false)}
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
    bgAnalysisCard: {
      backgroundColor: theme.surface,
      borderRadius: BorderRadius.xl,
      padding: Spacing.md,
      borderWidth: 1.5,
      borderColor: theme.calories,
      marginBottom: Spacing.lg,
      ...Shadows.card,
    },
    bgAnalysisCardReady: {
      borderColor: theme.primary,
      backgroundColor: isDarkMode ? '#064E3B' : '#ECFDF5',
    },
    bgAnalysisRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    bgAnalysisThumb: {
      width: 54,
      height: 54,
      borderRadius: BorderRadius.lg,
      marginRight: Spacing.md,
      borderWidth: 1.5,
      borderColor: theme.primary,
    },
    bgAnalysisThumbPlaceholder: {
      width: 54,
      height: 54,
      borderRadius: BorderRadius.lg,
      backgroundColor: theme.surfaceSubtle,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.md,
    },
    bgAnalysisInfo: {
      flex: 1,
    },
    bgStatusBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 2,
    },
    bgAnalysisBadgeText: {
      ...Typography.tiny,
      fontSize: 10,
      fontWeight: '800',
      color: theme.primary,
      letterSpacing: 0.6,
    },
    bgAnalysisTitle: {
      ...Typography.bodyBold,
      color: theme.textPrimary,
    },
    bgAnalysisSub: {
      ...Typography.tiny,
      color: theme.textSecondary,
      marginTop: 1,
    },
    bgDismissBtn: {
      padding: 6,
      marginLeft: 4,
    },
    bgDismissText: {
      fontSize: 14,
      color: theme.textMuted,
      fontWeight: '700',
    },
    bgReviewButton: {
      marginTop: Spacing.sm,
      backgroundColor: theme.primary,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.lg,
      alignItems: 'center',
    },
    bgReviewButtonText: {
      ...Typography.captionBold,
      color: '#FFFFFF',
    },
    gamificationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.md,
      paddingBottom: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      flexWrap: 'wrap',
      gap: 6,
    },
    streakPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(245, 158, 11, 0.4)' : '#FDE68A',
    },
    streakIcon: {
      fontSize: 13,
      marginRight: 4,
    },
    streakText: {
      ...Typography.tiny,
      color: isDarkMode ? '#FCD34D' : '#B45309',
      fontWeight: '800',
    },
    healthScorePill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
    },
    healthScoreHigh: {
      backgroundColor: isDarkMode ? theme.primaryMuted : Colors.primaryLight,
      borderColor: theme.primary,
    },
    healthScoreMid: {
      backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : '#DBEAFE',
      borderColor: Colors.protein,
    },
    healthScoreLow: {
      backgroundColor: theme.surfaceSubtle,
      borderColor: theme.border,
    },
    healthScoreEmoji: {
      fontSize: 12,
      marginRight: 4,
    },
    healthScoreValue: {
      ...Typography.tiny,
      fontWeight: '800',
      color: theme.textPrimary,
    },
    healthScoreSub: {
      ...Typography.tiny,
      fontSize: 10,
      color: theme.textSecondary,
      marginLeft: 4,
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
    mealsSubtitleText: {
      ...Typography.tiny,
      color: theme.textMuted,
      marginTop: 1,
    },
    mealsHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    recipeBuilderBtn: {
      backgroundColor: isDarkMode ? theme.primaryMuted : Colors.primaryLight,
      paddingHorizontal: Spacing.md,
      paddingVertical: 6,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: theme.primary,
    },
    recipeBuilderBtnText: {
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
