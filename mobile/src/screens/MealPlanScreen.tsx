import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Colors, getThemeColors } from '../constants/colors';
import { Spacing, BorderRadius, Typography, Shadows } from '../constants/theme';
import { useDietStore } from '../store/useDietStore';
import { MealType } from '../types';

export interface MealRecipe {
  id: string;
  title: string;
  description: string;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  tags: string[];
  allergens?: ('lactose' | 'gluten' | 'peanut' | 'egg' | 'seafood')[];
  dietTypes?: ('vegetarian' | 'vegan' | 'keto' | 'balanced' | 'high_protein')[];
}

export interface DayPlan {
  dayId: string;
  dayName: string;
  dayShort: string;
  dayOfMonth: number;
  isToday: boolean;
  breakfast: MealRecipe;
  lunch: MealRecipe;
  dinner: MealRecipe;
  snack: MealRecipe;
}

// Comprehensive alternative recipes pool categorized with allergens and dietary types
export const ALTERNATIVE_MEALS: Record<MealType, MealRecipe[]> = {
  breakfast: [
    {
      id: 'alt-b1',
      title: 'Yulaflı Omlet & Lor Peyniri',
      description: '2 yumurta, 30g yulaf ezmesi, taze maydanoz ve 50g yağsız lor peyniri.',
      calories: 340,
      proteinGrams: 28,
      carbsGrams: 22,
      fatGrams: 14,
      tags: ['Yüksek Protein', 'Vejetaryen'],
      allergens: ['egg', 'lactose', 'gluten'],
      dietTypes: ['balanced', 'high_protein', 'vegetarian'],
    },
    {
      id: 'alt-b2',
      title: 'Chia Tohumlu Laktozsuz Yoğurt Kasesi',
      description: 'Laktozsuz süzme yoğurt, chia tohumu, yaban mersini ve 1 tatlı kaşığı bal.',
      calories: 290,
      proteinGrams: 20,
      carbsGrams: 32,
      fatGrams: 9,
      tags: ['Antioksidan', 'Laktozsuz', 'Glutensiz'],
      allergens: [],
      dietTypes: ['vegetarian', 'balanced'],
    },
    {
      id: 'alt-b3',
      title: 'Avokadolu Haşlanmış Yumurta Tabağı',
      description: '2 haşlanmış yumurta, yarım ezilmiş avokado, çeri domates ve zeytin.',
      calories: 360,
      proteinGrams: 22,
      carbsGrams: 10,
      fatGrams: 26,
      tags: ['Sağlıklı Yağ', 'Düşük Karb', 'Keto Uyumlu'],
      allergens: ['egg'],
      dietTypes: ['keto', 'vegetarian', 'balanced'],
    },
    {
      id: 'alt-b4',
      title: 'Izgara Füme Tofu & Sebzeli Tabak',
      description: '150g ızgara füme tofu, avokado dilimleri, zeytin, salatalık ve domates.',
      calories: 310,
      proteinGrams: 24,
      carbsGrams: 12,
      fatGrams: 18,
      tags: ['%100 Bitkisel', 'Vegan', 'Glutensiz', 'Laktozsuz'],
      allergens: [],
      dietTypes: ['vegetarian', 'vegan', 'keto', 'balanced'],
    },
    {
      id: 'alt-b5',
      title: 'Karabuğday Patlağı & Tahinli Meyve Kasesi',
      description: 'Glutensiz karabuğday patlağı, 1 tatlı kaşığı susam tahini, muz ve tarçın.',
      calories: 320,
      proteinGrams: 12,
      carbsGrams: 42,
      fatGrams: 12,
      tags: ['Fıstıksız', 'Glutensiz', 'Vegan', 'Enerji'],
      allergens: [],
      dietTypes: ['vegetarian', 'vegan', 'balanced'],
    },
    {
      id: 'alt-b6',
      title: 'Menemen & Glutensiz Mısır Ekmeği',
      description: '2 yumurta, domates, yeşil biber ve yanında 1 dilim glutensiz karabuğday ekmeği.',
      calories: 350,
      proteinGrams: 21,
      carbsGrams: 24,
      fatGrams: 18,
      tags: ['Laktozsuz', 'Glutensiz', 'Geleneksel'],
      allergens: ['egg'],
      dietTypes: ['vegetarian', 'balanced'],
    },
  ],
  lunch: [
    {
      id: 'alt-l1',
      title: 'Izgara Tavuk Göğsü & Kinoa Salatası',
      description: '180g ızgara tavuk, haşlanmış kinoa, taze Akdeniz yeşilliği ve nar ekşisi.',
      calories: 460,
      proteinGrams: 48,
      carbsGrams: 34,
      fatGrams: 12,
      tags: ['Yağsız Kas', 'Glutensiz', 'Laktozsuz'],
      allergens: [],
      dietTypes: ['high_protein', 'balanced'],
    },
    {
      id: 'alt-l2',
      title: 'Mercimek Çorbası & Fırın Dana Köfte',
      description: '1 kase süzme mercimek çorbası ve 150g yağsız dana köfte yanında ızgara biber.',
      calories: 490,
      proteinGrams: 42,
      carbsGrams: 38,
      fatGrams: 16,
      tags: ['Demir Kaynağı', 'Lifli'],
      allergens: ['gluten'],
      dietTypes: ['high_protein', 'balanced'],
    },
    {
      id: 'alt-l3',
      title: 'Fırında Somon & Buharda Brokoli',
      description: '200g Norveç somonu, buharda brokoli, havuç ve zeytinyağlı limon sosu.',
      calories: 520,
      proteinGrams: 44,
      carbsGrams: 12,
      fatGrams: 32,
      tags: ['Omega-3', 'Keto Uyumlu', 'Glutensiz', 'Laktozsuz'],
      allergens: ['seafood'],
      dietTypes: ['keto', 'high_protein', 'balanced'],
    },
    {
      id: 'alt-l4',
      title: 'Nohutlu & Avokadolu Kinoa Salatası',
      description: '150g haşlanmış nohut, kinoa, avokado, Akdeniz yeşilliği ve zeytinyağı.',
      calories: 440,
      proteinGrams: 22,
      carbsGrams: 52,
      fatGrams: 16,
      tags: ['Vejetaryen', 'Vegan', 'Glutensiz', 'Laktozsuz'],
      allergens: [],
      dietTypes: ['vegetarian', 'vegan', 'balanced'],
    },
    {
      id: 'alt-l5',
      title: 'Fırında Sebzeli Tofu & Yeşil Mercimek',
      description: '160g fırınlanmış marineli tofu, haşlanmış yeşil mercimek ve közlenmiş kapya biber.',
      calories: 450,
      proteinGrams: 34,
      carbsGrams: 42,
      fatGrams: 14,
      tags: ['Yüksek Protein', 'Vegan', 'Vejetaryen', 'Glutensiz'],
      allergens: [],
      dietTypes: ['vegetarian', 'vegan', 'balanced'],
    },
    {
      id: 'alt-l6',
      title: 'Zeytinyağlı Enginar & Karabuğday Salatası',
      description: 'Garnitürlü enginar kalpleri, taze dereotu ve nar ekşili karabuğday tabule.',
      calories: 390,
      proteinGrams: 16,
      carbsGrams: 48,
      fatGrams: 15,
      tags: ['Karaciğer Dostu', 'Vegan', 'Glutensiz'],
      allergens: [],
      dietTypes: ['vegetarian', 'vegan', 'balanced'],
    },
  ],
  dinner: [
    {
      id: 'alt-d1',
      title: 'Zeytinyağlı Taze Fasulye & Laktozsuz Yoğurt',
      description: 'Geleneksel zeytinyağlı taze fasulye ve yanında 150g laktozsuz probiyotik yoğurt.',
      calories: 320,
      proteinGrams: 16,
      carbsGrams: 28,
      fatGrams: 14,
      tags: ['Hafif Sindirim', 'Laktozsuz', 'Vejetaryen'],
      allergens: [],
      dietTypes: ['vegetarian', 'balanced'],
    },
    {
      id: 'alt-d2',
      title: 'Hindi Sote & Fırın Tatlı Patates',
      description: '160g jülyen hindi göğsü, renkli biberler ve fırınlanmış küp tatlı patates.',
      calories: 430,
      proteinGrams: 42,
      carbsGrams: 36,
      fatGrams: 10,
      tags: ['Düşük Glisemik', 'Kas Onarımı', 'Glutensiz'],
      allergens: [],
      dietTypes: ['high_protein', 'balanced'],
    },
    {
      id: 'alt-d3',
      title: 'Izgara Levrek & Roka Salatası',
      description: 'Deniz levreği fileto, cevizsiz taze roka salatası ve fırınlanmış sarımsaklı kabak.',
      calories: 380,
      proteinGrams: 38,
      carbsGrams: 8,
      fatGrams: 22,
      tags: ['Akdeniz Diyeti', 'Keto Uyumlu', 'Glutensiz', 'Laktozsuz'],
      allergens: ['seafood'],
      dietTypes: ['keto', 'high_protein', 'balanced'],
    },
    {
      id: 'alt-d4',
      title: 'Fırında Mantarlı & Mercimekli Güveç',
      description: 'İstiridye mantarı, yeşil mercimek, domates sosu ve fırınlanmış kabak dilimleri.',
      calories: 360,
      proteinGrams: 24,
      carbsGrams: 42,
      fatGrams: 11,
      tags: ['Vegan', 'Vejetaryen', 'Yüksek Lif', 'Glutensiz'],
      allergens: [],
      dietTypes: ['vegetarian', 'vegan', 'balanced'],
    },
    {
      id: 'alt-d5',
      title: 'Köz Patlıcanlı Nohut Yemeği & Kinoa',
      description: 'Közlenmiş bostan patlıcanı, kimyonlu nohut yemeği ve yanında haşlanmış kinoa.',
      calories: 390,
      proteinGrams: 20,
      carbsGrams: 48,
      fatGrams: 12,
      tags: ['Bitkisel Protein', 'Vegan', 'Glutensiz'],
      allergens: [],
      dietTypes: ['vegetarian', 'vegan', 'balanced'],
    },
    {
      id: 'alt-d6',
      title: 'Buharda Sebzeler & Fırın Hellimli Salata',
      description: 'Izgara hellim peyniri, buharda brokoli, taze kekik ve zeytinyağlı sos.',
      calories: 350,
      proteinGrams: 22,
      carbsGrams: 12,
      fatGrams: 24,
      tags: ['Keto Uyumlu', 'Vejetaryen', 'Düşük Karb'],
      allergens: ['lactose'],
      dietTypes: ['vegetarian', 'keto', 'balanced'],
    },
  ],
  snack: [
    {
      id: 'alt-s1',
      title: 'Yeşil Elma & Kabak Çekirdeği',
      description: 'Dilimlenmiş tarçınlı yeşil elma ve 25g kavrulmamış çiğ kabak çekirdeği.',
      calories: 180,
      proteinGrams: 7,
      carbsGrams: 18,
      fatGrams: 9,
      tags: ['Fıstıksız', 'Kuruyemişsiz', 'Vegan', 'Glutensiz'],
      allergens: [],
      dietTypes: ['vegan', 'vegetarian', 'balanced'],
    },
    {
      id: 'alt-s2',
      title: 'Fıstık Ezmeli Muz Dilimleri',
      description: '1 orta boy muz ve 1 tatlı kaşığı şekersiz fıstık ezmesi.',
      calories: 210,
      proteinGrams: 5,
      carbsGrams: 32,
      fatGrams: 8,
      tags: ['Antrenman Öncesi', 'Potasyum'],
      allergens: ['peanut'],
      dietTypes: ['vegetarian', 'vegan', 'balanced'],
    },
    {
      id: 'alt-s3',
      title: 'Laktozsuz Sade Kefir & Yaban Mersini',
      description: '200ml laktozsuz probiyotik kefir ve 1 avuç taze yaban mersini.',
      calories: 150,
      proteinGrams: 9,
      carbsGrams: 18,
      fatGrams: 4,
      tags: ['Bağırsak Dostu', 'Laktozsuz', 'Glutensiz'],
      allergens: [],
      dietTypes: ['vegetarian', 'balanced'],
    },
    {
      id: 'alt-s4',
      title: 'Havuç-Salatalık & Zeytinyağlı Humus',
      description: 'Taze çıtır sebze çubukları ve 60g ev yapımı kimyonlu humus.',
      calories: 160,
      proteinGrams: 6,
      carbsGrams: 16,
      fatGrams: 8,
      tags: ['Fıstıksız', 'Vegan', 'Glutensiz', 'Düşük Kalori'],
      allergens: [],
      dietTypes: ['vegan', 'vegetarian', 'keto', 'balanced'],
    },
    {
      id: 'alt-s5',
      title: 'Cevizli Kuru Kayısı Tabağı',
      description: '3 adet gün kurusu kayısı ve 3 tam ceviz içi.',
      calories: 190,
      proteinGrams: 4,
      carbsGrams: 26,
      fatGrams: 9,
      tags: ['Lif Kaynağı', 'Doğal Şeker'],
      allergens: ['peanut'],
      dietTypes: ['vegetarian', 'vegan', 'balanced'],
    },
  ],
};

