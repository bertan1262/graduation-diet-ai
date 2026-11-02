import React, { useState, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, getThemeColors, ThemeColors } from '../constants/colors';
import { Spacing, BorderRadius, Typography, Shadows } from '../constants/theme';
import { LoggedMealItem, MealType } from '../types';
import { useDietStore } from '../store/useDietStore';
import { CalorieRing } from '../components/dashboard/CalorieRing';
import { MacroBar } from '../components/dashboard/MacroBar';
import { WaterTracker } from '../components/dashboard/WaterTracker';
import { MealSection } from '../components/dashboard/MealSection';
import { EditPortionModal } from '../components/nutrition/EditPortionModal';
import { FoodAnalysisModal } from '../components/nutrition/FoodAnalysisModal';
import { RecipeBuilderModal } from '../components/nutrition/RecipeBuilderModal';
import { FoodSearchModal } from '../components/nutrition/FoodSearchModal';
import { AnalyticsScreen } from './AnalyticsScreen';

export const DashboardScreen: React.FC = () => {
  const userProfile = useDietStore((state) => state.userProfile);
  const todayMeals = useDietStore((state) => state.todayMeals);
  const waterIntakeMl = useDietStore((state) => state.waterIntakeMl);
  const streakDays = useDietStore((state) => state.streakDays);
  const pendingAnalysis = useDietStore((state) => state.pendingAnalysis);
  const clearPendingAnalysis = useDietStore((state) => state.clearPendingAnalysis);
  const addWater = useDietStore((state) => state.addWater);
  const addMeal = useDietStore((state) => state.addMeal);
  const updateMeal = useDietStore((state) => state.updateMeal);
  const removeMeal = useDietStore((state) => state.removeMeal);
  const getDailySummary = useDietStore((state) => state.getDailySummary);
  const isDarkMode = useDietStore((state) => state.isDarkMode);

  const theme = getThemeColors(isDarkMode);
  const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);
  const summary = useMemo(
    () => getDailySummary(),
    [getDailySummary, todayMeals, waterIntakeMl, userProfile]
  );

  const [activeSegment, setActiveSegment] = useState<'today' | 'analytics'>('today');
  const [selectedMealForEdit, setSelectedMealForEdit] = useState<LoggedMealItem | null>(
    null
  );
  const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);
  const [isRecipeBuilderOpen, setIsRecipeBuilderOpen] = useState(false);
  const [isFoodSearchOpen, setIsFoodSearchOpen] = useState(false);
  const [isMicroDrawerOpen, setIsMicroDrawerOpen] = useState(false);

  // Trigger milestone haptic celebration when calorie target is reached
  useEffect(() => {
    if (summary.calorieProgressPercent >= 100) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  }, [summary.calorieProgressPercent >= 100]);

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
          {/* Cal AI Background Food Analyzing Card */}
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

          {/* Gamification Row (Streak + Health Score) */}
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

          {/* Target Celebration Banner */}
          {summary.calorieProgressPercent >= 100 && (
            <View style={styles.celebrationBanner}>
              <Text style={styles.celebrationEmoji}>🎉 🏆</Text>
              <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                <Text style={styles.celebrationTitle}>Harika! Günlük Kalori Hedefine Ulaştın!</Text>
                <Text style={styles.celebrationDesc}>
                  Beslenme disiplinin mükemmel ilerliyor, sağlıklı yaşam yolculuğunu kutluyoruz!
                </Text>
              </View>
            </View>
          )}

          {/* MODERN BENTO HERO CARD: Integrated Calories & Macros */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View>
                <Text style={styles.cardTitle}>Günün Kalori & Makro Dengesi</Text>
                <Text style={styles.cardSubtitle}>
                  Kalan: {summary.remainingCalories} kcal • Hedef: {userProfile.targetCalories} kcal
                </Text>
              </View>
              <View style={styles.percentBadge}>
                <Text style={styles.percentText}>%{summary.calorieProgressPercent}</Text>
              </View>
            </View>

            {/* Bento Inner Grid: Calorie Ring (Left) + Macro Bars (Right) */}
            <View style={styles.bentoHeroRow}>
              <View style={styles.bentoRingCol}>
                <CalorieRing
                  consumedCalories={summary.totalCalories}
                  targetCalories={userProfile.targetCalories}
                  size={135}
                  strokeWidth={11}
                  showRemainingPill={false}
                />
              </View>

              <View style={styles.bentoMacroCol}>
                <MacroBar
                  proteinGrams={summary.totalProtein}
                  targetProteinGrams={userProfile.targetProteinGrams}
                  carbsGrams={summary.totalCarbs}
                  targetCarbsGrams={userProfile.targetCarbsGrams}
                  fatGrams={summary.totalFat}
                  targetFatGrams={userProfile.targetFatGrams}
                  hideTitle={true}
                  compact={true}
                />
              </View>
            </View>

            {/* Metric Chips Row */}
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

            {/* Expandable Micronutrient Accordion */}
            <TouchableOpacity
              style={styles.microAccordionBtn}
              onPress={() => setIsMicroDrawerOpen((prev) => !prev)}
              activeOpacity={0.75}
            >
              <View style={styles.microAccordionTitleRow}>
                <Text style={styles.microAccordionIcon}>🧬</Text>
                <Text style={styles.microAccordionTitle}>
                  Mikro Besin & Lif Detayları ({summary.totalFiber}g Lif)
                </Text>
              </View>
              <Text style={styles.microAccordionChevron}>
                {isMicroDrawerOpen ? '▴ Gizle' : '▾ Göster'}
              </Text>
            </TouchableOpacity>

            {isMicroDrawerOpen && (
              <View style={styles.microDrawerContainer}>
                <View style={styles.microItemRow}>
                  <Text style={styles.microItemLabel}>🌾 Diyet Lifi</Text>
                  <Text style={styles.microItemValue}>{summary.totalFiber}g / 28g</Text>
                </View>
                <View style={styles.microDivider} />
                <View style={styles.microItemRow}>
                  <Text style={styles.microItemLabel}>🍯 Serbest Şeker</Text>
                  <Text style={styles.microItemValue}>{summary.totalSugar}g / 35g (limit)</Text>
                </View>
                <View style={styles.microDivider} />
                <View style={styles.microItemRow}>
                  <Text style={styles.microItemLabel}>🧂 Sodyum / Tuz</Text>
                  <Text style={styles.microItemValue}>{summary.totalSodium}mg / 2300mg</Text>
                </View>
              </View>
            )}
          </View>

          {/* Interactive Water Tracker Card */}
          <View style={styles.card}>
            <WaterTracker
              currentMl={waterIntakeMl}
              goalMl={userProfile.waterGoalMl}
              onAddWater={addWater}
            />
          </View>

          {/* Categorized Meals Card with Modern Interactive Slots */}
          <View style={styles.card}>
            <View style={styles.mealsHeaderRow}>
              <View style={styles.mealsTitleGroup}>
                <Text style={styles.sectionTitle}>Bugün Tüketilen Öğünler</Text>
                <Text style={styles.mealsSubtitleText}>
                  {todayMeals.length} kayıtlı öğün • Birim ve gramaj düzenlenebilir
                </Text>
              </View>

              <View style={styles.headerButtonsRow}>
                <TouchableOpacity
                  style={styles.foodSearchBtn}
                  onPress={() => setIsFoodSearchOpen(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.foodSearchBtnText}>🔍 Yemek Ara</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.recipeBuilderBtn}
                  onPress={() => setIsRecipeBuilderOpen(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.recipeBuilderBtnText}>👩‍🍳 Tarif</Text>
                </TouchableOpacity>
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
        </ScrollView>
      )}

      {/* Edit Portion Modal */}
      {selectedMealForEdit && (
        <EditPortionModal
          visible={Boolean(selectedMealForEdit)}
          meal={selectedMealForEdit}
          onClose={() => setSelectedMealForEdit(null)}
          onSave={(updatedMeal) => {
            updateMeal(updatedMeal.id, updatedMeal);
            setSelectedMealForEdit(null);
          }}
        />
      )}

      {/* Background Cal AI Analysis Review Modal */}
      {isPendingModalOpen && pendingAnalysis.status === 'ready' && (
        <FoodAnalysisModal
          visible={isPendingModalOpen}
          imageUri={pendingAnalysis.imageUri ?? null}
          detectedFoods={pendingAnalysis.detectedFoods}
          onClose={() => {
            setIsPendingModalOpen(false);
            clearPendingAnalysis();
          }}
        />
      )}

      {/* Recipe Builder Modal */}
      {isRecipeBuilderOpen && (
        <RecipeBuilderModal
          visible={isRecipeBuilderOpen}
          onClose={() => setIsRecipeBuilderOpen(false)}
        />
      )}

      {/* Food Search Modal */}
      {isFoodSearchOpen && (
        <FoodSearchModal
          visible={isFoodSearchOpen}
          onClose={() => setIsFoodSearchOpen(false)}
        />
      )}
    </View>
  );
};

