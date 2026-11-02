import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  PanResponder,
  Animated,
} from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Colors, getThemeColors, ThemeColors } from '../constants/colors';
import { Spacing, BorderRadius, Typography, Shadows } from '../constants/theme';
import { useDietStore } from '../store/useDietStore';
import { UserProfile, CalculationBasis } from '../types';
import { apiService } from '../services/api';
import { DraggableRuler } from '../components/onboarding/DraggableRuler';
import {
  ALLERGY_OPTIONS,
  DIET_TYPES,
  OBSTACLE_OPTIONS,
  PACE_OPTIONS,
  FIRST_MEAL_TIMES,
  LAST_MEAL_TIMES,
  OnboardingStage,
  TOTAL_WIZARD_STEPS,
  ONBOARDING_PHASES,
} from '../components/onboarding/OnboardingConstants';

export { ALLERGY_OPTIONS };

interface OnboardingScreenProps {
  onComplete?: () => void;
  isEditing?: boolean;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onComplete,
  isEditing = false,
}) => {
  const userProfile = useDietStore((state) => state.userProfile);
  const updateProfile = useDietStore((state) => state.updateProfile);
  const isDarkMode = useDietStore((state) => state.isDarkMode);
  const toggleDarkMode = useDietStore((state) => state.toggleDarkMode);
  const theme = getThemeColors(isDarkMode);
  const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);

  // Flow stage & step state
  const [stage, setStage] = useState<OnboardingStage>(isEditing ? 'wizard' : 'welcome');
  const [step, setStep] = useState<number>(0);
  const [calcProgress, setCalcProgress] = useState<number>(0);
  const [isDraggingRuler, setIsDraggingRuler] = useState<boolean>(false);

  const currentPhase = useMemo(
    () => ONBOARDING_PHASES.find((p) => p.steps.includes(step)) || ONBOARDING_PHASES[0],
    [step]
  );

  // Form State initialized with current user profile or standard defaults
  const [name, setName] = useState(userProfile.name || 'Bertan Beyal');
  const [gender, setGender] = useState<'male' | 'female'>(userProfile.gender || 'male');
  const [age, setAge] = useState(userProfile.age ? String(userProfile.age) : '22');
  const [heightCm, setHeightCm] = useState(
    userProfile.heightCm ? String(userProfile.heightCm) : '180'
  );
  const [weightKg, setWeightKg] = useState(
    userProfile.weightKg ? String(userProfile.weightKg) : '76'
  );
  const [targetWeightKg, setTargetWeightKg] = useState(() => {
    if (userProfile.targetWeightKg && userProfile.targetWeightKg > 0) {
      return String(userProfile.targetWeightKg);
    }
    const curW = userProfile.weightKg || 76;
    if (userProfile.dietaryGoal === 'weight_loss') return String(Math.max(40, curW - 4));
    if (userProfile.dietaryGoal === 'muscle_gain') return String(curW + 4);
    return String(curW);
  });

  const [selectedAllergies, setSelectedAllergies] = useState<string[]>(
    userProfile.allergies && userProfile.allergies.length > 0
      ? userProfile.allergies
      : ['🥜 Fıstık (Hafif)', '🥛 Laktoz (Düşük Tolerans)']
  );

  // Clinical & Sports additions
  const [doesSports, setDoesSports] = useState<boolean>(
    userProfile.doesSports !== undefined ? userProfile.doesSports : true
  );
  const [sportsDaysPerWeek, setSportsDaysPerWeek] = useState<number>(
    userProfile.sportsDaysPerWeek || 3
  );
  const [hasDiabetes, setHasDiabetes] = useState<boolean>(userProfile.hasDiabetes || false);
  const [hasCholesterol, setHasCholesterol] = useState<boolean>(
    userProfile.hasCholesterol || false
  );
  const [hasHypertension, setHasHypertension] = useState<boolean>(
    userProfile.hasHypertension || false
  );
  const [calculationBasis, setCalculationBasis] = useState<CalculationBasis>(
    userProfile.calculationBasis || 'current'
  );
  const [dietaryGoal, setDietaryGoal] = useState<UserProfile['dietaryGoal']>(
    userProfile.dietaryGoal || 'weight_loss'
  );

  // New Cal AI & Calz Wizard States
  const [weeklyPaceKg, setWeeklyPaceKg] = useState<number>(userProfile.weeklyPaceKg || 0.5);
  const [dietType, setDietType] = useState<string>(userProfile.dietType || 'balanced');
  const [dailyMealsCount, setDailyMealsCount] = useState<number>(
    userProfile.dailyMealsCount || 3
  );
  const [firstMealTime, setFirstMealTime] = useState<string>(
    userProfile.firstMealTime || '09:00'
  );
  const [lastMealTime, setLastMealTime] = useState<string>(userProfile.lastMealTime || '19:00');
  const [weekendFlexibility, setWeekendFlexibility] = useState<boolean>(
    userProfile.weekendFlexibility !== undefined ? userProfile.weekendFlexibility : true
  );
  const [mainObstacles, setMainObstacles] = useState<string[]>(
    userProfile.mainObstacles || ['Gece geç saatlerde atıştırmak']
  );

  // Sync Backend BMR calculation result if returned during 'calculating' stage
  const [backendSyncedMetrics, setBackendSyncedMetrics] = useState<{
    bmr?: number;
    tdee?: number;
    targetCalories?: number;
    bmrFormulaUsed?: string;
    idealWeightKg?: number;
    bmi?: number;
  } | null>(null);

  const toggleAllergy = (id: string) => {
    setSelectedAllergies((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const toggleObstacle = (id: string) => {
    setMainObstacles((prev) =>
      prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]
    );
  };

  const handleSelectGoal = (goal: UserProfile['dietaryGoal']) => {
    setDietaryGoal(goal);
    const curW = parseFloat(weightKg) || 76;
    if (goal === 'weight_loss') {
      setTargetWeightKg(String(Math.max(40, Math.round(curW - 5))));
    } else if (goal === 'muscle_gain') {
      setTargetWeightKg(String(Math.round(curW + 4)));
    } else {
      setTargetWeightKg(String(Math.round(curW)));
    }
  };

  const adjustNumericValue = (
    currentStr: string,
    setter: (val: string) => void,
    delta: number,
    min: number,
    max: number,
    isDecimal = false
  ) => {
    const parsed = parseFloat(currentStr) || min;
    const next = Math.max(min, Math.min(max, parsed + delta));
    setter(isDecimal ? String(Math.round(next * 10) / 10) : String(Math.round(next)));
  };

  // Live Clinical BMR Switch & Metabolic Calculation (Harris-Benedict vs Mifflin-St Jeor)
  const calculatedMetrics = useMemo(() => {
    const numAge = Math.max(12, Math.min(100, parseInt(age, 10) || 22));
    const numHeight = Math.max(120, Math.min(230, parseFloat(heightCm) || 180));
    const numWeight = Math.max(35, Math.min(250, parseFloat(weightKg) || 76));
    const numTargetWeight = Math.max(
      35,
      Math.min(250, parseFloat(targetWeightKg) || numWeight)
    );

    const bmi = parseFloat((numWeight / (numHeight / 100) ** 2).toFixed(2));

    // 1. Smart BMR switch based on clinical standard (BMI <= 30 vs BMI > 30)
    let bmr: number;
    let bmrFormulaUsed: 'revised_harris_benedict' | 'mifflin_st_jeor';
    let bmrFormulaLabel: string;
    if (bmi <= 30) {
      bmrFormulaUsed = 'revised_harris_benedict';
      bmrFormulaLabel = 'Harris-Benedict (Altın Standart)';
      if (gender === 'male') {
        bmr = 88.362 + 13.397 * numWeight + 4.799 * numHeight - 5.677 * numAge;
      } else {
        bmr = 447.593 + 9.247 * numWeight + 3.098 * numHeight - 4.33 * numAge;
      }
    } else {
      bmrFormulaUsed = 'mifflin_st_jeor';
      bmrFormulaLabel = 'Mifflin-St Jeor (Obezite Protokolü)';
      if (gender === 'male') {
        bmr = 10 * numWeight + 6.25 * numHeight - 5 * numAge + 5;
      } else {
        bmr = 10 * numWeight + 6.25 * numHeight - 5 * numAge - 161;
      }
    }
    bmr = Math.round(bmr);

    // 2. Activity Multiplier & derived activityLevel mapped from sports days
    let multiplier = 1.55;
    let derivedActivityLevel: UserProfile['activityLevel'] = 'moderate';
    if (doesSports) {
      if (sportsDaysPerWeek === 0) {
        multiplier = 1.2;
        derivedActivityLevel = 'sedentary';
      } else if (sportsDaysPerWeek <= 2) {
        multiplier = 1.375;
        derivedActivityLevel = 'light';
      } else if (sportsDaysPerWeek <= 4) {
        multiplier = 1.55;
        derivedActivityLevel = 'moderate';
      } else if (sportsDaysPerWeek <= 6) {
        multiplier = 1.725;
        derivedActivityLevel = 'active';
      } else {
        multiplier = 1.9;
        derivedActivityLevel = 'very_active';
      }
    } else {
      multiplier = 1.2;
      derivedActivityLevel = 'sedentary';
    }

    const tdee = Math.round(bmr * multiplier);

    // 3. Age-adjusted Ideal BMI & Ideal Weight
    let idealBmi = 22;
    if (numAge <= 24) idealBmi = 21;
    else if (numAge <= 34) idealBmi = 22;
    else if (numAge <= 44) idealBmi = 23;
    else if (numAge <= 54) idealBmi = 24;
    else idealBmi = 25;

    const idealWeightKg = parseFloat((idealBmi * (numHeight / 100) ** 2).toFixed(1));

    // Ideal BMR & Ideal TDEE
    let idealBmr: number;
    if (idealBmi <= 30) {
      idealBmr =
        gender === 'male'
          ? 88.362 + 13.397 * idealWeightKg + 4.799 * numHeight - 5.677 * numAge
          : 447.593 + 9.247 * idealWeightKg + 3.098 * numHeight - 4.33 * numAge;
    } else {
      idealBmr =
        gender === 'male'
          ? 10 * idealWeightKg + 6.25 * numHeight - 5 * numAge + 5
          : 10 * idealWeightKg + 6.25 * numHeight - 5 * numAge - 161;
    }
    idealBmr = Math.round(idealBmr);
    const idealTdee = Math.round(idealBmr * multiplier);

    // 4. Target Calories based on calculationBasis, dietaryGoal & weeklyPaceKg
    const baseTdee = calculationBasis === 'ideal' ? idealTdee : tdee;
    // Pace calorie delta: 0.2 kg/wk -> ~220 kcal, 0.5 kg/wk -> ~400 kcal, 0.8 kg/wk -> ~650 kcal
    const paceCalorieDelta =
      weeklyPaceKg <= 0.25 ? 220 : weeklyPaceKg <= 0.55 ? 400 : 650;

    let targetCalories = baseTdee;
    if (dietaryGoal === 'weight_loss') {
      targetCalories = Math.max(1200, baseTdee - paceCalorieDelta);
    } else if (dietaryGoal === 'muscle_gain') {
      const gainSurplus = weeklyPaceKg <= 0.25 ? 200 : weeklyPaceKg <= 0.55 ? 300 : 450;
      targetCalories = baseTdee + gainSurplus;
    }

    // Apply backend synced target calories if available and standard pace is selected
    const finalTargetCalories =
      backendSyncedMetrics?.targetCalories && weeklyPaceKg === 0.5
        ? Math.round(backendSyncedMetrics.targetCalories)
        : targetCalories;

    // 5. Recommended Macros based on selected Diet Type
    const selectedDietObj =
      DIET_TYPES.find((d) => d.id === dietType) || DIET_TYPES[0];
    const pRatio = selectedDietObj.macros.p;
    const cRatio = selectedDietObj.macros.c;
    const fRatio = selectedDietObj.macros.f;

    const targetProteinGrams = Math.round((finalTargetCalories * pRatio) / 4);
    const targetCarbsGrams = Math.round((finalTargetCalories * cRatio) / 4);
    const targetFatGrams = Math.round((finalTargetCalories * fRatio) / 9);

    const proteinPct = Math.round(pRatio * 100);
    const carbsPct = Math.round(cRatio * 100);
    const fatPct = Math.round(fRatio * 100);

    const waterGoalMl = Math.round((numWeight * 35) / 50) * 50;

    // Weight delta & time-to-goal estimation (Cal AI style)
    const weightDelta = Math.round(Math.abs(numWeight - numTargetWeight) * 10) / 10;
    const effectivePace = Math.max(0.2, weeklyPaceKg);
    const estimatedWeeks =
      dietaryGoal === 'maintenance' || weightDelta === 0
        ? 0
        : Math.max(1, Math.round(weightDelta / effectivePace));
    const estimatedMonths = Math.max(1, Math.round((estimatedWeeks / 4.3) * 10) / 10);
    const estimatedDurationText =
      estimatedWeeks === 0
        ? 'Form koruma dengesi'
        : estimatedWeeks <= 6
        ? `${estimatedWeeks} hafta`
        : `${estimatedMonths} ay (${estimatedWeeks} hafta)`;

    return {
      numAge,
      numHeight,
      numWeight,
      numTargetWeight,
      weightDelta,
      estimatedWeeks,
      estimatedDurationText,
      bmi: backendSyncedMetrics?.bmi ?? bmi,
      bmrFormulaUsed: (backendSyncedMetrics?.bmrFormulaUsed as any) ?? bmrFormulaUsed,
      bmrFormulaLabel,
      bmr: backendSyncedMetrics?.bmr ?? bmr,
      tdee: backendSyncedMetrics?.tdee ?? tdee,
      idealBmi,
      idealWeightKg: backendSyncedMetrics?.idealWeightKg ?? idealWeightKg,
      idealBmr,
      idealTdee,
      targetCalories: finalTargetCalories,
      targetProteinGrams,
      targetCarbsGrams,
      targetFatGrams,
      proteinPct,
      carbsPct,
      fatPct,
      waterGoalMl,
      derivedActivityLevel,
    };
  }, [
    age,
    heightCm,
    weightKg,
    targetWeightKg,
    gender,
    doesSports,
    sportsDaysPerWeek,
    calculationBasis,
    dietaryGoal,
    weeklyPaceKg,
    dietType,
    backendSyncedMetrics,
  ]);

  // Run 0% -> 100% animation & backend API sync when stage enters 'calculating'
  useEffect(() => {
    if (stage !== 'calculating') return;

    setCalcProgress(0);

    // Fire authoritative BMR calculation request in parallel
    apiService
      .calculateBMR({
        weight_kg: calculatedMetrics.numWeight,
        height_cm: calculatedMetrics.numHeight,
        age: calculatedMetrics.numAge,
        gender,
        does_sports: doesSports,
        sports_days_per_week: sportsDaysPerWeek,
        activity_level: calculatedMetrics.derivedActivityLevel,
        goal: dietaryGoal,
        calculation_basis: calculationBasis,
        has_diabetes: hasDiabetes,
        has_cholesterol: hasCholesterol,
        has_hypertension: hasHypertension,
      })
      .then((res) => {
        if (res && typeof res.target_calories === 'number') {
          setBackendSyncedMetrics({
            bmr: Math.round(res.bmr),
            tdee: Math.round(res.tdee),
            targetCalories: Math.round(res.target_calories),
            bmrFormulaUsed: res.bmr_formula_used,
            idealWeightKg: res.ideal_weight_kg,
            bmi: res.bmi,
          });
        }
      })
      .catch((err) => console.warn('Onboarding calculateBMR sync note:', err));

    const interval = setInterval(() => {
      setCalcProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        const increment = prev < 40 ? 4 : prev < 80 ? 3 : 5;
        return Math.min(100, prev + increment);
      });
    }, 65);

    return () => clearInterval(interval);
  }, [stage]);

  // Automatically transition from 'calculating' (100%) to 'summary'
  useEffect(() => {
    if (stage === 'calculating' && calcProgress >= 100) {
      const timer = setTimeout(() => {
        setStage('summary');
      }, 450);
      return () => clearTimeout(timer);
    }
  }, [stage, calcProgress]);

  const handleFinalizeAndStart = () => {
    updateProfile({
      name: name.trim() || 'Kullanıcı',
      gender,
      age: calculatedMetrics.numAge,
      heightCm: calculatedMetrics.numHeight,
      weightKg: calculatedMetrics.numWeight,
      targetWeightKg: calculatedMetrics.numTargetWeight,
      activityLevel: calculatedMetrics.derivedActivityLevel,
      dietaryGoal,
      bmr: calculatedMetrics.bmr,
      tdee: calculatedMetrics.tdee,
      targetCalories: calculatedMetrics.targetCalories,
      targetProteinGrams: calculatedMetrics.targetProteinGrams,
      targetCarbsGrams: calculatedMetrics.targetCarbsGrams,
      targetFatGrams: calculatedMetrics.targetFatGrams,
      waterGoalMl: calculatedMetrics.waterGoalMl,
      allergies: selectedAllergies,
      doesSports,
      sportsDaysPerWeek,
      calculationBasis,
      hasDiabetes,
      hasCholesterol,
      hasHypertension,
      bmrFormulaUsed: calculatedMetrics.bmrFormulaUsed,
      idealWeightKg: calculatedMetrics.idealWeightKg,
      bmi: calculatedMetrics.bmi,
      weeklyPaceKg,
      dailyMealsCount,
      firstMealTime,
      lastMealTime,
      weekendFlexibility,
      dietType,
      mainObstacles,
    });

    if (onComplete) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      onComplete();
    }
  };

  const handleNextStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (step < TOTAL_WIZARD_STEPS - 1) {
      setStep(step + 1);
    } else {
      setStage('calculating');
    }
  };

  const handleBackStep = () => {
    Haptics.selectionAsync().catch(() => {});
    if (step > 0) {
      setStep(step - 1);
    } else if (!isEditing) {
      setStage('welcome');
    } else if (onComplete) {
      onComplete();
    }
  };

  // ============================================================================
  // STAGE 1: WELCOME / HERO SCREEN (Cal AI Style)
  // ============================================================================
  if (stage === 'welcome') {
    return (
      <View style={styles.welcomeContainer}>
        {/* Top Bar: Brand & Language / Theme Toggle */}
        <View style={styles.welcomeTopBar}>
          <View style={styles.brandBadge}>
            <Text style={styles.brandBadgeText}>🥗 DietAI</Text>
          </View>
          <View style={styles.welcomeTopRight}>
            <View style={styles.langPill}>
              <Text style={styles.langPillText}>🇹🇷 TR</Text>
            </View>
            <TouchableOpacity
              style={styles.themeToggleBtn}
              onPress={toggleDarkMode}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 16 }}>{isDarkMode ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Center Phone Mockup Card (Cal AI Food Scanner Preview) */}
        <View style={styles.mockupWrapper}>
          <View style={styles.phoneMockupFrame}>
            {/* Dynamic Island Notch */}
            <View style={styles.phoneNotch} />

            {/* Scanner Viewfinder Header */}
            <View style={styles.mockupHeaderRow}>
              <Text style={styles.mockupHeaderTitle}>📸 Akıllı Besin Tarayıcı</Text>
              <View style={styles.aiConfidencePill}>
                <Text style={styles.aiConfidenceText}>%96 Güven</Text>
              </View>
            </View>

            {/* Scanned Plate Visual Area */}
            <View style={styles.scannedPlateBox}>
              {/* Corner Viewfinder Brackets */}
              <View style={[styles.cornerBracket, styles.cornerTL]} />
              <View style={[styles.cornerBracket, styles.cornerTR]} />
              <View style={[styles.cornerBracket, styles.cornerBL]} />
              <View style={[styles.cornerBracket, styles.cornerBR]} />

              <Text style={styles.plateEmoji}>🍗🥗🥑</Text>
              <View style={styles.floatingPinBadge}>
                <Text style={styles.floatingPinText}>Izgara Tavuk & Kinoa • 385 kcal</Text>
              </View>
            </View>

            {/* Nutrition Overlay Sheet Inside Phone Mockup */}
            <View style={styles.mockupResultCard}>
              <View style={styles.mockupFoodTitleRow}>
                <View>
                  <Text style={styles.mockupFoodName}>Izgara Tavuk & Kinoa Salatası</Text>
                  <Text style={styles.mockupTimeText}>Öğle Yemeği • 200g Porsiyon</Text>
                </View>
                <View style={styles.portionCounterPill}>
                  <Text style={styles.portionCounterText}>-  1  +</Text>
                </View>
              </View>

              <View style={styles.mockupMacrosGrid}>
                <View style={styles.mockupMacroBox}>
                  <Text style={styles.mockupMacroLabel}>🔥 Kalori</Text>
                  <Text style={styles.mockupMacroVal}>385 kcal</Text>
                </View>
                <View style={styles.mockupMacroBox}>
                  <Text style={styles.mockupMacroLabel}>🥩 Protein</Text>
                  <Text style={[styles.mockupMacroVal, { color: Colors.protein }]}>42g</Text>
                </View>
                <View style={styles.mockupMacroBox}>
                  <Text style={styles.mockupMacroLabel}>🌾 Karb</Text>
                  <Text style={[styles.mockupMacroVal, { color: Colors.calories }]}>28g</Text>
                </View>
                <View style={styles.mockupMacroBox}>
                  <Text style={styles.mockupMacroLabel}>🥑 Yağ</Text>
                  <Text style={[styles.mockupMacroVal, { color: Colors.fat }]}>9g</Text>
                </View>
              </View>

              {/* Health Score Row */}
              <View style={styles.mockupHealthScoreRow}>
                <Text style={styles.mockupHealthLabel}>❤️ Sağlık Skoru</Text>
                <View style={styles.mockupHealthBarTrack}>
                  <View style={[styles.mockupHealthBarFill, { width: '90%' }]} />
                </View>
                <Text style={styles.mockupHealthScoreVal}>9/10</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Hero Copy & CTA Footer */}
        <View style={styles.welcomeFooter}>
          <Text style={styles.welcomeHeroTitle}>
            Kalori ve beslenme takibi çok kolaylaştı
          </Text>
          <Text style={styles.welcomeHeroSubtitle}>
            Tabağının fotoğrafını çek, yapay zekâ ile makrolarını saniyeler içinde öğren ve klinik BMR hedefine zahmetsizce ulaş.
          </Text>

          <TouchableOpacity
            style={styles.welcomePrimaryButton}
            onPress={() => {
              setStep(0);
              setStage('wizard');
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.welcomePrimaryButtonText}>Hemen Başla</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.welcomeSkipButton}
            onPress={handleFinalizeAndStart}
            activeOpacity={0.7}
          >
            <Text style={styles.welcomeSkipText}>
              Varsayılan profilim hazır mı?{' '}
              <Text style={styles.welcomeSkipTextBold}>Hızlı Geç →</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ============================================================================
  // STAGE 3: ANIMATED BMR PREPARATION (0% -> 100% Cal AI & Calz Style)
  // ============================================================================
  if (stage === 'calculating') {
    const ringSize = 180;
    const strokeWidth = 12;
    const radius = (ringSize - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (calcProgress / 100) * circumference;

    const statusMessage =
      calcProgress < 35
        ? `Fiziksel verileriniz ve VKİ (${calculatedMetrics.bmi}) analiz ediliyor...`
        : calcProgress < 70
        ? `${calculatedMetrics.bmrFormulaLabel} formülü uygulanıyor...`
        : calcProgress < 95
        ? 'Metabolik yaşınız ve makro besin hedefleriniz uyarlanıyor...'
        : 'Kişisel sağlık planınız hazırlandı!';

    const checklistItems = [
      { label: `Günlük Kalori Bütçesi (${calculatedMetrics.targetCalories} kcal)`, threshold: 20 },
      { label: `Karbonhidrat Dengesi (${calculatedMetrics.targetCarbsGrams}g)`, threshold: 40 },
      { label: `Protein Hedefi (${calculatedMetrics.targetProteinGrams}g)`, threshold: 60 },
      { label: `Sağlıklı Yağ Oranı (${calculatedMetrics.targetFatGrams}g)`, threshold: 80 },
      { label: 'Klinik Sağlık Skoru & Alerji Filtreleri', threshold: 95 },
    ];

    return (
      <View style={styles.calculatingContainer}>
        {/* Animated SVG Ring & Big Percentage */}
        <View style={styles.calcRingWrapper}>
          <Svg width={ringSize} height={ringSize}>
            <G rotation="-90" origin={`${ringSize / 2}, ${ringSize / 2}`}>
              <Circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                stroke={theme.border}
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              <Circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                stroke={theme.primary}
                strokeWidth={strokeWidth}
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </G>
          </Svg>
          <View style={styles.calcPercentOverlay}>
            <Text style={styles.calcPercentText}>{calcProgress}%</Text>
          </View>
        </View>

        <Text style={styles.calcMainTitle}>Her şeyi sizin için hazırlıyoruz</Text>
        <Text style={styles.calcSubStatus}>{statusMessage}</Text>

        {/* Horizontal Progress Bar (Cal AI style) */}
        <View style={styles.calcLinearBarTrack}>
          <View style={[styles.calcLinearBarFill, { width: `${calcProgress}%` }]} />
        </View>

        {/* Checklist Card */}
        <View style={styles.calcChecklistCard}>
          <Text style={styles.calcChecklistHeader}>Günlük kişisel önerileriniz:</Text>
          {checklistItems.map((item, idx) => {
            const isDone = calcProgress >= item.threshold;
            return (
              <View key={idx} style={styles.calcChecklistRow}>
                <Text
                  style={[
                    styles.calcChecklistLabel,
                    isDone && { color: theme.textPrimary, fontWeight: '700' },
                  ]}
                >
                  • {item.label}
                </Text>
                <View
                  style={[
                    styles.calcCheckCircle,
                    isDone && { backgroundColor: theme.primary, borderColor: theme.primary },
                  ]}
                >
                  {isDone && <Text style={styles.calcCheckMark}>✓</Text>}
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  }

  // ============================================================================
  // STAGE 4: "TEBRİKLER! KİŞİSEL SAĞLIK PLANINIZ HAZIR!" SUMMARY SCREEN (Calz Style)
  // ============================================================================
  if (stage === 'summary') {
    const donutSize = 210;
    const donutStroke = 24;
    const radius = (donutSize - donutStroke) / 2;
    const circumference = 2 * Math.PI * radius;

    // 3 Macro Arc Segments: Carbs (#8B5CF6), Protein (#EC4899), Fat (#F59E0B)
    const carbsFrac = calculatedMetrics.carbsPct / 100;
    const proteinFrac = calculatedMetrics.proteinPct / 100;
    const fatFrac = Math.max(0.05, 1 - carbsFrac - proteinFrac);

    const carbsLen = circumference * carbsFrac;
    const proteinLen = circumference * proteinFrac;
    const fatLen = circumference * fatFrac;

    return (
      <ScrollView
        contentContainerStyle={styles.summaryContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Confetti Header */}
        <View style={styles.summaryHeader}>
          <View style={styles.summaryCelebrationBadge}>
            <Text style={styles.summaryCelebrationText}>🎉 PLANINIZ OLUŞTURULDU</Text>
          </View>
          <Text style={styles.summaryTitle}>Tebrikler!</Text>
          <Text style={styles.summarySubtitle}>Kişisel sağlık planınız hazır!</Text>
        </View>

        {/* Calz-Style Multi-Segment Macro Donut Chart with Floating Gram Pills */}
        <View style={styles.donutCard}>
          <View style={styles.donutVisualWrapper}>
            {/* Floating Carbs Pill (Top-Left) */}
            <View style={[styles.floatingMacroBubble, styles.bubbleTopLeft]}>
              <Text style={[styles.floatingBubbleVal, { color: '#8B5CF6' }]}>
                {calculatedMetrics.targetCarbsGrams} g
              </Text>
              <Text style={styles.floatingBubbleLabel}>Karb</Text>
            </View>

            {/* Floating Fat Pill (Top-Right) */}
            <View style={[styles.floatingMacroBubble, styles.bubbleTopRight]}>
              <Text style={[styles.floatingBubbleVal, { color: '#F59E0B' }]}>
                {calculatedMetrics.targetFatGrams} g
              </Text>
              <Text style={styles.floatingBubbleLabel}>Yağ</Text>
            </View>

            {/* Floating Protein Pill (Bottom-Right) */}
            <View style={[styles.floatingMacroBubble, styles.bubbleBottomRight]}>
              <Text style={[styles.floatingBubbleVal, { color: '#EC4899' }]}>
                {calculatedMetrics.targetProteinGrams} g
              </Text>
              <Text style={styles.floatingBubbleLabel}>Protein</Text>
            </View>

            {/* Floating Water Pill (Bottom-Left) */}
            <View style={[styles.floatingMacroBubble, styles.bubbleBottomLeft]}>
              <Text style={[styles.floatingBubbleVal, { color: Colors.water }]}>
                {calculatedMetrics.waterGoalMl} ml
              </Text>
              <Text style={styles.floatingBubbleLabel}>Su</Text>
            </View>

            <Svg width={donutSize} height={donutSize}>
              <G rotation="-90" origin={`${donutSize / 2}, ${donutSize / 2}`}>
                {/* Background Track */}
                <Circle
                  cx={donutSize / 2}
                  cy={donutSize / 2}
                  r={radius}
                  stroke={theme.border}
                  strokeWidth={donutStroke}
                  fill="transparent"
                />
                {/* Segment 1: Carbs (#8B5CF6 Purple/Indigo) */}
                <Circle
                  cx={donutSize / 2}
                  cy={donutSize / 2}
                  r={radius}
                  stroke="#8B5CF6"
                  strokeWidth={donutStroke}
                  strokeDasharray={`${carbsLen} ${circumference}`}
                  strokeDashoffset={0}
                  strokeLinecap="butt"
                  fill="transparent"
                />
                {/* Segment 2: Protein (#EC4899 Rose/Pink) */}
                <Circle
                  cx={donutSize / 2}
                  cy={donutSize / 2}
                  r={radius}
                  stroke="#EC4899"
                  strokeWidth={donutStroke}
                  strokeDasharray={`${proteinLen} ${circumference}`}
                  strokeDashoffset={-carbsLen}
                  strokeLinecap="butt"
                  fill="transparent"
                />
                {/* Segment 3: Fat (#F59E0B Amber/Orange) */}
                <Circle
                  cx={donutSize / 2}
                  cy={donutSize / 2}
                  r={radius}
                  stroke="#F59E0B"
                  strokeWidth={donutStroke}
                  strokeDasharray={`${fatLen} ${circumference}`}
                  strokeDashoffset={-(carbsLen + proteinLen)}
                  strokeLinecap="butt"
                  fill="transparent"
                />
              </G>
            </Svg>

            {/* Center Calorie Value */}
            <View style={styles.donutCenterOverlay}>
              <Text style={styles.donutCalorieNumber}>
                {calculatedMetrics.targetCalories}
              </Text>
              <Text style={styles.donutCalorieUnit}>kcal / gün</Text>
            </View>
          </View>

          {/* Color-Coded Legend Row */}
          <View style={styles.donutLegendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#8B5CF6' }]} />
              <Text style={styles.legendText}>
                Karbonhidrat (%{calculatedMetrics.carbsPct})
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#EC4899' }]} />
              <Text style={styles.legendText}>
                Protein (%{calculatedMetrics.proteinPct})
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.legendText}>Yağ (%{calculatedMetrics.fatPct})</Text>
            </View>
          </View>

          <Text style={styles.donutEditableHint}>
            Bunu istediğiniz zaman profil sekmesinden düzenleyebilirsiniz
          </Text>
        </View>

        {/* Goal & Timeline Summary Card */}
        <View style={styles.summaryInfoCard}>
          <Text style={styles.summaryCardTitle}>🎯 Hedef ve Zaman Çizelgesi</Text>
          <View style={styles.summaryStatsGrid}>
            <View style={styles.summaryStatBox}>
              <Text style={styles.summaryStatLabel}>Mevcut → Hedef</Text>
              <Text style={styles.summaryStatValue}>
                {calculatedMetrics.numWeight} → {calculatedMetrics.numTargetWeight} kg
              </Text>
            </View>
            <View style={styles.summaryStatBox}>
              <Text style={styles.summaryStatLabel}>Haftalık Tempo</Text>
              <Text style={[styles.summaryStatValue, { color: theme.primary }]}>
                {dietaryGoal === 'maintenance' ? 'Sabit' : `${weeklyPaceKg} kg / hf`}
              </Text>
            </View>
            <View style={styles.summaryStatBox}>
              <Text style={styles.summaryStatLabel}>Tahmini Süre</Text>
              <Text style={styles.summaryStatValue}>
                {calculatedMetrics.estimatedDurationText}
              </Text>
            </View>
          </View>
        </View>

        {/* Clinical BMR & Schedule Details Card */}
        <View style={styles.summaryInfoCard}>
          <Text style={styles.summaryCardTitle}>🧬 Klinik BMR & Öğün Planınız</Text>
          <View style={styles.summaryDetailRow}>
            <Text style={styles.summaryDetailLabel}>Klinik Formül</Text>
            <Text style={[styles.summaryDetailVal, { color: theme.primary }]}>
              {calculatedMetrics.bmrFormulaLabel}
            </Text>
          </View>
          <View style={styles.summaryDetailRow}>
            <Text style={styles.summaryDetailLabel}>BMR / TDEE</Text>
            <Text style={styles.summaryDetailVal}>
              {calculatedMetrics.bmr} kcal / {calculatedMetrics.tdee} kcal
            </Text>
          </View>
          <View style={styles.summaryDetailRow}>
            <Text style={styles.summaryDetailLabel}>VKİ & İdeal Kilo</Text>
            <Text style={styles.summaryDetailVal}>
              {calculatedMetrics.bmi} kg/m² (İdeal: {calculatedMetrics.idealWeightKg} kg)
            </Text>
          </View>
          <View style={styles.summaryDetailRow}>
            <Text style={styles.summaryDetailLabel}>Öğün Düzeni</Text>
            <Text style={styles.summaryDetailVal}>
              Günde {dailyMealsCount} Öğün ({firstMealTime} – {lastMealTime})
            </Text>
          </View>
          <View style={[styles.summaryDetailRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.summaryDetailLabel}>Hafta Sonu Esnekliği</Text>
            <Text style={styles.summaryDetailVal}>
              {weekendFlexibility ? '✅ Cumartesi & Pazar Aktif' : 'Standart Sabit Plan'}
            </Text>
          </View>
        </View>

        {/* Primary CTA: Hadi Başlayalım! */}
        <TouchableOpacity
          style={styles.summaryStartButton}
          onPress={handleFinalizeAndStart}
          activeOpacity={0.85}
        >
          <Text style={styles.summaryStartButtonText}>
            {isEditing ? 'Hedeflerimi Güncelle ve Kaydet ✓' : 'Hadi Başlayalım! 🚀'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.summaryReEditBtn}
          onPress={() => {
            setStep(0);
            setStage('wizard');
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.summaryReEditText}>← Yanıtlarımı Tekrar Gözden Geçir</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ============================================================================
  // STAGE 2: 6-STEP ONBOARDING WIZARD (Top Progress Bar + Back Arrow)
  // ============================================================================
  const progressPercent = ((step + 1) / TOTAL_WIZARD_STEPS) * 100;

  return (
    <KeyboardAvoidingView
      style={styles.wizardWrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* 3 Thematic Phase Chapters (Phase 1: Fiziksel, Phase 2: Aktivite & Hedef, Phase 3: Sağlık) */}
      <View style={styles.phaseHeaderRow}>
        {ONBOARDING_PHASES.map((p) => {
          const isCurrent = p.id === currentPhase.id;
          const isCompleted = step > Math.max(...p.steps);
          return (
            <View
              key={p.id}
              style={[
                styles.phasePill,
                isCurrent && styles.phasePillActive,
                isCompleted && styles.phasePillCompleted,
              ]}
            >
              <Text style={styles.phasePillEmoji}>{isCompleted ? '✓' : p.emoji}</Text>
              <Text
                style={[
                  styles.phasePillText,
                  isCurrent && styles.phasePillTextActive,
                  isCompleted && styles.phasePillTextCompleted,
                ]}
                numberOfLines={1}
              >
                {p.title}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Top Navigation & Segmented Progress Bar */}
      <View style={styles.wizardTopBar}>
        <TouchableOpacity
          style={styles.wizardBackBtn}
          onPress={handleBackStep}
          activeOpacity={0.7}
        >
          <Text style={styles.wizardBackArrow}>←</Text>
        </TouchableOpacity>

        {/* 3-Segment Segmented Progress Track */}
        <View style={styles.segmentedProgressRow}>
          {ONBOARDING_PHASES.map((p) => {
            const phaseStepMin = Math.min(...p.steps);
            const phaseStepMax = Math.max(...p.steps);
            let fillPercent = 0;
            if (step > phaseStepMax) {
              fillPercent = 100;
            } else if (step >= phaseStepMin) {
              const relativeStep = step - phaseStepMin + 1;
              const totalInPhase = phaseStepMax - phaseStepMin + 1;
              fillPercent = (relativeStep / totalInPhase) * 100;
            }

            return (
              <View key={`prog-${p.id}`} style={styles.segmentTrack}>
                <View
                  style={[
                    styles.segmentFill,
                    {
                      width: `${fillPercent}%`,
                      backgroundColor:
                        fillPercent === 100
                          ? theme.primary
                          : isDarkMode
                          ? '#60A5FA'
                          : '#0F172A',
                    },
                  ]}
                />
              </View>
            );
          })}
        </View>

        <Text style={styles.wizardStepCounter}>
          Faz {currentPhase.id}/3 • {step + 1}/{TOTAL_WIZARD_STEPS}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.wizardScrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={!isDraggingRuler}
      >
        {/* ------------------------------------------------------------------ */}
        {/* STEP 1: CİNSİYET VE İSİM SEÇİMİ                                    */}
        {/* ------------------------------------------------------------------ */}
        {step === 0 && (
          <View style={styles.stepSection}>
            <Text style={styles.stepQuestionTitle}>Cinsiyetinizi seçin</Text>
            <Text style={styles.stepQuestionSubtitle}>
              Bu bilgiyi bazal metabolizma (BMR) ve günlük kalori ihtiyacınızı daha doğru tahmin etmek için kullanıyoruz.
            </Text>

            <TouchableOpacity
              style={[
                styles.choiceOptionCard,
                gender === 'male' && styles.choiceOptionCardSelected,
              ]}
              onPress={() => setGender('male')}
              activeOpacity={0.8}
            >
              <View style={styles.choiceLeftRow}>
                <Text style={styles.choiceEmoji}>♂️</Text>
                <View>
                  <Text
                    style={[
                      styles.choiceTitle,
                      gender === 'male' && styles.choiceTitleSelected,
                    ]}
                  >
                    Erkek
                  </Text>
                  <Text
                    style={[
                      styles.choiceSub,
                      gender === 'male' && styles.choiceSubSelected,
                    ]}
                  >
                    Erkek metabolik katsayısı (Harris-Benedict / Mifflin)
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.radioCircle,
                  gender === 'male' && styles.radioCircleSelected,
                ]}
              >
                {gender === 'male' && <View style={styles.radioInnerDot} />}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.choiceOptionCard,
                gender === 'female' && styles.choiceOptionCardSelected,
              ]}
              onPress={() => setGender('female')}
              activeOpacity={0.8}
            >
              <View style={styles.choiceLeftRow}>
                <Text style={styles.choiceEmoji}>♀️</Text>
                <View>
                  <Text
                    style={[
                      styles.choiceTitle,
                      gender === 'female' && styles.choiceTitleSelected,
                    ]}
                  >
                    Kadın
                  </Text>
                  <Text
                    style={[
                      styles.choiceSub,
                      gender === 'female' && styles.choiceSubSelected,
                    ]}
                  >
                    Kadın metabolik katsayısı (Harris-Benedict / Mifflin)
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.radioCircle,
                  gender === 'female' && styles.radioCircleSelected,
                ]}
              >
                {gender === 'female' && <View style={styles.radioInnerDot} />}
              </View>
            </TouchableOpacity>

            {/* Name Input Card */}
            <View style={[styles.card, { marginTop: Spacing.lg }]}>
              <Text style={styles.fieldLabel}>Size nasıl hitap edelim? (Ad Soyad)</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Örn: Bertan Beyal"
                placeholderTextColor={Colors.textPlaceholder}
              />
            </View>
          </View>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* STEP 2: YAŞ, BOY VE MEVCUT KİLO (CETVEL & SEÇİCİ)                  */}
        {/* ------------------------------------------------------------------ */}
        {step === 1 && (
          <View style={styles.stepSection}>
            <Text style={styles.stepQuestionTitle}>Fiziksel ölçüleriniz nedir?</Text>
            <Text style={styles.stepQuestionSubtitle}>
              Günlük beslenme hedeflerinizi ve klinik BMR formülünüzü hesaplarken bu değerler dikkate alınacaktır.
            </Text>

            {/* Age & Birth Year Selector */}
            <View style={styles.rulerCard}>
              <View style={styles.rulerHeaderRow}>
                <Text style={styles.rulerTitle}>🎂 Doğum Yılınız & Yaşınız</Text>
                <Text style={styles.rulerMetaBadge}>
                  Doğum Yılı: {2026 - calculatedMetrics.numAge}
                </Text>
              </View>
              <View style={styles.stepperControlRow}>
                <TouchableOpacity
                  style={styles.stepperCircleBtn}
                  onPress={() => adjustNumericValue(age, setAge, -1, 12, 95)}
                >
                  <Text style={styles.stepperBtnText}>−</Text>
                </TouchableOpacity>
                <View style={styles.stepperValueBox}>
                  <TextInput
                    style={styles.stepperBigInput}
                    value={age}
                    onChangeText={setAge}
                    keyboardType="numeric"
                    maxLength={3}
                  />
                  <Text style={styles.stepperUnitLabel}>yaş</Text>
                </View>
                <TouchableOpacity
                  style={styles.stepperCircleBtn}
                  onPress={() => adjustNumericValue(age, setAge, 1, 12, 95)}
                >
                  <Text style={styles.stepperBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Height Selector with Interactive Touch & Drag Ruler */}
            <View style={styles.rulerCard}>
              <View style={styles.rulerHeaderRow}>
                <Text style={styles.rulerTitle}>📏 Boyunuz kaç?</Text>
                <Text style={styles.rulerMetaBadge}>Metrik (cm)</Text>
              </View>
              <View style={styles.stepperControlRow}>
                <TouchableOpacity
                  style={styles.stepperCircleBtn}
                  onPress={() => adjustNumericValue(heightCm, setHeightCm, -1, 130, 225)}
                >
                  <Text style={styles.stepperBtnText}>−</Text>
                </TouchableOpacity>
                <View style={styles.stepperValueBox}>
                  <TextInput
                    style={styles.stepperBigInput}
                    value={heightCm}
                    onChangeText={setHeightCm}
                    keyboardType="numeric"
                    maxLength={3}
                  />
                  <Text style={styles.stepperUnitLabel}>cm</Text>
                </View>
                <TouchableOpacity
                  style={styles.stepperCircleBtn}
                  onPress={() => adjustNumericValue(heightCm, setHeightCm, 1, 130, 225)}
                >
                  <Text style={styles.stepperBtnText}>+</Text>
                </TouchableOpacity>
              </View>
              <DraggableRuler
                value={calculatedMetrics.numHeight}
                min={130}
                max={225}
                step={1}
                unit="cm"
                theme={theme}
                onChange={setHeightCm}
                onDragStateChange={setIsDraggingRuler}
              />
            </View>

            {/* Current Weight Selector with Interactive Touch & Drag Ruler */}
            <View style={styles.rulerCard}>
              <View style={styles.rulerHeaderRow}>
                <Text style={styles.rulerTitle}>⚖️ Mevcut kilonuz kaç?</Text>
                <Text style={[styles.rulerMetaBadge, { color: theme.primary }]}>
                  VKİ: {calculatedMetrics.bmi} kg/m²
                </Text>
              </View>
              <View style={styles.stepperControlRow}>
                <TouchableOpacity
                  style={styles.stepperCircleBtn}
                  onPress={() =>
                    adjustNumericValue(weightKg, setWeightKg, -0.1, 35, 220, true)
                  }
                >
                  <Text style={styles.stepperBtnText}>−0.1</Text>
                </TouchableOpacity>
                <View style={styles.stepperValueBox}>
                  <TextInput
                    style={styles.stepperBigInput}
                    value={weightKg}
                    onChangeText={setWeightKg}
                    keyboardType="decimal-pad"
                    maxLength={5}
                  />
                  <Text style={styles.stepperUnitLabel}>kg</Text>
                </View>
                <TouchableOpacity
                  style={styles.stepperCircleBtn}
                  onPress={() =>
                    adjustNumericValue(weightKg, setWeightKg, 0.1, 35, 220, true)
                  }
                >
                  <Text style={styles.stepperBtnText}>+0.1</Text>
                </TouchableOpacity>
              </View>
              <DraggableRuler
                value={calculatedMetrics.numWeight}
                min={35}
                max={220}
                step={0.1}
                unit="kg"
                theme={theme}
                onChange={setWeightKg}
                onDragStateChange={setIsDraggingRuler}
              />
            </View>
          </View>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* STEP 3: AKTİVİTE VE SPOR DURUMU (Calz Tarzı)                       */}
        {/* ------------------------------------------------------------------ */}
        {step === 2 && (
          <View style={styles.stepSection}>
            <Text style={styles.stepQuestionTitle}>Gününüz genelde ne kadar aktif?</Text>
            <Text style={styles.stepQuestionSubtitle}>
              Bu, vücudunuzun günlük yaktığı toplam kaloriyi (TDEE) tahmin etmemize yardımcı olur.
            </Text>

            {[
              {
                key: 'sedentary',
                emoji: '🛋️',
                title: 'Çoğunlukla oturarak',
                sub: 'Masa başı çalışma, düzenli egzersiz yok (PAL x1.20)',
                sports: false,
                days: 0,
              },
              {
                key: 'light',
                emoji: '👟',
                title: 'Hafif hareket',
                sub: 'Ayakta durma, yürüyüş veya haftada 1–2 gün spor (PAL x1.375)',
                sports: true,
                days: 2,
              },
              {
                key: 'moderate',
                emoji: '⚽',
                title: 'Aktif',
                sub: 'Düzenli hareket veya haftada 3–4 gün antrenman (PAL x1.55)',
                sports: true,
                days: 3,
              },
              {
                key: 'active',
                emoji: '🚴',
                title: 'Çok aktif',
                sub: 'Fiziksel iş veya haftada 5–7 gün yoğun antrenman (PAL x1.725+)',
                sports: true,
                days: 6,
              },
            ].map((item) => {
              const isSelected =
                (!doesSports && item.key === 'sedentary') ||
                (doesSports &&
                  ((item.key === 'light' && sportsDaysPerWeek <= 2) ||
                    (item.key === 'moderate' &&
                      sportsDaysPerWeek >= 3 &&
                      sportsDaysPerWeek <= 4) ||
                    (item.key === 'active' && sportsDaysPerWeek >= 5)));

              return (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.choiceOptionCard,
                    isSelected && styles.choiceOptionCardSelected,
                  ]}
                  onPress={() => {
                    setDoesSports(item.sports);
                    setSportsDaysPerWeek(item.days);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.choiceLeftRow}>
                    <Text style={styles.choiceEmoji}>{item.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.choiceTitle,
                          isSelected && styles.choiceTitleSelected,
                        ]}
                      >
                        {item.title}
                      </Text>
                      <Text
                        style={[
                          styles.choiceSub,
                          isSelected && styles.choiceSubSelected,
                        ]}
                      >
                        {item.sub}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.radioCircle,
                      isSelected && styles.radioCircleSelected,
                    ]}
                  >
                    {isSelected && <View style={styles.radioInnerDot} />}
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Fine-Tune Weekly Sports Days */}
            {doesSports && (
              <View style={[styles.card, { marginTop: Spacing.md }]}>
                <Text style={styles.fieldLabel}>
                  Haftada tam olarak kaç gün antrenman yapıyorsunuz?
                </Text>
                <View style={styles.daysRow}>
                  {[1, 2, 3, 4, 5, 6, 7].map((d) => {
                    const active = sportsDaysPerWeek === d;
                    return (
                      <TouchableOpacity
                        key={d}
                        style={[styles.dayChip, active && styles.dayChipActive]}
                        onPress={() => setSportsDaysPerWeek(d)}
                      >
                        <Text
                          style={[
                            styles.dayChipText,
                            active && styles.dayChipTextActive,
                          ]}
                        >
                          {d}
                        </Text>
                        <Text
                          style={[
                            styles.dayChipSub,
                            active && styles.dayChipSubActive,
                          ]}
                        >
                          gün
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* STEP 4: ANA HEDEF, HEDEF KİLO VE HAFTALIK HIZ SLIDER'I (Cal AI)     */}
        {/* ------------------------------------------------------------------ */}
        {step === 3 && (
          <View style={styles.stepSection}>
            <Text style={styles.stepQuestionTitle}>Ana hedefiniz nedir?</Text>
            <Text style={styles.stepQuestionSubtitle}>
              Kalori alımınız ve makro besin dağılımınız bu hedefe göre oluşturulur.
            </Text>

            {[
              {
                goal: 'weight_loss' as const,
                icon: '↓',
                title: 'Kilo Vermek',
                sub: 'Sağlıklı kalori açığı ile yağ yakımı',
              },
              {
                goal: 'maintenance' as const,
                icon: '—',
                title: 'Kilomu Korumak',
                sub: 'Metabolik denge ve form koruma',
              },
              {
                goal: 'muscle_gain' as const,
                icon: '↑',
                title: 'Kilo / Kas Almak',
                sub: 'Yüksek protein destekli temiz hacim kazanımı',
              },
            ].map((g) => {
              const selected = dietaryGoal === g.goal;
              return (
                <TouchableOpacity
                  key={g.goal}
                  style={[
                    styles.choiceOptionCard,
                    selected && styles.choiceOptionCardSelected,
                  ]}
                  onPress={() => handleSelectGoal(g.goal)}
                  activeOpacity={0.8}
                >
                  <View style={styles.choiceLeftRow}>
                    <Text
                      style={[
                        styles.choiceEmoji,
                        selected && { color: Colors.textInverse },
                      ]}
                    >
                      {g.icon}
                    </Text>
                    <View>
                      <Text
                        style={[
                          styles.choiceTitle,
                          selected && styles.choiceTitleSelected,
                        ]}
                      >
                        {g.title}
                      </Text>
                      <Text
                        style={[
                          styles.choiceSub,
                          selected && styles.choiceSubSelected,
                        ]}
                      >
                        {g.sub}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.radioCircle,
                      selected && styles.radioCircleSelected,
                    ]}
                  >
                    {selected && <View style={styles.radioInnerDot} />}
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Target Weight & Realistic Goal Banner (Calz style) */}
            <View style={styles.rulerCard}>
              <View style={styles.rulerHeaderRow}>
                <Text style={styles.rulerTitle}>🎯 Hedef kilonuz kaç?</Text>
                <Text style={styles.rulerMetaBadge}>
                  İdeal: {calculatedMetrics.idealWeightKg} kg
                </Text>
              </View>
              <View style={styles.stepperControlRow}>
                <TouchableOpacity
                  style={styles.stepperCircleBtn}
                  onPress={() =>
                    adjustNumericValue(
                      targetWeightKg,
                      setTargetWeightKg,
                      -0.1,
                      35,
                      220,
                      true
                    )
                  }
                >
                  <Text style={styles.stepperBtnText}>−0.1</Text>
                </TouchableOpacity>
                <View style={styles.stepperValueBox}>
                  <TextInput
                    style={styles.stepperBigInput}
                    value={targetWeightKg}
                    onChangeText={setTargetWeightKg}
                    keyboardType="decimal-pad"
                    maxLength={5}
                  />
                  <Text style={styles.stepperUnitLabel}>kg</Text>
                </View>
                <TouchableOpacity
                  style={styles.stepperCircleBtn}
                  onPress={() =>
                    adjustNumericValue(
                      targetWeightKg,
                      setTargetWeightKg,
                      0.1,
                      35,
                      220,
                      true
                    )
                  }
                >
                  <Text style={styles.stepperBtnText}>+0.1</Text>
                </TouchableOpacity>
              </View>

              {/* Interactive Touch & Drag Horizontal Ruler for Target Weight */}
              <DraggableRuler
                value={parseFloat(targetWeightKg) || 65}
                min={35}
                max={220}
                step={0.1}
                unit="kg"
                theme={theme}
                onChange={setTargetWeightKg}
                onDragStateChange={setIsDraggingRuler}
              />

              {calculatedMetrics.weightDelta > 0 && (
                <View style={styles.realisticGoalBanner}>
                  <Text style={styles.realisticGoalText}>
                    ✨{' '}
                    <Text style={{ color: theme.primary, fontWeight: '800' }}>
                      {calculatedMetrics.weightDelta} kg{' '}
                      {dietaryGoal === 'weight_loss' ? 'vermek' : 'almak'}
                    </Text>{' '}
                    gerçekçi bir hedef — düşündüğünüzden de kolay!
                  </Text>
                </View>
              )}
            </View>

            {/* Cal AI Weekly Pace Slider (Sloth 🦥 / Rabbit 🐇 / Cheetah 🐆) */}
            {dietaryGoal !== 'maintenance' && (
              <View style={styles.rulerCard}>
                <Text style={styles.rulerTitle}>
                  Hedefinize ne kadar hızlı ulaşmak istiyorsunuz?
                </Text>
                <Text style={styles.paceBigNumber}>
                  Haftalık {weeklyPaceKg} kg{' '}
                  {dietaryGoal === 'weight_loss' ? 'kilo kaybı' : 'kazanım'}
                </Text>

                <View style={styles.paceAnimalsRow}>
                  {PACE_OPTIONS.map((p) => {
                    const active = weeklyPaceKg === p.value;
                    return (
                      <TouchableOpacity
                        key={p.value}
                        style={[styles.paceAnimalCard, active && styles.paceAnimalCardActive]}
                        onPress={() => setWeeklyPaceKg(p.value)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.paceAnimalEmoji}>{p.animal}</Text>
                        <Text
                          style={[
                            styles.paceAnimalLabel,
                            active && styles.paceAnimalLabelActive,
                          ]}
                        >
                          {p.label}
                        </Text>
                        <Text style={styles.paceAnimalRate}>{p.value} kg/hf</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Visual Slider Track */}
                <View style={styles.paceSliderTrack}>
                  <View
                    style={[
                      styles.paceSliderFill,
                      {
                        width:
                          weeklyPaceKg <= 0.2
                            ? '20%'
                            : weeklyPaceKg <= 0.5
                            ? '55%'
                            : '100%',
                      },
                    ]}
                  />
                </View>

                {/* Dynamic Time & Calorie Box (Cal AI style) */}
                <View style={styles.paceEstimateBox}>
                  <Text style={styles.paceEstimateTitle}>
                    Hedefinize yaklaşık{' '}
                    <Text style={{ color: theme.primary, fontWeight: '800' }}>
                      {calculatedMetrics.estimatedDurationText}
                    </Text>{' '}
                    içinde ulaşmalısınız
                  </Text>
                  <Text style={styles.paceEstimateSub}>
                    Günlük kalori hedefiniz:{' '}
                    <Text style={{ fontWeight: '700', color: theme.textPrimary }}>
                      {calculatedMetrics.targetCalories} kcal
                    </Text>
                  </Text>
                </View>
              </View>
            )}

            {/* Clinical Calculation Basis Selector */}
            <View style={styles.rulerCard}>
              <Text style={styles.fieldLabel}>Klinik Kalori Hesaplama Bazı</Text>
              <View style={styles.basisRow}>
                <TouchableOpacity
                  style={[
                    styles.basisChip,
                    calculationBasis === 'current' && styles.basisChipActive,
                  ]}
                  onPress={() => setCalculationBasis('current')}
                >
                  <Text
                    style={[
                      styles.basisChipTitle,
                      calculationBasis === 'current' && styles.basisChipTitleActive,
                    ]}
                  >
                    Mevcut Kilo Bazlı
                  </Text>
                  <Text style={styles.basisChipSub}>
                    {calculatedMetrics.numWeight} kg TDEE ({calculatedMetrics.tdee} kcal)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.basisChip,
                    calculationBasis === 'ideal' && styles.basisChipActive,
                  ]}
                  onPress={() => setCalculationBasis('ideal')}
                >
                  <Text
                    style={[
                      styles.basisChipTitle,
                      calculationBasis === 'ideal' && styles.basisChipTitleActive,
                    ]}
                  >
                    İdeal Kilo Bazlı
                  </Text>
                  <Text style={styles.basisChipSub}>
                    {calculatedMetrics.idealWeightKg} kg TDEE ({calculatedMetrics.idealTdee}{' '}
                    kcal)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* STEP 5: KLİNİK SAĞLIK DURUMLARI, DİYET TÜRÜ VE ALERJİLER (Calz)    */}
        {/* ------------------------------------------------------------------ */}
        {step === 4 && (
          <View style={styles.stepSection}>
            <Text style={styles.stepQuestionTitle}>
              Sağlık durumunuz ve beslenme tarzınız
            </Text>
            <Text style={styles.stepQuestionSubtitle}>
              Beslenme planınızı ve yapay zekâ güvenlik sınırlarını buna göre kişiselleştireceğiz.
            </Text>

            {/* Clinical Conditions */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>
                🩺 Aşağıdakilerden herhangi biri sizde var mı?
              </Text>
              <View style={styles.healthConditionsGrid}>
                <TouchableOpacity
                  style={[styles.healthChip, hasDiabetes && styles.healthChipActive]}
                  onPress={() => setHasDiabetes(!hasDiabetes)}
                >
                  <Text style={styles.healthChipIcon}>🩸</Text>
                  <Text
                    style={[
                      styles.healthChipText,
                      hasDiabetes && styles.healthChipTextActive,
                    ]}
                  >
                    Tip 1 / 2 Diyabet
                  </Text>
                  {hasDiabetes && <Text style={styles.healthChipCheck}>✓</Text>}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.healthChip,
                    hasCholesterol && styles.healthChipActive,
                  ]}
                  onPress={() => setHasCholesterol(!hasCholesterol)}
                >
                  <Text style={styles.healthChipIcon}>🫀</Text>
                  <Text
                    style={[
                      styles.healthChipText,
                      hasCholesterol && styles.healthChipTextActive,
                    ]}
                  >
                    Yüksek Kolesterol
                  </Text>
                  {hasCholesterol && <Text style={styles.healthChipCheck}>✓</Text>}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.healthChip,
                    hasHypertension && styles.healthChipActive,
                  ]}
                  onPress={() => setHasHypertension(!hasHypertension)}
                >
                  <Text style={styles.healthChipIcon}>💓</Text>
                  <Text
                    style={[
                      styles.healthChipText,
                      hasHypertension && styles.healthChipTextActive,
                    ]}
                  >
                    Yüksek Tansiyon
                  </Text>
                  {hasHypertension && <Text style={styles.healthChipCheck}>✓</Text>}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.healthChip,
                    !hasDiabetes &&
                      !hasCholesterol &&
                      !hasHypertension &&
                      styles.healthChipActive,
                  ]}
                  onPress={() => {
                    setHasDiabetes(false);
                    setHasCholesterol(false);
                    setHasHypertension(false);
                  }}
                >
                  <Text style={styles.healthChipIcon}>✅</Text>
                  <Text
                    style={[
                      styles.healthChipText,
                      !hasDiabetes &&
                        !hasCholesterol &&
                        !hasHypertension &&
                        styles.healthChipTextActive,
                    ]}
                  >
                    Yukarıdakilerin hiçbiri
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Diet Type Selection (Calz style) */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>🥗 Diyet türünüz nedir?</Text>
              <Text style={styles.fieldSubtitle}>
                Bu bilgi, makro besin oranlarınızı ayarlamak için kullanılacak.
              </Text>
              {DIET_TYPES.map((dt) => {
                const active = dietType === dt.id;
                return (
                  <TouchableOpacity
                    key={dt.id}
                    style={[
                      styles.compactChoiceRow,
                      active && styles.compactChoiceRowActive,
                    ]}
                    onPress={() => setDietType(dt.id)}
                  >
                    <Text style={styles.compactChoiceEmoji}>{dt.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.compactChoiceTitle,
                          active && styles.compactChoiceTitleActive,
                        ]}
                      >
                        {dt.title}
                      </Text>
                      <Text style={styles.compactChoiceSub}>{dt.subtitle}</Text>
                    </View>
                    {active && <Text style={styles.compactChoiceCheck}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Allergies & Intolerances */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>
                🌿 Alerjiniz veya intoleransınız var mı?
              </Text>
              <Text style={styles.fieldSubtitle}>Uyanların hepsini seçin</Text>

              <View style={styles.allergiesGrid}>
                <TouchableOpacity
                  style={[
                    styles.allergyItemChip,
                    selectedAllergies.length === 0 && styles.allergyItemChipActive,
                  ]}
                  onPress={() => setSelectedAllergies([])}
                >
                  <Text style={styles.allergyItemEmoji}>✨</Text>
                  <Text
                    style={[
                      styles.allergyItemLabel,
                      selectedAllergies.length === 0 &&
                        styles.allergyItemLabelActive,
                    ]}
                  >
                    Yok (Her Şeyi Yerim)
                  </Text>
                </TouchableOpacity>

                {ALLERGY_OPTIONS.map((item) => {
                  const isSelected = selectedAllergies.includes(item.id);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.allergyItemChip,
                        isSelected && styles.allergyItemChipActive,
                      ]}
                      onPress={() => toggleAllergy(item.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.allergyItemEmoji}>{item.emoji}</Text>
                      <Text
                        style={[
                          styles.allergyItemLabel,
                          isSelected && styles.allergyItemLabelActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                      {isSelected && <Text style={styles.checkMark}> ✓</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* STEP 6: ÖĞÜN SAYISI, SAATLERİ, ALIŞKANLIKLAR & HAFTA SONU ESNEKLİĞİ */}
        {/* ------------------------------------------------------------------ */}
        {step === 5 && (
          <View style={styles.stepSection}>
            <Text style={styles.stepQuestionTitle}>
              Öğün saatleriniz ve alışkanlıklarınız
            </Text>
            <Text style={styles.stepQuestionSubtitle}>
              Öğünlerinizi doğru zamanlamak sindirimi iyileştirir ve gece açlık krizlerini önler.
            </Text>

            {/* Daily Meal Count (Calz Clock Screen style) */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>🍽️ Günde kaç öğün yersiniz?</Text>
              <View style={styles.mealsCountRow}>
                {[2, 3, 4, 5].map((cnt) => {
                  const active = dailyMealsCount === cnt;
                  return (
                    <TouchableOpacity
                      key={cnt}
                      style={[
                        styles.mealCountCard,
                        active && styles.mealCountCardActive,
                      ]}
                      onPress={() => setDailyMealsCount(cnt)}
                    >
                      <Text
                        style={[
                          styles.mealCountNumber,
                          active && styles.mealCountNumberActive,
                        ]}
                      >
                        {cnt}
                      </Text>
                      <Text
                        style={[
                          styles.mealCountLabel,
                          active && styles.mealCountLabelActive,
                        ]}
                      >
                        Öğün
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* First & Last Meal Time (Calz style) */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>
                ⏰ Günün ilk ve son öğününü ne zaman yersiniz?
              </Text>

              <Text style={[styles.fieldLabel, { marginTop: Spacing.sm }]}>
                🌅 İlk Öğün (Kahvaltı)
              </Text>
              <View style={styles.presetPillsRow}>
                {FIRST_MEAL_TIMES.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.presetPill,
                      firstMealTime === t && styles.presetPillActive,
                    ]}
                    onPress={() => setFirstMealTime(t)}
                  >
                    <Text
                      style={[
                        styles.presetPillText,
                        firstMealTime === t && styles.presetPillTextActive,
                      ]}
                    >
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { marginTop: Spacing.md }]}>
                🌙 Son Öğün (Akşam Yemeği)
              </Text>
              <View style={styles.presetPillsRow}>
                {LAST_MEAL_TIMES.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.presetPill,
                      lastMealTime === t && styles.presetPillActive,
                    ]}
                    onPress={() => setLastMealTime(t)}
                  >
                    <Text
                      style={[
                        styles.presetPillText,
                        lastMealTime === t && styles.presetPillTextActive,
                      ]}
                    >
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Habits / Obstacles to Improve */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>
                🎯 Hangi alışkanlıklarınızı geliştirmek istersiniz?
              </Text>
              {OBSTACLE_OPTIONS.map((obs) => {
                const active = mainObstacles.includes(obs.id);
                return (
                  <TouchableOpacity
                    key={obs.id}
                    style={[
                      styles.compactChoiceRow,
                      active && styles.compactChoiceRowActive,
                    ]}
                    onPress={() => toggleObstacle(obs.id)}
                  >
                    <Text style={styles.compactChoiceEmoji}>{obs.emoji}</Text>
                    <Text
                      style={[
                        styles.compactChoiceTitle,
                        { flex: 1 },
                        active && styles.compactChoiceTitleActive,
                      ]}
                    >
                      {obs.label}
                    </Text>
                    {active && <Text style={styles.compactChoiceCheck}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Weekend Flexibility (Calz style) */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>
                🍕 Hafta sonları biraz daha fazla yemek ister misiniz?
              </Text>
              <Text style={styles.fieldSubtitle}>
                Bazen hafta sonu esnek bir öğün hedeflerinize bağlı kalmayı kolaylaştırır.
              </Text>
              <View style={styles.basisRow}>
                <TouchableOpacity
                  style={[
                    styles.basisChip,
                    weekendFlexibility && styles.basisChipActive,
                  ]}
                  onPress={() => setWeekendFlexibility(true)}
                >
                  <Text
                    style={[
                      styles.basisChipTitle,
                      weekendFlexibility && styles.basisChipTitleActive,
                    ]}
                  >
                    😋 Evet, Cumartesi & Pazar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.basisChip,
                    !weekendFlexibility && styles.basisChipActive,
                  ]}
                  onPress={() => setWeekendFlexibility(false)}
                >
                  <Text
                    style={[
                      styles.basisChipTitle,
                      !weekendFlexibility && styles.basisChipTitleActive,
                    ]}
                  >
                    ❌ Hayır, tercih etmem
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Fixed Bottom Continue Button (Cal AI & Calz Black/Emerald Pill Button) */}
      <View style={styles.wizardBottomBar}>
        <TouchableOpacity
          style={styles.wizardContinueButton}
          onPress={handleNextStep}
          activeOpacity={0.85}
        >
          <Text style={styles.wizardContinueText}>
            {step === TOTAL_WIZARD_STEPS - 1
              ? 'Kişisel Sağlık Planımı Oluştur ✨'
              : step === 1
              ? 'Devam Et: Aktivite & Hedef →'
              : step === 3
              ? 'Devam Et: Sağlık & Beslenme →'
              : 'İleri →'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const createStyles = (theme: ThemeColors, isDarkMode: boolean) =>
  StyleSheet.create({
    // ========================================================================
    // WELCOME / HERO SCREEN STYLES
    // ========================================================================
    welcomeContainer: {
      flex: 1,
      backgroundColor: theme.background,
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.xl,
    },
    welcomeTopBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    brandBadge: {
      backgroundColor: theme.surface,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs + 2,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: theme.border,
    },
    brandBadgeText: {
      ...Typography.bodyBold,
      color: theme.textPrimary,
    },
    welcomeTopRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    langPill: {
      backgroundColor: theme.surface,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs + 2,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: theme.border,
    },
    langPillText: {
      ...Typography.tiny,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    themeToggleBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    mockupWrapper: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginVertical: Spacing.md,
    },
    phoneMockupFrame: {
      width: '100%',
      maxWidth: 340,
      backgroundColor: theme.surface,
      borderRadius: 32,
      padding: Spacing.md,
      borderWidth: 3,
      borderColor: isDarkMode ? '#334155' : '#1E293B',
      ...Shadows.floating,
    },
    phoneNotch: {
      width: 76,
      height: 16,
      backgroundColor: isDarkMode ? '#0F172A' : '#0F172A',
      borderRadius: 10,
      alignSelf: 'center',
      marginBottom: Spacing.sm,
    },
    mockupHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    mockupHeaderTitle: {
      ...Typography.captionBold,
      color: theme.textPrimary,
    },
    aiConfidencePill: {
      backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.2)' : Colors.primaryLight,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: BorderRadius.full,
    },
    aiConfidenceText: {
      ...Typography.tiny,
      color: theme.primary,
      fontWeight: '700',
    },
    scannedPlateBox: {
      height: 135,
      backgroundColor: isDarkMode ? '#0F172A' : '#F1F5F9',
      borderRadius: BorderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.sm,
      position: 'relative',
    },
    cornerBracket: {
      position: 'absolute',
      width: 20,
      height: 20,
      borderColor: theme.primary,
    },
    cornerTL: {
      top: 12,
      left: 12,
      borderTopWidth: 3,
      borderLeftWidth: 3,
      borderTopLeftRadius: 6,
    },
    cornerTR: {
      top: 12,
      right: 12,
      borderTopWidth: 3,
      borderRightWidth: 3,
      borderTopRightRadius: 6,
    },
    cornerBL: {
      bottom: 12,
      left: 12,
      borderBottomWidth: 3,
      borderLeftWidth: 3,
      borderBottomLeftRadius: 6,
    },
    cornerBR: {
      bottom: 12,
      right: 12,
      borderBottomWidth: 3,
      borderRightWidth: 3,
      borderBottomRightRadius: 6,
    },
    plateEmoji: {
      fontSize: 44,
    },
    floatingPinBadge: {
      marginTop: 6,
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: BorderRadius.full,
    },
    floatingPinText: {
      ...Typography.tiny,
      color: '#FFFFFF',
      fontWeight: '700',
    },
    mockupResultCard: {
      backgroundColor: theme.surfaceSubtle,
      borderRadius: BorderRadius.lg,
      padding: Spacing.sm,
      borderWidth: 1,
      borderColor: theme.border,
    },
    mockupFoodTitleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.xs,
    },
    mockupFoodName: {
      ...Typography.captionBold,
      color: theme.textPrimary,
    },
    mockupTimeText: {
      ...Typography.tiny,
      color: theme.textMuted,
    },
    portionCounterPill: {
      backgroundColor: theme.surface,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: theme.border,
    },
    portionCounterText: {
      ...Typography.tiny,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    mockupMacrosGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginVertical: Spacing.xs,
      gap: 6,
    },
    mockupMacroBox: {
      flex: 1,
      backgroundColor: theme.surface,
      paddingVertical: 6,
      paddingHorizontal: 4,
      borderRadius: BorderRadius.sm,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    },
    mockupMacroLabel: {
      ...Typography.tiny,
      fontSize: 10,
      color: theme.textMuted,
    },
    mockupMacroVal: {
      ...Typography.captionBold,
      color: theme.textPrimary,
      marginTop: 1,
    },
    mockupHealthScoreRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
      gap: 8,
    },
    mockupHealthLabel: {
      ...Typography.tiny,
      fontWeight: '700',
      color: theme.textSecondary,
    },
    mockupHealthBarTrack: {
      flex: 1,
      height: 6,
      backgroundColor: theme.border,
      borderRadius: BorderRadius.full,
      overflow: 'hidden',
    },
    mockupHealthBarFill: {
      height: '100%',
      backgroundColor: theme.primary,
      borderRadius: BorderRadius.full,
    },
    mockupHealthScoreVal: {
      ...Typography.tiny,
      fontWeight: '800',
      color: theme.primary,
    },
    welcomeFooter: {
      alignItems: 'center',
    },
    welcomeHeroTitle: {
      ...Typography.h1,
      fontSize: 26,
      color: theme.textPrimary,
      textAlign: 'center',
      lineHeight: 32,
    },
    welcomeHeroSubtitle: {
      ...Typography.caption,
      color: theme.textMuted,
      textAlign: 'center',
      marginTop: Spacing.xs,
      marginBottom: Spacing.lg,
      lineHeight: 19,
    },
    welcomePrimaryButton: {
      width: '100%',
      backgroundColor: isDarkMode ? theme.primary : '#0F172A',
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.full,
      alignItems: 'center',
      ...Shadows.card,
    },
    welcomePrimaryButtonText: {
      ...Typography.bodyBold,
      color: '#FFFFFF',
      fontSize: 16,
    },
    welcomeSkipButton: {
      marginTop: Spacing.md,
      paddingVertical: Spacing.xs,
    },
    welcomeSkipText: {
      ...Typography.caption,
      color: theme.textMuted,
    },
    welcomeSkipTextBold: {
      color: theme.textPrimary,
      fontWeight: '700',
    },

    // ========================================================================
    // WIZARD TOP BAR & STEP LAYOUT STYLES
    // ========================================================================
    wizardWrapper: {
      flex: 1,
      backgroundColor: theme.background,
    },
    phaseHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
      gap: 6,
    },
    phasePill: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 6,
      paddingHorizontal: 4,
      borderRadius: BorderRadius.full,
      backgroundColor: theme.surfaceSubtle,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 4,
    },
    phasePillActive: {
      backgroundColor: isDarkMode ? '#1E293B' : Colors.primaryLight,
      borderColor: theme.primary,
    },
    phasePillCompleted: {
      backgroundColor: isDarkMode ? '#064E3B' : '#ECFDF5',
      borderColor: isDarkMode ? '#047857' : '#A7F3D0',
    },
    phasePillEmoji: {
      fontSize: 11,
    },
    phasePillText: {
      ...Typography.tiny,
      fontSize: 10,
      color: theme.textMuted,
      fontWeight: '600',
    },
    phasePillTextActive: {
      color: isDarkMode ? theme.primary : Colors.primaryDark,
      fontWeight: '700',
    },
    phasePillTextCompleted: {
      color: isDarkMode ? '#6EE7B7' : '#047857',
      fontWeight: '700',
    },
    wizardTopBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm + 2,
      gap: Spacing.md,
    },
    segmentedProgressRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    segmentTrack: {
      flex: 1,
      height: 6,
      backgroundColor: theme.border,
      borderRadius: BorderRadius.full,
      overflow: 'hidden',
    },
    segmentFill: {
      height: '100%',
      borderRadius: BorderRadius.full,
    },
    wizardBackBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: theme.surfaceSubtle,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    wizardBackArrow: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    wizardProgressTrack: {
      flex: 1,
      height: 6,
      backgroundColor: theme.border,
      borderRadius: BorderRadius.full,
      overflow: 'hidden',
    },
    wizardProgressFill: {
      height: '100%',
      backgroundColor: isDarkMode ? theme.primary : '#0F172A',
      borderRadius: BorderRadius.full,
    },
    wizardStepCounter: {
      ...Typography.tiny,
      fontWeight: '700',
      color: theme.textMuted,
      minWidth: 40,
      textAlign: 'right',
    },
    wizardScrollContent: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.xxxl,
    },
    stepSection: {
      marginTop: Spacing.xs,
    },
    stepQuestionTitle: {
      ...Typography.h1,
      fontSize: 24,
      color: theme.textPrimary,
      marginBottom: Spacing.xs,
    },
    stepQuestionSubtitle: {
      ...Typography.body,
      color: theme.textMuted,
      lineHeight: 20,
      marginBottom: Spacing.lg,
    },
    choiceOptionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.surface,
      borderWidth: 1.5,
      borderColor: theme.border,
      borderRadius: BorderRadius.xl,
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing.lg,
      marginBottom: Spacing.md,
      ...Shadows.card,
    },
    choiceOptionCardSelected: {
      backgroundColor: isDarkMode ? theme.primary : '#0F172A',
      borderColor: isDarkMode ? theme.primary : '#0F172A',
    },
    choiceLeftRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      paddingRight: Spacing.sm,
      gap: Spacing.md,
    },
    choiceEmoji: {
      fontSize: 24,
    },
    choiceTitle: {
      ...Typography.bodyBold,
      fontSize: 16,
      color: theme.textPrimary,
    },
    choiceTitleSelected: {
      color: '#FFFFFF',
    },
    choiceSub: {
      ...Typography.tiny,
      color: theme.textMuted,
      marginTop: 2,
    },
    choiceSubSelected: {
      color: 'rgba(255, 255, 255, 0.8)',
    },
    radioCircle: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioCircleSelected: {
      borderColor: '#FFFFFF',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    radioInnerDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#FFFFFF',
    },

    // ========================================================================
    // RULER & STEPPER CARDS (Step 2 & Step 4)
    // ========================================================================
    rulerCard: {
      backgroundColor: theme.surface,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: Spacing.md,
      ...Shadows.card,
    },
    rulerHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    rulerTitle: {
      ...Typography.bodyBold,
      color: theme.textPrimary,
    },
    rulerMetaBadge: {
      ...Typography.tiny,
      fontWeight: '700',
      color: theme.textMuted,
      backgroundColor: theme.surfaceSubtle,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: BorderRadius.full,
    },
    stepperControlRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginVertical: Spacing.xs,
    },
    stepperCircleBtn: {
      minWidth: 46,
      height: 46,
      paddingHorizontal: 10,
      borderRadius: 23,
      backgroundColor: theme.surfaceSubtle,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepperBtnText: {
      ...Typography.bodyBold,
      color: theme.textPrimary,
      fontSize: 16,
    },
    stepperValueBox: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'center',
    },
    stepperBigInput: {
      ...Typography.h1,
      fontSize: 32,
      lineHeight: 40,
      color: theme.textPrimary,
      textAlign: 'center',
      minWidth: 80,
      paddingVertical: 2,
    },
    stepperUnitLabel: {
      ...Typography.bodyBold,
      color: theme.textMuted,
      marginLeft: 4,
    },
    visualRulerContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      height: 28,
      paddingHorizontal: Spacing.sm,
      marginVertical: Spacing.sm,
    },
    rulerTick: {
      width: 2,
      height: 10,
      backgroundColor: theme.border,
      borderRadius: 1,
    },
    rulerTickMajor: {
      height: 18,
      backgroundColor: theme.textMuted,
    },
    rulerTickCenter: {
      width: 3,
      height: 26,
      backgroundColor: theme.primary,
    },
    presetPillsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: Spacing.xs,
    },
    presetPill: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: BorderRadius.full,
      backgroundColor: theme.surfaceSubtle,
      borderWidth: 1,
      borderColor: theme.border,
    },
    presetPillActive: {
      backgroundColor: isDarkMode ? theme.primary : '#0F172A',
      borderColor: isDarkMode ? theme.primary : '#0F172A',
    },
    presetPillText: {
      ...Typography.tiny,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    presetPillTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    realisticGoalBanner: {
      marginTop: Spacing.sm,
      padding: Spacing.sm,
      borderRadius: BorderRadius.md,
      backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0',
    },
    realisticGoalText: {
      ...Typography.caption,
      color: theme.textPrimary,
      textAlign: 'center',
    },

    // ========================================================================
    // WEEKLY PACE SLIDER (Cal AI Sloth / Rabbit / Cheetah)
    // ========================================================================
    paceBigNumber: {
      ...Typography.h2,
      color: theme.primary,
      textAlign: 'center',
      marginVertical: Spacing.sm,
    },
    paceAnimalsRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginVertical: Spacing.xs,
    },
    paceAnimalCard: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      paddingHorizontal: 4,
      borderRadius: BorderRadius.lg,
      backgroundColor: theme.surfaceSubtle,
      borderWidth: 1.5,
      borderColor: theme.border,
    },
    paceAnimalCardActive: {
      borderColor: theme.primary,
      backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : Colors.primaryLight,
    },
    paceAnimalEmoji: {
      fontSize: 24,
      marginBottom: 2,
    },
    paceAnimalLabel: {
      ...Typography.captionBold,
      color: theme.textSecondary,
    },
    paceAnimalLabelActive: {
      color: isDarkMode ? theme.primary : Colors.primaryDark,
    },
    paceAnimalRate: {
      ...Typography.tiny,
      color: theme.textMuted,
      marginTop: 2,
    },
    paceSliderTrack: {
      height: 8,
      backgroundColor: theme.border,
      borderRadius: BorderRadius.full,
      marginVertical: Spacing.md,
      overflow: 'hidden',
    },
    paceSliderFill: {
      height: '100%',
      backgroundColor: theme.primary,
      borderRadius: BorderRadius.full,
    },
    paceEstimateBox: {
      backgroundColor: theme.surfaceSubtle,
      padding: Spacing.md,
      borderRadius: BorderRadius.lg,
      alignItems: 'center',
    },
    paceEstimateTitle: {
      ...Typography.caption,
      color: theme.textSecondary,
      textAlign: 'center',
    },
    paceEstimateSub: {
      ...Typography.tiny,
      color: theme.textMuted,
      marginTop: 4,
    },

    // ========================================================================
    // COMPACT CARDS & MEAL TIMING (Step 5 & Step 6)
    // ========================================================================
    card: {
      backgroundColor: theme.surface,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: Spacing.md,
      ...Shadows.card,
    },
    sectionTitle: {
      ...Typography.h3,
      color: theme.textPrimary,
      marginBottom: Spacing.xs,
    },
    fieldSubtitle: {
      ...Typography.caption,
      color: theme.textMuted,
      marginBottom: Spacing.sm,
      lineHeight: 18,
    },
    fieldLabel: {
      ...Typography.captionBold,
      color: theme.textSecondary,
      marginBottom: Spacing.xs,
    },
    input: {
      backgroundColor: theme.surfaceSubtle,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: BorderRadius.lg,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      ...Typography.body,
      color: theme.textPrimary,
    },
    compactChoiceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.md,
      borderRadius: BorderRadius.lg,
      backgroundColor: theme.surfaceSubtle,
      borderWidth: 1.5,
      borderColor: theme.border,
      marginBottom: Spacing.xs + 2,
      gap: Spacing.sm,
    },
    compactChoiceRowActive: {
      backgroundColor: isDarkMode ? '#1E293B' : Colors.primaryLight,
      borderColor: theme.primary,
    },
    compactChoiceEmoji: {
      fontSize: 20,
    },
    compactChoiceTitle: {
      ...Typography.captionBold,
      color: theme.textPrimary,
    },
    compactChoiceTitleActive: {
      color: isDarkMode ? theme.primary : Colors.primaryDark,
    },
    compactChoiceSub: {
      ...Typography.tiny,
      color: theme.textMuted,
      marginTop: 1,
    },
    compactChoiceCheck: {
      ...Typography.bodyBold,
      color: theme.primary,
    },
    mealsCountRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginTop: Spacing.xs,
    },
    mealCountCard: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.lg,
      backgroundColor: theme.surfaceSubtle,
      borderWidth: 1.5,
      borderColor: theme.border,
    },
    mealCountCardActive: {
      backgroundColor: isDarkMode ? theme.primary : '#0F172A',
      borderColor: isDarkMode ? theme.primary : '#0F172A',
    },
    mealCountNumber: {
      ...Typography.h2,
      color: theme.textPrimary,
    },
    mealCountNumberActive: {
      color: '#FFFFFF',
    },
    mealCountLabel: {
      ...Typography.tiny,
      color: theme.textMuted,
    },
    mealCountLabelActive: {
      color: 'rgba(255, 255, 255, 0.85)',
    },
    daysRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: Spacing.xs,
    },
    dayChip: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.sm,
      marginHorizontal: 3,
      backgroundColor: theme.surfaceSubtle,
      borderWidth: 1.5,
      borderColor: theme.border,
      borderRadius: BorderRadius.md,
    },
    dayChipActive: {
      borderColor: theme.primary,
      backgroundColor: isDarkMode ? '#1E3A8A' : Colors.primaryLight,
    },
    dayChipText: {
      ...Typography.bodyBold,
      color: theme.textPrimary,
    },
    dayChipTextActive: {
      color: isDarkMode ? '#93C5FD' : Colors.primaryDark,
    },
    dayChipSub: {
      ...Typography.tiny,
      fontSize: 9,
      color: theme.textMuted,
    },
    dayChipSubActive: {
      color: isDarkMode ? '#93C5FD' : Colors.primaryDark,
    },
    healthConditionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
      marginTop: Spacing.xs,
    },
    healthChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surfaceSubtle,
      borderWidth: 1.5,
      borderColor: theme.border,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.full,
    },
    healthChipActive: {
      backgroundColor: isDarkMode ? '#1E293B' : '#EFF6FF',
      borderColor: isDarkMode ? '#3B82F6' : '#2563EB',
    },
    healthChipIcon: {
      fontSize: 16,
      marginRight: 6,
    },
    healthChipText: {
      ...Typography.captionBold,
      color: theme.textSecondary,
    },
    healthChipTextActive: {
      color: isDarkMode ? '#93C5FD' : '#1E40AF',
    },
    healthChipCheck: {
      marginLeft: 6,
      color: isDarkMode ? '#93C5FD' : '#2563EB',
      fontWeight: 'bold',
    },
    basisRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginTop: Spacing.xs,
    },
    basisChip: {
      flex: 1,
      paddingVertical: Spacing.sm + 2,
      paddingHorizontal: Spacing.sm,
      backgroundColor: theme.surfaceSubtle,
      borderWidth: 1.5,
      borderColor: theme.border,
      borderRadius: BorderRadius.lg,
      alignItems: 'center',
    },
    basisChipActive: {
      borderColor: theme.primary,
      backgroundColor: isDarkMode ? '#1E293B' : Colors.primaryLight,
    },
    basisChipTitle: {
      ...Typography.captionBold,
      color: theme.textSecondary,
      textAlign: 'center',
    },
    basisChipTitleActive: {
      color: isDarkMode ? theme.primary : Colors.primaryDark,
    },
    basisChipSub: {
      ...Typography.tiny,
      color: theme.textMuted,
      fontSize: 10,
      marginTop: 2,
      textAlign: 'center',
    },
    allergiesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    allergyItemChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surfaceSubtle,
      borderWidth: 1.5,
      borderColor: theme.border,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.full,
    },
    allergyItemChipActive: {
      backgroundColor: isDarkMode ? '#78350F' : '#FEF3C7',
      borderColor: '#F59E0B',
    },
    allergyItemEmoji: {
      fontSize: 16,
      marginRight: 6,
    },
    allergyItemLabel: {
      ...Typography.captionBold,
      color: theme.textSecondary,
    },
    allergyItemLabelActive: {
      color: isDarkMode ? '#FDE68A' : '#92400E',
    },
    checkMark: {
      color: isDarkMode ? '#FCD34D' : '#D97706',
      fontWeight: 'bold',
      fontSize: 14,
    },
    wizardBottomBar: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      backgroundColor: theme.surface,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    wizardContinueButton: {
      backgroundColor: isDarkMode ? theme.primary : '#0F172A',
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.full,
      alignItems: 'center',
      ...Shadows.card,
    },
    wizardContinueText: {
      ...Typography.bodyBold,
      color: '#FFFFFF',
      fontSize: 16,
    },

    // ========================================================================
    // STAGE 3: ANIMATED BMR PREPARATION (0% -> 100%) STYLES
    // ========================================================================
    calculatingContainer: {
      flex: 1,
      backgroundColor: theme.background,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing.xl,
    },
    calcRingWrapper: {
      width: 180,
      height: 180,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.lg,
    },
    calcPercentOverlay: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 8,
    },
    calcPercentText: {
      ...Typography.h1,
      fontSize: 40,
      lineHeight: 50,
      paddingTop: 4,
      fontWeight: '800',
      color: theme.textPrimary,
      textAlign: 'center',
    },
    calcMainTitle: {
      ...Typography.h2,
      color: theme.textPrimary,
      textAlign: 'center',
    },
    calcSubStatus: {
      ...Typography.caption,
      color: theme.textMuted,
      textAlign: 'center',
      marginTop: Spacing.xs,
      marginBottom: Spacing.lg,
    },
    calcLinearBarTrack: {
      width: '100%',
      height: 8,
      backgroundColor: theme.border,
      borderRadius: BorderRadius.full,
      overflow: 'hidden',
      marginBottom: Spacing.xl,
    },
    calcLinearBarFill: {
      height: '100%',
      backgroundColor: theme.primary,
      borderRadius: BorderRadius.full,
    },
    calcChecklistCard: {
      width: '100%',
      backgroundColor: theme.surface,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: theme.border,
      ...Shadows.card,
    },
    calcChecklistHeader: {
      ...Typography.bodyBold,
      color: theme.textPrimary,
      marginBottom: Spacing.md,
    },
    calcChecklistRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Spacing.xs + 2,
    },
    calcChecklistLabel: {
      ...Typography.caption,
      color: theme.textMuted,
      flex: 1,
    },
    calcCheckCircle: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 1.5,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    calcCheckMark: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '800',
    },

    // ========================================================================
    // STAGE 4: "TEBRİKLER! KİŞİSEL SAĞLIK PLANINIZ HAZIR!" SUMMARY STYLES
    // ========================================================================
    summaryContainer: {
      padding: Spacing.lg,
      paddingBottom: Spacing.xxxl,
      backgroundColor: theme.background,
    },
    summaryHeader: {
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    summaryCelebrationBadge: {
      backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.2)' : Colors.primaryLight,
      paddingHorizontal: Spacing.md,
      paddingVertical: 4,
      borderRadius: BorderRadius.full,
      marginBottom: Spacing.xs,
    },
    summaryCelebrationText: {
      ...Typography.tiny,
      fontWeight: '800',
      color: theme.primary,
      letterSpacing: 0.8,
    },
    summaryTitle: {
      ...Typography.h1,
      fontSize: 28,
      color: theme.textPrimary,
    },
    summarySubtitle: {
      ...Typography.body,
      color: theme.textSecondary,
      marginTop: 2,
    },
    donutCard: {
      backgroundColor: theme.surface,
      borderRadius: BorderRadius.xl,
      padding: Spacing.xl,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      marginBottom: Spacing.lg,
      ...Shadows.card,
    },
    donutVisualWrapper: {
      width: 280,
      height: 240,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    donutCenterOverlay: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 8,
    },
    donutCalorieNumber: {
      ...Typography.h1,
      fontSize: 34,
      lineHeight: 42,
      paddingTop: 4,
      fontWeight: '800',
      color: theme.textPrimary,
      textAlign: 'center',
    },
    donutCalorieUnit: {
      ...Typography.captionBold,
      color: theme.textMuted,
    },
    floatingMacroBubble: {
      position: 'absolute',
      backgroundColor: theme.surface,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      zIndex: 5,
      ...Shadows.card,
    },
    bubbleTopLeft: {
      top: 8,
      left: 0,
    },
    bubbleTopRight: {
      top: 8,
      right: 0,
    },
    bubbleBottomRight: {
      bottom: 8,
      right: 0,
    },
    bubbleBottomLeft: {
      bottom: 8,
      left: 0,
    },
    floatingBubbleVal: {
      ...Typography.captionBold,
      fontWeight: '800',
    },
    floatingBubbleLabel: {
      ...Typography.tiny,
      fontSize: 10,
      color: theme.textMuted,
    },
    donutLegendRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: Spacing.md,
      marginTop: Spacing.md,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    legendDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    legendText: {
      ...Typography.tiny,
      fontWeight: '700',
      color: theme.textSecondary,
    },
    donutEditableHint: {
      ...Typography.tiny,
      color: theme.textMuted,
      marginTop: Spacing.md,
      textAlign: 'center',
    },
    summaryInfoCard: {
      backgroundColor: theme.surface,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: Spacing.md,
      ...Shadows.card,
    },
    summaryCardTitle: {
      ...Typography.bodyBold,
      color: theme.textPrimary,
      marginBottom: Spacing.sm,
    },
    summaryStatsGrid: {
      flexDirection: 'row',
      gap: Spacing.xs,
    },
    summaryStatBox: {
      flex: 1,
      backgroundColor: theme.surfaceSubtle,
      padding: Spacing.sm,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
    },
    summaryStatLabel: {
      ...Typography.tiny,
      color: theme.textMuted,
    },
    summaryStatValue: {
      ...Typography.captionBold,
      color: theme.textPrimary,
      marginTop: 2,
      textAlign: 'center',
    },
    summaryDetailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    summaryDetailLabel: {
      ...Typography.caption,
      color: theme.textMuted,
    },
    summaryDetailVal: {
      ...Typography.captionBold,
      color: theme.textPrimary,
    },
    summaryStartButton: {
      backgroundColor: isDarkMode ? theme.primary : '#0F172A',
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.full,
      alignItems: 'center',
      marginTop: Spacing.sm,
      ...Shadows.card,
    },
    summaryStartButtonText: {
      ...Typography.bodyBold,
      color: '#FFFFFF',
      fontSize: 16,
    },
    summaryReEditBtn: {
      alignItems: 'center',
      marginTop: Spacing.md,
      paddingVertical: Spacing.sm,
    },
    summaryReEditText: {
      ...Typography.captionBold,
      color: theme.textSecondary,
    },
  });