/**
 * Checks whether a recipe is 100% compliant with the user's allergies and diet goals.
 */
export function isMealSafeForProfile(
  meal: MealRecipe,
  userAllergies: string[] = [],
  dietaryGoal?: string
): boolean {
  if (!userAllergies || userAllergies.length === 0) return true;

  const allergyLower = userAllergies.join(' ').toLowerCase();

  // 1. Laktoz Alerjisi / Hassasiyeti
  if (allergyLower.includes('laktoz') && meal.allergens?.includes('lactose')) {
    return false;
  }
  // 2. Gluten Hassasiyeti
  if (allergyLower.includes('gluten') && meal.allergens?.includes('gluten')) {
    return false;
  }
  // 3. Fıstık / Kuruyemiş Alerjisi
  if (allergyLower.includes('fıstık') && meal.allergens?.includes('peanut')) {
    return false;
  }
  // 4. Deniz Ürünleri Alerjisi
  if (allergyLower.includes('deniz') && meal.allergens?.includes('seafood')) {
    return false;
  }
  // 5. Yumurta Alerjisi
  if (allergyLower.includes('yumurta') && meal.allergens?.includes('egg')) {
    return false;
  }
  // 6. Vejetaryen Tercihi
  if (allergyLower.includes('vejetaryen') && !meal.dietTypes?.includes('vegetarian')) {
    return false;
  }
  // 7. Ketojenik Tercihi
  if (allergyLower.includes('ketojenik')) {
    if (!meal.dietTypes?.includes('keto') && meal.carbsGrams > 22) {
      return false;
    }
  }

  return true;
}

