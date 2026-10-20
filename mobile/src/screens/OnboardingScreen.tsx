import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Colors, getThemeColors, ThemeColors } from '../constants/colors';
import { Spacing, BorderRadius, Typography, Shadows } from '../constants/theme';
import { useDietStore } from '../store/useDietStore';
import { UserProfile, CalculationBasis } from '../types';
import { apiService } from '../services/api';

export const ALLERGY_OPTIONS = [
  { id: '🥜 Fıstık (Hafif)', label: 'Fıstık / Kuruyemiş', emoji: '🥜' },
  { id: '🥛 Laktoz (Düşük Tolerans)', label: 'Laktozsuz Süt', emoji: '🥛' },
  { id: '🌾 Gluten Hassasiyeti', label: 'Glutensiz', emoji: '🌾' },
  { id: '🌱 Vejetaryen', label: 'Vejetaryen', emoji: '🌱' },
  { id: '🥑 Ketojenik', label: 'Ketojenik / Düşük Karb', emoji: '🥑' },
  { id: '🦐 Deniz Ürünleri', label: 'Deniz Ürünleri', emoji: '🦐' },
  { id: '🥚 Yumurta Hassasiyeti', label: 'Yumurta Alerjisi', emoji: '🥚' },
];

interface OnboardingScreenProps {
  onComplete?: () => void;
  isEditing?: boolean;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onComplete,
  isEditing = false,
}) => {
  const { userProfile, updateProfile, isDarkMode } = useDietStore();
  const theme = getThemeColors(isDarkMode);
  const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);

  // Form State initialized with current user profile or standard defaults
  const [name, setName] = useState(userProfile.name || 'Bertan Beyal');
  const [gender, setGender] = useState<'male' | 'female'>(userProfile.gender || 'male');
  const [age, setAge] = useState(userProfile.age ? String(userProfile.age) : '22');
  const [heightCm, setHeightCm] = useState(userProfile.heightCm ? String(userProfile.heightCm) : '180');
  const [weightKg, setWeightKg] = useState(userProfile.weightKg ? String(userProfile.weightKg) : '76');
  const [targetWeightKg, setTargetWeightKg] = useState(() => {
    if (userProfile.targetWeightKg && userProfile.targetWeightKg > 0) {
      return String(userProfile.targetWeightKg);
    }
    const curW = userProfile.weightKg || 76;
    if (userProfile.dietaryGoal === 'weight_loss') return String(Math.max(40, curW - 4));
    if (userProfile.dietaryGoal === 'muscle_gain') return String(curW + 3);
    return String(curW);
  });
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>(
    userProfile.allergies && userProfile.allergies.length > 0
      ? userProfile.allergies
      : ['🥜 Fıstık (Hafif)', '🥛 Laktoz (Düşük Tolerans)']
  );

  // Clinical & Sports additions from Backend
  const [doesSports, setDoesSports] = useState<boolean>(
    userProfile.doesSports !== undefined ? userProfile.doesSports : true
  );
  const [sportsDaysPerWeek, setSportsDaysPerWeek] = useState<number>(
    userProfile.sportsDaysPerWeek || 3
  );
  const [hasDiabetes, setHasDiabetes] = useState<boolean>(
    userProfile.hasDiabetes || false
  );
  const [hasCholesterol, setHasCholesterol] = useState<boolean>(
    userProfile.hasCholesterol || false
  );
  const [hasHypertension, setHasHypertension] = useState<boolean>(
    userProfile.hasHypertension || false
  );
  const [calculationBasis, setCalculationBasis] = useState<CalculationBasis>(
    userProfile.calculationBasis || 'current'
  );

  const toggleAllergy = (id: string) => {
    setSelectedAllergies((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };
  const [activityLevel, setActivityLevel] = useState<UserProfile['activityLevel']>(
    userProfile.activityLevel || 'moderate'
  );
  const [dietaryGoal, setDietaryGoal] = useState<UserProfile['dietaryGoal']>(
    userProfile.dietaryGoal || 'weight_loss'
  );

  const handleSelectGoal = (goal: UserProfile['dietaryGoal']) => {
    setDietaryGoal(goal);
    const curW = parseFloat(weightKg) || 76;
    if (goal === 'weight_loss') {
      setTargetWeightKg(String(Math.max(40, Math.round(curW - 4))));
    } else if (goal === 'muscle_gain') {
      setTargetWeightKg(String(Math.round(curW + 3)));
    } else {
      setTargetWeightKg(String(Math.round(curW)));
    }
  };

  // Activity multipliers for reference
  const activityMultipliers: Record<UserProfile['activityLevel'], { factor: number; label: string; desc: string }> = {
    sedentary: { factor: 1.2, label: 'Hareketsiz', desc: 'Masa başı iş, minimum hareket' },
    light: { factor: 1.375, label: 'Az Hareketli', desc: 'Haftada 1-2 gün hafif egzersiz' },
    moderate: { factor: 1.55, label: 'Orta Düzey', desc: 'Haftada 3-4 gün düzenli egzersiz' },
    active: { factor: 1.725, label: 'Çok Hareketli', desc: 'Haftada 5-6 gün yoğun spor' },
    very_active: { factor: 1.9, label: 'Ekstra Aktif', desc: 'Haftada 7 gün / Günde çift antrenman' },
  };

  // Live Clinical BMR Switch & Metabolic Calculation (Harris-Benedict vs Mifflin-St Jeor)
  const calculatedMetrics = useMemo(() => {
    const numAge = Math.max(12, Math.min(100, parseInt(age, 10) || 22));
    const numHeight = Math.max(100, Math.min(250, parseFloat(heightCm) || 180));
    const numWeight = Math.max(30, Math.min(300, parseFloat(weightKg) || 75));

    const bmi = parseFloat((numWeight / ((numHeight / 100) ** 2)).toFixed(2));

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

    // 2. Activity Multiplier mapped from sports days
    let multiplier = 1.55;
    if (doesSports) {
      if (sportsDaysPerWeek === 0) multiplier = 1.2;
      else if (sportsDaysPerWeek <= 2) multiplier = 1.375;
      else if (sportsDaysPerWeek <= 4) multiplier = 1.55;
      else if (sportsDaysPerWeek <= 6) multiplier = 1.725;
      else multiplier = 1.9;
    } else {
      multiplier = 1.2;
    }

    const tdee = Math.round(bmr * multiplier);

    // 3. Age-adjusted Ideal BMI & Ideal Weight
    let idealBmi = 22;
    if (numAge <= 24) idealBmi = 21;
    else if (numAge <= 34) idealBmi = 22;
    else if (numAge <= 44) idealBmi = 23;
    else if (numAge <= 54) idealBmi = 24;
    else idealBmi = 25;

    const idealWeightKg = parseFloat((idealBmi * ((numHeight / 100) ** 2)).toFixed(1));

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

    // 4. Target Calories based on calculationBasis and dietaryGoal
    const baseTdee = calculationBasis === 'ideal' ? idealTdee : tdee;
    let targetCalories = baseTdee;
    if (dietaryGoal === 'weight_loss') {
      targetCalories = Math.max(1200, baseTdee - 400);
    } else if (dietaryGoal === 'muscle_gain') {
      targetCalories = baseTdee + 300;
    }

    // 5. Recommended Macros (30% Protein, 40% Carbs, 30% Fat)
    const targetProteinGrams = Math.round((targetCalories * 0.3) / 4);
    const targetCarbsGrams = Math.round((targetCalories * 0.4) / 4);
    const targetFatGrams = Math.round((targetCalories * 0.3) / 9);

    const waterGoalMl = Math.round((numWeight * 35) / 50) * 50;

    return {
      numAge,
      numHeight,
      numWeight,
      bmi,
      bmrFormulaUsed,
      bmrFormulaLabel,
      bmr,
      tdee,
      idealBmi,
      idealWeightKg,
      idealBmr,
      idealTdee,
      targetCalories,
      targetProteinGrams,
      targetCarbsGrams,
      targetFatGrams,
      waterGoalMl,
    };
  }, [age, heightCm, weightKg, gender, doesSports, sportsDaysPerWeek, calculationBasis, dietaryGoal]);

  const handleSave = () => {
    const numTargetWeight = Math.max(
      35,
      Math.min(250, parseFloat(targetWeightKg) || calculatedMetrics.numWeight)
    );

    updateProfile({
      name: name.trim() || 'Kullanıcı',
      gender,
      age: calculatedMetrics.numAge,
      heightCm: calculatedMetrics.numHeight,
      weightKg: calculatedMetrics.numWeight,
      targetWeightKg: numTargetWeight,
      activityLevel,
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
    });

    // Fire background API sync to FastAPI calculate-bmr endpoint
    apiService
      .calculateBMR({
        weight_kg: calculatedMetrics.numWeight,
        height_cm: calculatedMetrics.numHeight,
        age: calculatedMetrics.numAge,
        gender,
        does_sports: doesSports,
        sports_days_per_week: sportsDaysPerWeek,
        activity_level: activityLevel,
        goal: dietaryGoal,
        calculation_basis: calculationBasis,
        has_diabetes: hasDiabetes,
        has_cholesterol: hasCholesterol,
        has_hypertension: hasHypertension,
      })
      .catch((err) => console.warn('Background calculateBMR API error:', err));

    if (onComplete) {
      onComplete();
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Intro */}
        <View style={styles.header}>
          <Text style={styles.badgeText}>
            {isEditing ? 'HEDEF GÜNCELLEME' : 'KİŞİSELLEŞTİRİLMİŞ BMR PLANI'}
          </Text>
          <Text style={styles.title}>
            {isEditing ? 'Beslenme Hedeflerini Düzenle' : 'Profilini & Hedefini Belirle'}
          </Text>
          <Text style={styles.subtitle}>
            Mifflin-St Jeor formülüyle bazal metabolizmanı ve günlük kalori ihtiyacını bilimsel olarak hesaplayalım.
          </Text>
        </View>

        {/* Name & Gender */}
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Ad Soyad</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Örn: Bertan Beyal"
            placeholderTextColor={Colors.textPlaceholder}
          />

          <Text style={[styles.fieldLabel, { marginTop: Spacing.md }]}>Biyolojik Cinsiyet</Text>
          <View style={styles.genderRow}>
            <TouchableOpacity
              style={[styles.genderButton, gender === 'male' && styles.genderButtonActive]}
              onPress={() => setGender('male')}
              activeOpacity={0.8}
            >
              <Text style={styles.genderIcon}>👨</Text>
              <Text style={[styles.genderText, gender === 'male' && styles.genderTextActive]}>
                Erkek
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.genderButton, gender === 'female' && styles.genderButtonActive]}
              onPress={() => setGender('female')}
              activeOpacity={0.8}
            >
              <Text style={styles.genderIcon}>👩</Text>
              <Text style={[styles.genderText, gender === 'female' && styles.genderTextActive]}>
                Kadın
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Body Stats: Age, Height, Weight */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Fiziksel Özellikler</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Yaş</Text>
              <TextInput
                style={styles.statInput}
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                maxLength={3}
              />
              <Text style={styles.statUnit}>yıl</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Boy</Text>
              <TextInput
                style={styles.statInput}
                value={heightCm}
                onChangeText={setHeightCm}
                keyboardType="numeric"
                maxLength={3}
              />
              <Text style={styles.statUnit}>cm</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Kilo</Text>
              <TextInput
                style={styles.statInput}
                value={weightKg}
                onChangeText={setWeightKg}
                keyboardType="decimal-pad"
                maxLength={5}
              />
              <Text style={styles.statUnit}>kg</Text>
            </View>
          </View>
        </View>

        {/* Sports & Exercise Activity (Backend Sync) */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🏃‍♂️ Spor ve Egzersiz Durumu</Text>
          <Text style={styles.fieldSubtitle}>
            Haftalık antrenman sıklığınız bazal metabolizma çarpanınızı (PAL) belirler.
          </Text>

          <View style={styles.sportsToggleRow}>
            <TouchableOpacity
              style={[styles.sportsToggleButton, doesSports && styles.sportsToggleButtonActive]}
              onPress={() => setDoesSports(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.sportsToggleIcon}>🏋️</Text>
              <Text style={[styles.sportsToggleText, doesSports && styles.sportsToggleTextActive]}>
                Evet, Spor Yapıyorum
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sportsToggleButton, !doesSports && styles.sportsToggleButtonActive]}
              onPress={() => setDoesSports(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.sportsToggleIcon}>🛋️</Text>
              <Text style={[styles.sportsToggleText, !doesSports && styles.sportsToggleTextActive]}>
                Hayır, Hareketsiz
              </Text>
            </TouchableOpacity>
          </View>

          {doesSports && (
            <View style={styles.sportsDaysContainer}>
              <Text style={styles.fieldLabel}>Haftada kaç gün antrenman yapıyorsunuz?</Text>
              <View style={styles.daysRow}>
                {[1, 2, 3, 4, 5, 6, 7].map((days) => {
                  const isSelected = sportsDaysPerWeek === days;
                  return (
                    <TouchableOpacity
                      key={days}
                      style={[styles.dayChip, isSelected && styles.dayChipActive]}
                      onPress={() => setSportsDaysPerWeek(days)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.dayChipText, isSelected && styles.dayChipTextActive]}>
                        {days}
                      </Text>
                      <Text style={[styles.dayChipSub, isSelected && styles.dayChipSubActive]}>
                        gün
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.sportsDaysHint}>
                {sportsDaysPerWeek <= 2
                  ? 'Hafif Düzey (x1.375 PAL) • Temel kalori ihtiyacı'
                  : sportsDaysPerWeek <= 4
                  ? 'Orta Düzey (x1.55 PAL) • Düzenli aktif metabolizma'
                  : sportsDaysPerWeek <= 6
                  ? 'Çok Hareketli (x1.725 PAL) • Yüksek kalori yakımı'
                  : 'Ekstra Aktif (x1.9 PAL) • Profesyonel antrenman temposu'}
              </Text>
            </View>
          )}
        </View>

        {/* Clinical Health Conditions (Backend Sync) */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🩺 Klinik Sağlık Durumları</Text>
          <Text style={styles.fieldSubtitle}>
            Varsa kronik durumlarınızı belirtiniz; DietAI AI asistanı ve öneri motoru buna göre çalışır.
          </Text>

          <View style={styles.healthConditionsGrid}>
            <TouchableOpacity
              style={[styles.healthChip, hasDiabetes && styles.healthChipActive]}
              onPress={() => setHasDiabetes(!hasDiabetes)}
              activeOpacity={0.7}
            >
              <Text style={styles.healthChipIcon}>🩸</Text>
              <Text style={[styles.healthChipText, hasDiabetes && styles.healthChipTextActive]}>
                Tip 1 / 2 Diyabet
              </Text>
              {hasDiabetes && <Text style={styles.healthChipCheck}>✓</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.healthChip, hasCholesterol && styles.healthChipActive]}
              onPress={() => setHasCholesterol(!hasCholesterol)}
              activeOpacity={0.7}
            >
              <Text style={styles.healthChipIcon}>🫀</Text>
              <Text style={[styles.healthChipText, hasCholesterol && styles.healthChipTextActive]}>
                Yüksek Kolesterol
              </Text>
              {hasCholesterol && <Text style={styles.healthChipCheck}>✓</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.healthChip, hasHypertension && styles.healthChipActive]}
              onPress={() => setHasHypertension(!hasHypertension)}
              activeOpacity={0.7}
            >
              <Text style={styles.healthChipIcon}>💓</Text>
              <Text style={[styles.healthChipText, hasHypertension && styles.healthChipTextActive]}>
                Hipertansiyon
              </Text>
              {hasHypertension && <Text style={styles.healthChipCheck}>✓</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {/* Dietary Goal Selector & Calculation Basis */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Ana Hedefiniz</Text>
          <View style={styles.goalRow}>
            <TouchableOpacity
              style={[styles.goalCard, dietaryGoal === 'weight_loss' && styles.goalCardActive]}
              onPress={() => handleSelectGoal('weight_loss')}
              activeOpacity={0.8}
            >
              <Text style={styles.goalIcon}>🔥</Text>
              <Text style={styles.goalTitle}>Kilo Verme</Text>
              <Text style={styles.goalSub}>-400 kcal açık</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.goalCard, dietaryGoal === 'maintenance' && styles.goalCardActive]}
              onPress={() => handleSelectGoal('maintenance')}
              activeOpacity={0.8}
            >
              <Text style={styles.goalIcon}>⚖️</Text>
              <Text style={styles.goalTitle}>Kiloyu Koruma</Text>
              <Text style={styles.goalSub}>Metabolik denge</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.goalCard, dietaryGoal === 'muscle_gain' && styles.goalCardActive]}
              onPress={() => handleSelectGoal('muscle_gain')}
              activeOpacity={0.8}
            >
              <Text style={styles.goalIcon}>💪</Text>
              <Text style={styles.goalTitle}>Kas Kazanımı</Text>
              <Text style={styles.goalSub}>+300 kcal fazla</Text>
            </TouchableOpacity>
          </View>

          {/* Custom Target Weight Input Box */}
          <View style={styles.targetWeightCard}>
            <View style={{ flex: 1, paddingRight: Spacing.md }}>
              <Text style={styles.targetWeightTitle}>🎯 Hedef Kilonuz</Text>
              <Text style={styles.targetWeightSubtitle}>
                {dietaryGoal === 'weight_loss'
                  ? 'Ulaşmak istediğiniz hedef kilo (Dilediğiniz değeri girebilirsiniz)'
                  : dietaryGoal === 'muscle_gain'
                  ? 'Kazanmak istediğiniz hedef kilo (Dilediğiniz değeri girebilirsiniz)'
                  : 'Korumak istediğiniz vücut ağırlığı'}
              </Text>
            </View>
            <View style={styles.targetWeightInputContainer}>
              <TextInput
                style={styles.targetWeightInput}
                value={targetWeightKg}
                onChangeText={setTargetWeightKg}
                keyboardType="decimal-pad"
                maxLength={5}
                placeholder="Örn: 72"
                placeholderTextColor={Colors.textPlaceholder}
              />
              <Text style={styles.targetWeightUnit}>kg</Text>
            </View>
          </View>

          {/* Calculation Basis Selection (Backend Clinical Feature) */}
          <View style={styles.basisContainer}>
            <Text style={styles.fieldLabel}>Kalori Hesaplama Bazı</Text>
            <View style={styles.basisRow}>
              <TouchableOpacity
                style={[styles.basisChip, calculationBasis === 'current' && styles.basisChipActive]}
                onPress={() => setCalculationBasis('current')}
                activeOpacity={0.8}
              >
                <Text style={[styles.basisChipTitle, calculationBasis === 'current' && styles.basisChipTitleActive]}>
                  Mevcut Kilo Bazlı
                </Text>
                <Text style={styles.basisChipSub}>
                  {calculatedMetrics.numWeight} kg üzerinden TDEE
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.basisChip, calculationBasis === 'ideal' && styles.basisChipActive]}
                onPress={() => setCalculationBasis('ideal')}
                activeOpacity={0.8}
              >
                <Text style={[styles.basisChipTitle, calculationBasis === 'ideal' && styles.basisChipTitleActive]}>
                  İdeal Kilo Bazlı
                </Text>
                <Text style={styles.basisChipSub}>
                  {calculatedMetrics.idealWeightKg} kg İdeal TDEE
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Real-Time Live Clinical Calculation Preview Card */}
        <View style={[styles.card, styles.calculationCard]}>
          <View style={styles.previewHeader}>
            <View>
              <Text style={styles.previewTitle}>⚡ Klinik BMR & Metabolik Analiz</Text>
              <Text style={styles.formulaBadgeSubtitle}>
                VKİ {calculatedMetrics.bmi} • {calculatedMetrics.bmrFormulaLabel}
              </Text>
            </View>
            <View style={styles.targetBadge}>
              <Text style={styles.targetBadgeText}>
                {calculatedMetrics.bmrFormulaUsed === 'mifflin_st_jeor'
                  ? 'Mifflin-St Jeor'
                  : 'Harris-Benedict'}
              </Text>
            </View>
          </View>

          {/* Clinical Insights Banner */}
          <View style={styles.clinicalInsightsRow}>
            <View style={styles.clinicalInsightCol}>
              <Text style={styles.clinicalInsightLabel}>Mevcut VKİ</Text>
              <Text style={styles.clinicalInsightVal}>{calculatedMetrics.bmi} kg/m²</Text>
            </View>
            <View style={styles.clinicalInsightDivider} />
            <View style={styles.clinicalInsightCol}>
              <Text style={styles.clinicalInsightLabel}>Yaşa Göre İdeal Kilo</Text>
              <Text style={[styles.clinicalInsightVal, { color: Colors.primary }]}>
                {calculatedMetrics.idealWeightKg} kg
              </Text>
            </View>
            <View style={styles.clinicalInsightDivider} />
            <View style={styles.clinicalInsightCol}>
              <Text style={styles.clinicalInsightLabel}>Hedef Bazı</Text>
              <Text style={styles.clinicalInsightVal}>
                {calculationBasis === 'ideal' ? 'İdeal Kilo' : 'Mevcut Kilo'}
              </Text>
            </View>
          </View>

          <View style={styles.previewMetricsRow}>
            <View style={styles.previewMetricItem}>
              <Text style={styles.previewMetricVal}>{calculatedMetrics.bmr}</Text>
              <Text style={styles.previewMetricLabel}>BMR (Bazal)</Text>
            </View>
            <View style={styles.previewDivider} />
            <View style={styles.previewMetricItem}>
              <Text style={styles.previewMetricVal}>{calculatedMetrics.tdee}</Text>
              <Text style={styles.previewMetricLabel}>TDEE (Günlük)</Text>
            </View>
            <View style={styles.previewDivider} />
            <View style={styles.previewMetricItem}>
              <Text style={[styles.previewMetricVal, { color: Colors.primary }]}>
                {calculatedMetrics.targetCalories}
              </Text>
              <Text style={styles.previewMetricLabel}>Net Hedef (kcal)</Text>
            </View>
          </View>

          {/* Recommended Macros Breakdown */}
          <View style={styles.macroBreakdownRow}>
            <View style={[styles.macroPill, { backgroundColor: Colors.proteinLight }]}>
              <Text style={[styles.macroPillText, { color: Colors.protein }]}>
                🍗 Protein: {calculatedMetrics.targetProteinGrams}g
              </Text>
            </View>
            <View style={[styles.macroPill, { backgroundColor: Colors.carbsLight }]}>
              <Text style={[styles.macroPillText, { color: Colors.calories }]}>
                🌾 Karb: {calculatedMetrics.targetCarbsGrams}g
              </Text>
            </View>
            <View style={[styles.macroPill, { backgroundColor: Colors.fatLight }]}>
              <Text style={[styles.macroPillText, { color: Colors.fat }]}>
                🥑 Yağ: {calculatedMetrics.targetFatGrams}g
              </Text>
            </View>
            <View style={[styles.macroPill, { backgroundColor: Colors.waterLight }]}>
              <Text style={[styles.macroPillText, { color: Colors.water }]}>
                💧 Su: {calculatedMetrics.waterGoalMl}ml
              </Text>
            </View>
          </View>
        </View>

        {/* Dietary Preferences & Allergies Multi-Select Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🌿 Beslenme Tercihleri & Alerjiler</Text>
          <Text style={styles.allergySectionDesc}>
            DietAI haftalık yemek planlarınızı ve analizlerinizi bu tercihlere göre filtreler.
          </Text>

          <View style={styles.allergiesGrid}>
            {ALLERGY_OPTIONS.map((item) => {
              const isSelected = selectedAllergies.includes(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.allergyItemChip, isSelected && styles.allergyItemChipActive]}
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

        {/* Primary CTA Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.85}>
          <Text style={styles.saveButtonText}>
            {isEditing ? 'Hedeflerimi Güncelle' : 'Hedeflerimi Kaydet ve Başla 🚀'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const createStyles = (theme: ThemeColors, isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      padding: Spacing.lg,
      paddingBottom: Spacing.xxxl,
      backgroundColor: theme.background,
    },
    header: {
      marginBottom: Spacing.lg,
    },
    badgeText: {
      ...Typography.tiny,
      color: isDarkMode ? theme.primary : Colors.primaryDark,
      fontWeight: '700',
      letterSpacing: 1,
      marginBottom: Spacing.xs,
    },
    title: {
      ...Typography.h1,
      color: theme.textPrimary,
    },
    subtitle: {
      ...Typography.body,
      color: theme.textMuted,
      marginTop: Spacing.xs,
      lineHeight: 20,
    },
    card: {
      backgroundColor: theme.surface,
      borderRadius: BorderRadius.xl,
      padding: Spacing.xl,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: Spacing.lg,
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
      marginBottom: Spacing.md,
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
    genderRow: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    genderButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surfaceSubtle,
      borderWidth: 1.5,
      borderColor: theme.border,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.lg,
    },
    genderButtonActive: {
      borderColor: theme.primary,
      backgroundColor: isDarkMode ? '#1E293B' : Colors.primaryLight,
    },
    genderIcon: {
      fontSize: 18,
      marginRight: Spacing.xs,
    },
    genderText: {
      ...Typography.bodyBold,
      color: theme.textSecondary,
    },
    genderTextActive: {
      color: isDarkMode ? theme.primary : Colors.primaryDark,
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      paddingVertical: Spacing.xs,
    },
    statCol: {
      flex: 1,
      alignItems: 'center',
    },
    statLabel: {
      ...Typography.tiny,
      color: theme.textMuted,
      marginBottom: Spacing.xs,
    },
    statInput: {
      ...Typography.h1,
      color: theme.textPrimary,
      textAlign: 'center',
      minWidth: 60,
      paddingVertical: Spacing.xs,
      backgroundColor: theme.surfaceSubtle,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: theme.border,
    },
    statUnit: {
      ...Typography.tiny,
      color: theme.textMuted,
      marginTop: 4,
    },
    statDivider: {
      width: 1,
      height: 48,
      backgroundColor: theme.border,
    },
    // Sports Section
    sportsToggleRow: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginBottom: Spacing.md,
    },
    sportsToggleButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.sm,
      backgroundColor: theme.surfaceSubtle,
      borderWidth: 1.5,
      borderColor: theme.border,
      borderRadius: BorderRadius.lg,
    },
    sportsToggleButtonActive: {
      borderColor: theme.primary,
      backgroundColor: isDarkMode ? '#1E293B' : Colors.primaryLight,
    },
    sportsToggleIcon: {
      fontSize: 18,
      marginRight: Spacing.xs,
    },
    sportsToggleText: {
      ...Typography.captionBold,
      color: theme.textSecondary,
    },
    sportsToggleTextActive: {
      color: isDarkMode ? theme.primary : Colors.primaryDark,
    },
    sportsDaysContainer: {
      marginTop: Spacing.xs,
      paddingTop: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    daysRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginVertical: Spacing.sm,
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
    sportsDaysHint: {
      ...Typography.tiny,
      color: theme.textMuted,
      marginTop: Spacing.xs,
    },
    // Clinical Health Conditions
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
    // Goals & Calculation Basis
    goalRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    goalCard: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.xs,
      borderRadius: BorderRadius.lg,
      borderWidth: 1.5,
      borderColor: theme.border,
      backgroundColor: theme.surfaceSubtle,
    },
    goalCardActive: {
      borderColor: theme.primary,
      backgroundColor: isDarkMode ? '#1E293B' : Colors.primaryLight,
    },
    goalIcon: {
      fontSize: 22,
      marginBottom: 4,
    },
    goalTitle: {
      ...Typography.captionBold,
      color: theme.textPrimary,
      textAlign: 'center',
    },
    goalSub: {
      ...Typography.tiny,
      color: theme.textMuted,
      textAlign: 'center',
      marginTop: 2,
    },
    targetWeightCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: Spacing.md,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    targetWeightTitle: {
      ...Typography.bodyBold,
      color: theme.textPrimary,
    },
    targetWeightSubtitle: {
      ...Typography.tiny,
      color: theme.textMuted,
      marginTop: 2,
      lineHeight: 14,
    },
    targetWeightInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surfaceSubtle,
      borderWidth: 1.5,
      borderColor: theme.primaryLight,
      borderRadius: BorderRadius.lg,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      minWidth: 85,
    },
    targetWeightInput: {
      ...Typography.h3,
      color: isDarkMode ? theme.primary : Colors.primaryDark,
      textAlign: 'center',
      paddingVertical: 4,
      minWidth: 44,
    },
    targetWeightUnit: {
      ...Typography.captionBold,
      color: isDarkMode ? theme.primary : Colors.primaryDark,
      marginLeft: 4,
    },
    basisContainer: {
      marginTop: Spacing.md,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    basisRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginTop: Spacing.xs,
    },
    basisChip: {
      flex: 1,
      paddingVertical: Spacing.sm,
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
    },
    basisChipTitleActive: {
      color: isDarkMode ? theme.primary : Colors.primaryDark,
    },
    basisChipSub: {
      ...Typography.tiny,
      color: theme.textMuted,
      fontSize: 10,
      marginTop: 2,
    },
    // Calculation Summary Card
    calculationCard: {
      backgroundColor: isDarkMode ? '#0F2A1D' : '#F0FDF4',
      borderColor: isDarkMode ? '#134E35' : '#BBF7D0',
    },
    previewHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: Spacing.sm,
    },
    previewTitle: {
      ...Typography.h3,
      color: isDarkMode ? '#86EFAC' : Colors.primaryDark,
    },
    formulaBadgeSubtitle: {
      ...Typography.tiny,
      color: isDarkMode ? '#A7F3D0' : '#15803D',
      marginTop: 2,
      fontWeight: '600',
    },
    targetBadge: {
      backgroundColor: theme.surface,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 3,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: isDarkMode ? '#134E35' : '#BBF7D0',
    },
    targetBadgeText: {
      ...Typography.tiny,
      color: isDarkMode ? theme.primary : Colors.primaryDark,
      fontWeight: '700',
    },
    clinicalInsightsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: isDarkMode ? '#153E2B' : '#DCFCE7',
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.xs + 2,
      paddingHorizontal: Spacing.sm,
      marginBottom: Spacing.md,
    },
    clinicalInsightCol: {
      flex: 1,
      alignItems: 'center',
    },
    clinicalInsightLabel: {
      ...Typography.tiny,
      fontSize: 9,
      color: isDarkMode ? '#A7F3D0' : '#166534',
    },
    clinicalInsightVal: {
      ...Typography.tiny,
      fontWeight: '700',
      color: isDarkMode ? '#F0FDF4' : '#14532D',
      marginTop: 1,
    },
    clinicalInsightDivider: {
      width: 1,
      height: '80%',
      backgroundColor: isDarkMode ? '#1B4D36' : '#BBF7D0',
    },
    previewMetricsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Spacing.sm,
    },
    previewMetricItem: {
      flex: 1,
      alignItems: 'center',
    },
    previewMetricVal: {
      ...Typography.h2,
      color: theme.textPrimary,
    },
    previewMetricLabel: {
      ...Typography.tiny,
      color: theme.textMuted,
      marginTop: 2,
    },
    previewDivider: {
      width: 1,
      height: 32,
      backgroundColor: isDarkMode ? '#134E35' : '#BBF7D0',
    },
    macroBreakdownRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.xs,
      marginTop: Spacing.md,
      paddingTop: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: isDarkMode ? '#134E35' : '#DCFCE7',
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
    // Allergies Section
    allergySectionDesc: {
      ...Typography.caption,
      color: theme.textMuted,
      marginBottom: Spacing.md,
      lineHeight: 18,
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
      borderColor: isDarkMode ? '#F59E0B' : '#F59E0B',
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
    saveButton: {
      backgroundColor: theme.primary,
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.xl,
      alignItems: 'center',
      marginTop: Spacing.xs,
      marginBottom: Spacing.xl,
      ...Shadows.card,
    },
    saveButtonText: {
      ...Typography.bodyBold,
      color: Colors.textInverse,
      fontSize: 16,
    },
  });