const createStyles = (theme: ThemeColors, isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      padding: Spacing.lg,
      paddingBottom: Spacing.xl * 2,
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
    card: {
      backgroundColor: theme.surface,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
      borderWidth: 1,
      borderColor: theme.border,
      ...Shadows.card,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: Spacing.sm,
    },
    cardTitle: {
      ...Typography.h3,
      color: theme.textPrimary,
    },
    cardSubtitle: {
      ...Typography.tiny,
      color: theme.textMuted,
      marginTop: 2,
    },
    percentBadge: {
      backgroundColor: isDarkMode ? theme.primaryMuted : Colors.primaryLight,
      paddingHorizontal: Spacing.sm + 2,
      paddingVertical: 3,
      borderRadius: BorderRadius.full,
    },
    percentText: {
      ...Typography.captionBold,
      color: isDarkMode ? theme.primary : Colors.primaryDark,
    },
    bentoHeroRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: Spacing.xs,
    },
    bentoRingCol: {
      width: 135,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bentoMacroCol: {
      flex: 1,
      paddingLeft: Spacing.md,
      justifyContent: 'center',
    },
    metricRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: Spacing.md,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    metricItem: {
      flex: 1,
      alignItems: 'center',
    },
    metricValue: {
      ...Typography.h2,
      fontSize: 20,
      color: theme.textPrimary,
    },
    metricLabel: {
      ...Typography.tiny,
      color: theme.textMuted,
      marginTop: 2,
    },
    divider: {
      width: 1,
      height: 28,
      backgroundColor: theme.border,
    },
    microAccordionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: Spacing.md,
      paddingVertical: Spacing.xs + 2,
      paddingHorizontal: Spacing.md,
      backgroundColor: theme.surfaceSubtle,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
    },
    microAccordionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    microAccordionIcon: {
      fontSize: 13,
    },
    microAccordionTitle: {
      ...Typography.captionBold,
      fontSize: 12,
      color: theme.textSecondary,
    },
    microAccordionChevron: {
      ...Typography.tiny,
      color: isDarkMode ? theme.primary : Colors.primaryDark,
      fontWeight: '700',
    },
    microDrawerContainer: {
      marginTop: Spacing.sm,
      padding: Spacing.md,
      backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC',
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
    },
    microItemRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 2,
    },
    microItemLabel: {
      ...Typography.captionBold,
      fontSize: 12,
      color: theme.textPrimary,
    },
    microItemValue: {
      ...Typography.caption,
      fontSize: 12,
      color: theme.textSecondary,
      fontWeight: '600',
    },
    microDivider: {
      height: 1,
      backgroundColor: theme.border,
      marginVertical: Spacing.xs,
    },
    gamificationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.sm,
      marginBottom: Spacing.md,
    },
    streakPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#1E293B' : '#FEF3C7',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm - 2,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: isDarkMode ? '#334155' : '#FDE68A',
    },
    streakIcon: {
      fontSize: 15,
      marginRight: 6,
    },
    streakText: {
      ...Typography.captionBold,
      color: isDarkMode ? '#FCD34D' : '#92400E',
    },
    healthScorePill: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm - 2,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
    },
    healthScoreHigh: {
      backgroundColor: isDarkMode ? '#064E3B' : '#ECFDF5',
      borderColor: isDarkMode ? '#047857' : '#A7F3D0',
    },
    healthScoreMid: {
      backgroundColor: isDarkMode ? '#78350F' : '#FFFBEB',
      borderColor: isDarkMode ? '#B45309' : '#FDE68A',
    },
    healthScoreLow: {
      backgroundColor: isDarkMode ? '#7F1D1D' : '#FEF2F2',
      borderColor: isDarkMode ? '#B91C1C' : '#FECACA',
    },
    healthScoreEmoji: {
      fontSize: 13,
      marginRight: 6,
    },
    healthScoreValue: {
      ...Typography.captionBold,
      color: theme.textPrimary,
    },
    healthScoreSub: {
      ...Typography.tiny,
      color: theme.textMuted,
      marginLeft: 4,
    },
    celebrationBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#064E3B' : '#ECFDF5',
      borderWidth: 1,
      borderColor: isDarkMode ? '#047857' : '#10B981',
      borderRadius: BorderRadius.xl,
      padding: Spacing.md,
      marginBottom: Spacing.md,
    },
    celebrationEmoji: {
      fontSize: 22,
    },
    celebrationTitle: {
      ...Typography.bodyBold,
      color: '#10B981',
      fontSize: 13,
    },
    celebrationDesc: {
      ...Typography.tiny,
      color: theme.textMuted,
      marginTop: 2,
    },
    mealsHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      rowGap: Spacing.sm,
      marginBottom: Spacing.md,
    },
    mealsTitleGroup: {
      flex: 1,
      minWidth: 160,
      marginRight: Spacing.xs,
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
    headerButtonsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexShrink: 0,
    },
    foodSearchBtn: {
      backgroundColor: theme.primary,
      paddingHorizontal: Spacing.sm + 2,
      paddingVertical: 6,
      borderRadius: BorderRadius.full,
      ...Shadows.soft,
    },
    foodSearchBtnText: {
      ...Typography.tiny,
      color: theme.textInverse,
      fontWeight: '700',
    },
    recipeBuilderBtn: {
      backgroundColor: isDarkMode ? theme.primaryMuted : Colors.primaryLight,
      paddingHorizontal: Spacing.sm + 2,
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
    bgAnalysisCard: {
      backgroundColor: theme.surface,
      borderRadius: BorderRadius.xl,
      padding: Spacing.md,
      marginBottom: Spacing.md,
      borderWidth: 1.5,
      borderColor: theme.primary,
      ...Shadows.card,
    },
    bgAnalysisCardReady: {
      borderColor: '#10B981',
      backgroundColor: isDarkMode ? '#064E3B20' : '#ECFDF5',
    },
    bgAnalysisRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    bgAnalysisThumb: {
      width: 48,
      height: 48,
      borderRadius: BorderRadius.md,
      marginRight: Spacing.sm,
    },
    bgAnalysisThumbPlaceholder: {
      width: 48,
      height: 48,
      borderRadius: BorderRadius.md,
      backgroundColor: theme.surfaceSubtle,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.sm,
    },
    bgAnalysisInfo: {
      flex: 1,
      marginRight: Spacing.xs,
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
      letterSpacing: 0.5,
    },
    bgAnalysisTitle: {
      ...Typography.bodyBold,
      fontSize: 13,
      color: theme.textPrimary,
    },
    bgAnalysisSub: {
      ...Typography.tiny,
      fontSize: 11,
      color: theme.textMuted,
      marginTop: 2,
    },
    bgDismissBtn: {
      padding: Spacing.xs,
    },
    bgDismissText: {
      fontSize: 14,
      color: theme.textMuted,
      fontWeight: '700',
    },
    bgReviewButton: {
      backgroundColor: '#10B981',
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: Spacing.sm,
    },
    bgReviewButtonText: {
      ...Typography.captionBold,
      color: '#FFFFFF',
      fontWeight: '700',
    },
  });