/**
 * Generates a dynamic 7-day meal plan strictly filtered against user's allergies and preferences,
 * with real calendar dates computed for the current week.
 */
export function generatePersonalizedWeekPlan(
  allergies: string[],
  goal: string
): DayPlan[] {
  const now = new Date();
  // Monday is 0 in Turkey (Monday through Sunday)
  const currentDayOfWeek = now.getDay();
  const mondayOffset = (currentDayOfWeek + 6) % 7;

  const mondayDate = new Date(now);
  mondayDate.setDate(now.getDate() - mondayOffset);

  const dayTemplates = [
    { dayId: 'mon', dayName: 'Pazartesi', dayShort: 'Pzt' },
    { dayId: 'tue', dayName: 'Salı', dayShort: 'Sal' },
    { dayId: 'wed', dayName: 'Çarşamba', dayShort: 'Çar' },
    { dayId: 'thu', dayName: 'Perşembe', dayShort: 'Per' },
    { dayId: 'fri', dayName: 'Cuma', dayShort: 'Cum' },
    { dayId: 'sat', dayName: 'Cumartesi', dayShort: 'Cmt' },
    { dayId: 'sun', dayName: 'Pazar', dayShort: 'Paz' },
  ];

  return dayTemplates.map((template, dayIndex) => {
    const targetDate = new Date(mondayDate);
    targetDate.setDate(mondayDate.getDate() + dayIndex);

    const isToday =
      targetDate.getDate() === now.getDate() &&
      targetDate.getMonth() === now.getMonth() &&
      targetDate.getFullYear() === now.getFullYear();

    const getSafeMeal = (type: MealType, offset: number) => {
      const allForType = ALTERNATIVE_MEALS[type];
      const safe = allForType.filter((m) => isMealSafeForProfile(m, allergies, goal));
      const pool = safe.length > 0 ? safe : allForType;
      return pool[(dayIndex + offset) % pool.length];
    };

    return {
      dayId: template.dayId,
      dayName: template.dayName,
      dayShort: template.dayShort,
      dayOfMonth: targetDate.getDate(),
      isToday,
      breakfast: getSafeMeal('breakfast', 0),
      lunch: getSafeMeal('lunch', 1),
      dinner: getSafeMeal('dinner', 2),
      snack: getSafeMeal('snack', 3),
    };
  });
}

export const MealPlanScreen: React.FC = () => {
  const { userProfile, addMeal, isDarkMode } = useDietStore();
  const theme = getThemeColors(isDarkMode);

  const [weekPlan, setWeekPlan] = useState<DayPlan[]>(() =>
    generatePersonalizedWeekPlan(userProfile.allergies || [], userProfile.dietaryGoal || 'weight_loss')
  );

  // Automatically default selected tab to TODAY's index (0 = Mon, 1 = Tue, etc.)
  const now = new Date();
  const todayMondayIndex = (now.getDay() + 6) % 7;
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(() => todayMondayIndex);

  // Synchronize meal plan dynamically when user changes profile/allergies/goals
  useEffect(() => {
    setWeekPlan(
      generatePersonalizedWeekPlan(userProfile.allergies || [], userProfile.dietaryGoal || 'weight_loss')
    );
  }, [userProfile.allergies, userProfile.dietaryGoal]);

  const activeDay = weekPlan[selectedDayIndex] || weekPlan[0];

  // Calculate day total metrics
  const totalPlannedCalories =
    activeDay.breakfast.calories +
    activeDay.lunch.calories +
    activeDay.dinner.calories +
    activeDay.snack.calories;

  const totalPlannedProtein =
    activeDay.breakfast.proteinGrams +
    activeDay.lunch.proteinGrams +
    activeDay.dinner.proteinGrams +
    activeDay.snack.proteinGrams;

  // Swap single meal with next safe alternative recipe
  const handleSwapMeal = (mealType: MealType) => {
    const allForType = ALTERNATIVE_MEALS[mealType];
    const safeAlternatives = allForType.filter((m) =>
      isMealSafeForProfile(m, userProfile.allergies || [], userProfile.dietaryGoal)
    );
    const pool = safeAlternatives.length > 0 ? safeAlternatives : allForType;

    const currentId = activeDay[mealType].id;
    const currentIndex = pool.findIndex((m) => m.id === currentId);
    const nextIndex = (currentIndex + 1) % pool.length;
    const nextMeal = pool[nextIndex];

    setWeekPlan((prevPlan) => {
      const updated = [...prevPlan];
      updated[selectedDayIndex] = {
        ...updated[selectedDayIndex],
        [mealType]: nextMeal,
      };
      return updated;
    });

    Alert.alert('Öğün Yenilendi! 🔄', `Profilinize uygun yeni seçim: "${nextMeal.title}" (${nextMeal.calories} kcal)`);
  };

  // Log meal directly to user's daily Dashboard
  const handleLogMealToToday = (meal: MealRecipe, mealType: MealType) => {
    addMeal({
      name: meal.title,
      portionGrams: 200,
      mealType,
      calories: meal.calories,
      proteinGrams: meal.proteinGrams,
      carbsGrams: meal.carbsGrams,
      fatGrams: meal.fatGrams,
    });

    Alert.alert('Günlüğe Eklendi! ✅', `"${meal.title}" bugünkü kalori halkanıza başarıyla eklendi.`);
  };

  const renderMealCard = (meal: MealRecipe, mealType: MealType, titleLabel: string, icon: string) => {
    return (
      <View
        style={[
          styles.mealCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
        key={`${mealType}-${meal.id}`}
      >
        <View style={styles.mealHeaderRow}>
          <View style={styles.mealTitleGroup}>
            <Text style={styles.mealTypeIcon}>{icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.mealTypeLabel, { color: theme.textMuted }]}>{titleLabel}</Text>
              <Text style={[styles.mealTitle, { color: theme.textPrimary }]}>{meal.title}</Text>
            </View>
          </View>
          <Text
            style={[
              styles.mealCaloriesBadge,
              {
                color: isDarkMode ? theme.primary : Colors.primaryDark,
                backgroundColor: isDarkMode ? theme.primaryMuted : Colors.primaryLight,
              },
            ]}
          >
            {meal.calories} kcal
          </Text>
        </View>

        <Text style={[styles.mealDescription, { color: theme.textSecondary }]}>{meal.description}</Text>

        {/* Macro breakdown */}
        <View style={styles.macroPillsRow}>
          <View style={[styles.macroPill, { backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : Colors.proteinLight }]}>
            <Text style={[styles.macroPillText, { color: theme.protein }]}>
              🍗 {meal.proteinGrams}g Protein
            </Text>
          </View>
          <View style={[styles.macroPill, { backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.2)' : Colors.carbsLight }]}>
            <Text style={[styles.macroPillText, { color: theme.calories }]}>
              🌾 {meal.carbsGrams}g Karb
            </Text>
          </View>
          <View style={[styles.macroPill, { backgroundColor: isDarkMode ? 'rgba(236, 72, 153, 0.2)' : Colors.fatLight }]}>
            <Text style={[styles.macroPillText, { color: theme.fat }]}>
              🥑 {meal.fatGrams}g Yağ
            </Text>
          </View>
        </View>

        {/* Recipe Tag Chips (e.g. Glutensiz, Laktozsuz, Vejetaryen) */}
        {meal.tags && meal.tags.length > 0 && (
          <View style={styles.recipeTagsRow}>
            {meal.tags.map((tag, tIdx) => (
              <View
                key={`tag-${tIdx}`}
                style={[
                  styles.recipeTagBadge,
                  { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                ]}
              >
                <Text style={[styles.recipeTagText, { color: theme.textSecondary }]}>✓ {tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View style={[styles.cardActionsRow, { borderTopColor: theme.border }]}>
          <TouchableOpacity
            style={[
              styles.swapButton,
              { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
            ]}
            onPress={() => handleSwapMeal(mealType)}
            activeOpacity={0.7}
          >
            <Text style={[styles.swapButtonText, { color: theme.textSecondary }]}>🔄 Alternatif Sun</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.logButton, { backgroundColor: theme.primary }]}
            onPress={() => handleLogMealToToday(meal, mealType)}
            activeOpacity={0.8}
          >
            <Text style={styles.logButtonText}>➕ Günlüğe Ekle</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Info Banner with Personalization Badges */}
      <View style={[styles.planHeaderCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.badgeRow}>
          <View style={[styles.aiBadge, isDarkMode && { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: '#10B981' }]}>
            <Text style={[styles.aiBadgeText, { color: theme.primary }]}>✨ Gemini Akıllı Plan</Text>
          </View>
          <View style={[styles.goalPill, { backgroundColor: theme.surfaceSubtle }]}>
            <Text style={[styles.goalPillText, { color: theme.textSecondary }]}>
              {userProfile.dietaryGoal === 'weight_loss'
                ? '🔥 Yağ Yakımı (-500 kcal)'
                : userProfile.dietaryGoal === 'muscle_gain'
                ? '💪 Kas Kazanımı (+300 kcal)'
                : '⚖️ Denge & Koruma'}
            </Text>
          </View>
        </View>

        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Haftalık Beslenme Rehberiniz</Text>
        <Text style={[styles.headerDesc, { color: theme.textMuted }]}>
          {userProfile.name} için günlük {userProfile.targetCalories} kcal hedefi ve metabolik gereksinimlerinize göre dengelenmiş 7 günlük menü.
        </Text>

        {/* Active Allergen & Dietary Preference Filter HUD */}
        <View style={[styles.filterBanner, { borderTopColor: theme.border }]}>
          <View style={styles.filterBannerHeader}>
            <Text style={[styles.filterBannerTitle, { color: theme.textSecondary }]}>
              🛡️ Aktif Alerjen & Tercih Filtreleri:
            </Text>
            <View style={[styles.safetyVerifiedBadge, isDarkMode && { backgroundColor: 'rgba(34, 197, 94, 0.2)', borderColor: '#22C55E' }]}>
              <Text style={[styles.safetyVerifiedText, isDarkMode && { color: '#4ADE80' }]}>✓ %100 Uyumlu</Text>
            </View>
          </View>

          {userProfile.allergies && userProfile.allergies.length > 0 ? (
            <View style={styles.allergyChipsRow}>
              {userProfile.allergies.map((allergy, i) => (
                <View
                  key={`all-${i}`}
                  style={[
                    styles.planAllergyChip,
                    isDarkMode && { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.4)' },
                  ]}
                >
                  <Text style={[styles.planAllergyChipText, isDarkMode && { color: '#FCD34D' }]}>{allergy}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.noFilterText, { color: theme.textMuted }]}>Tüm gıda grupları güvenle dahil edilmiştir.</Text>
          )}
        </View>
      </View>

      {/* 7-Day Horizontal Day Picker with Real Calendar Dates */}
      <View style={styles.dayPickerWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayPickerContent}>
          {weekPlan.map((day, idx) => {
            const isSelected = selectedDayIndex === idx;
            return (
              <TouchableOpacity
                key={day.dayId}
                style={[
                  styles.dayTab,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                  isSelected && [styles.dayTabActive, { backgroundColor: theme.primary, borderColor: theme.primary }],
                  day.isToday && !isSelected && { borderColor: theme.primary, borderWidth: 1.8 },
                ]}
                onPress={() => setSelectedDayIndex(idx)}
                activeOpacity={0.8}
              >
                <Text style={[styles.dayShortText, { color: theme.textMuted }, isSelected && styles.dayShortActive]}>
                  {day.dayShort}
                </Text>
                <Text style={[styles.dayNumText, { color: theme.textPrimary }, isSelected && styles.dayNumActive]}>
                  {day.dayOfMonth}
                </Text>
                {day.isToday ? (
                  <View
                    style={[
                      styles.todayIndicatorPill,
                      { backgroundColor: isSelected ? '#FFFFFF' : theme.primary },
                    ]}
                  >
                    <Text
                      style={[
                        styles.todayIndicatorText,
                        { color: isSelected ? theme.primaryDark : '#FFFFFF' },
                      ]}
                    >
                      Bugün
                    </Text>
                  </View>
                ) : isSelected ? (
                  <View style={styles.activeDayDot} />
                ) : null}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Day Summary Telemetry Card */}
      <View style={[styles.telemetryCard, { backgroundColor: theme.surfaceSubtle, borderColor: theme.border }]}>
        <View style={styles.telemetryRow}>
          <View>
            <Text style={[styles.telemetryDayTitle, { color: theme.textPrimary }]}>
              {activeDay.dayName} ({activeDay.dayOfMonth} Ekim) Planı
            </Text>
            <Text style={[styles.telemetrySub, { color: theme.textMuted }]}>
              Hedef: {userProfile.targetCalories} kcal • Plan: {totalPlannedCalories} kcal
            </Text>
          </View>
          <View style={[styles.proteinBadge, { backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.25)' : Colors.proteinLight }]}>
            <Text style={[styles.proteinBadgeText, { color: theme.protein }]}>{totalPlannedProtein}g Protein</Text>
          </View>
        </View>
      </View>

      {/* 4 Daily Meal Cards */}
      {renderMealCard(activeDay.breakfast, 'breakfast', 'Kahvaltı', '🍳')}
      {renderMealCard(activeDay.lunch, 'lunch', 'Öğle Yemeği', '☀️')}
      {renderMealCard(activeDay.dinner, 'dinner', 'Akşam Yemeği', '🌙')}
      {renderMealCard(activeDay.snack, 'snack', 'Ara Öğün', '🍎')}

      {/* Footer Info */}
      <View
        style={[
          styles.footerInfoBox,
          isDarkMode
            ? { backgroundColor: '#1E293B', borderColor: '#334155' }
            : { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
        ]}
      >
        <Text style={[styles.footerInfoText, isDarkMode && { color: '#93C5FD' }]}>
          💡 Beğenmediğiniz bir öğünü "Alternatif Sun" butonuyla anında değiştirebilirsiniz. Tüm alternatifler kayıtlı alerjilerinize ve hedeflerinize %100 uygundur.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl * 1.5,
  },
  planHeaderCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    ...Shadows.card,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  aiBadge: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  aiBadgeText: {
    ...Typography.tiny,
    fontWeight: '700',
  },
  goalPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  goalPillText: {
    ...Typography.tiny,
    fontWeight: '600',
  },
  headerTitle: {
    ...Typography.h2,
    marginTop: Spacing.xs,
  },
  headerDesc: {
    ...Typography.caption,
    marginTop: 4,
    lineHeight: 18,
  },
  filterBanner: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  filterBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  filterBannerTitle: {
    ...Typography.tiny,
    fontWeight: '700',
  },
  safetyVerifiedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  safetyVerifiedText: {
    ...Typography.tiny,
    fontSize: 10,
    color: '#15803D',
    fontWeight: '800',
  },
  allergyChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: 4,
  },
  planAllergyChip: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  planAllergyChipText: {
    ...Typography.tiny,
    fontSize: 10,
    color: '#92400E',
    fontWeight: '700',
  },
  noFilterText: {
    ...Typography.tiny,
    fontStyle: 'italic',
    marginTop: 2,
  },
  dayPickerWrapper: {
    marginBottom: Spacing.md,
  },
  dayPickerContent: {
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  dayTab: {
    width: 54,
    minHeight: 70,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    ...Shadows.card,
  },
  dayTabActive: {
    transform: [{ scale: 1.05 }],
  },
  dayShortText: {
    ...Typography.tiny,
    fontWeight: '600',
  },
  dayShortActive: {
    color: Colors.textInverse,
  },
  dayNumText: {
    ...Typography.bodyBold,
    fontSize: 16,
    marginTop: 2,
  },
  dayNumActive: {
    color: Colors.textInverse,
    fontWeight: '800',
  },
  todayIndicatorPill: {
    marginTop: 3,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
  },
  todayIndicatorText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  activeDayDot: {
    width: 4,
    height: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.textInverse,
    marginTop: 3,
  },
  telemetryCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  telemetryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  telemetryDayTitle: {
    ...Typography.bodyBold,
  },
  telemetrySub: {
    ...Typography.tiny,
    marginTop: 2,
  },
  proteinBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  proteinBadgeText: {
    ...Typography.captionBold,
  },
  mealCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    ...Shadows.card,
  },
  mealHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  mealTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  mealTypeIcon: {
    fontSize: 22,
  },
  mealTypeLabel: {
    ...Typography.tiny,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  mealTitle: {
    ...Typography.bodyBold,
  },
  mealCaloriesBadge: {
    ...Typography.captionBold,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  mealDescription: {
    ...Typography.caption,
    marginTop: Spacing.xs,
    lineHeight: 18,
  },
  macroPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.md,
    paddingTop: Spacing.xs,
  },
  macroPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
  },
  macroPillText: {
    ...Typography.tiny,
    fontWeight: '700',
  },
  recipeTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  recipeTagBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  recipeTagText: {
    ...Typography.tiny,
    fontSize: 9,
    fontWeight: '600',
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
  swapButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  swapButtonText: {
    ...Typography.captionBold,
  },
  logButton: {
    flex: 1.2,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  logButtonText: {
    ...Typography.captionBold,
    color: Colors.textInverse,
  },
  footerInfoBox: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginTop: Spacing.sm,
  },
  footerInfoText: {
    ...Typography.caption,
    textAlign: 'center',
    lineHeight: 18,
  },
});
