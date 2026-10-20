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
import { Colors } from '../constants/colors';
import { Spacing, BorderRadius, Typography, Shadows } from '../constants/theme';
import { useDietStore } from '../store/useDietStore';
import { UserProfile } from '../types';

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
  const { userProfile, updateProfile } = useDietStore();

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

  // Activity multipliers for Mifflin-St Jeor TDEE calculation
  const activityMultipliers: Record<UserProfile['activityLevel'], { factor: number; label: string; desc: string }> = {
    sedentary: { factor: 1.2, label: 'Hareketsiz', desc: 'Masa başı iş, minimum hareket' },
    light: { factor: 1.375, label: 'Az Hareketli', desc: 'Haftada 1-3 gün hafif egzersiz' },
    moderate: { factor: 1.55, label: 'Orta Düzey', desc: 'Haftada 3-5 gün düzenli egzersiz' },
    active: { factor: 1.725, label: 'Çok Hareketli', desc: 'Haftada 6-7 gün yoğun spor' },
    very_active: { factor: 1.9, label: 'Ekstra Aktif', desc: 'Günde 2 antrenman / Ağır fiziksel iş' },
  };

  // Live Mifflin-St Jeor metabolic calculations
  const calculatedMetrics = useMemo(() => {
    const numAge = Math.max(12, Math.min(100, parseInt(age, 10) || 22));
    const numHeight = Math.max(100, Math.min(250, parseFloat(heightCm) || 180));
    const numWeight = Math.max(30, Math.min(300, parseFloat(weightKg) || 75));

    // Mifflin-St Jeor BMR Equation
    let bmr = 10 * numWeight + 6.25 * numHeight - 5 * numAge;
    bmr = gender === 'male' ? Math.round(bmr + 5) : Math.round(bmr - 161);

    // TDEE = BMR * Activity Factor
    const multiplier = activityMultipliers[activityLevel].factor;
    const tdee = Math.round(bmr * multiplier);

    // Target Calories based on Dietary Goal
    let targetCalories = tdee;
    if (dietaryGoal === 'weight_loss') {
      targetCalories = Math.max(1200, tdee - 400); // Safe minimum deficit
    } else if (dietaryGoal === 'muscle_gain') {
      targetCalories = tdee + 300; // Lean mass surplus
    }

    // Macro Split: 30% Protein (4 kcal/g), 40% Carbs (4 kcal/g), 30% Fat (9 kcal/g)
    const targetProteinGrams = Math.round((targetCalories * 0.3) / 4);
    const targetCarbsGrams = Math.round((targetCalories * 0.4) / 4);
    const targetFatGrams = Math.round((targetCalories * 0.3) / 9);

    // Recommended Daily Water Goal (35 ml per kg of bodyweight, rounded to nearest 50ml)
    const waterGoalMl = Math.round((numWeight * 35) / 50) * 50;

    return {
      numAge,
      numHeight,
      numWeight,
      bmr,
      tdee,
      targetCalories,
      targetProteinGrams,
      targetCarbsGrams,
      targetFatGrams,
      waterGoalMl,
    };
  }, [age, heightCm, weightKg, gender, activityLevel, dietaryGoal]);

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
    });

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

        {/* Activity Level Selector */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Günlük Aktivite Seviyesi</Text>
          {(Object.keys(activityMultipliers) as UserProfile['activityLevel'][]).map((level) => {
            const isSelected = activityLevel === level;
            const item = activityMultipliers[level];
            return (
              <TouchableOpacity
                key={level}
                style={[styles.activityItem, isSelected && styles.activityItemActive]}
                onPress={() => setActivityLevel(level)}
                activeOpacity={0.7}
              >
                <View style={styles.radioDot}>
                  {isSelected && <View style={styles.radioDotInner} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.activityLabel, isSelected && styles.activityLabelActive]}>
                    {item.label} (x{item.factor})
                  </Text>
                  <Text style={styles.activityDesc}>{item.desc}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Dietary Goal Selector */}
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
        </View>

        {/* Real-Time Live Calculation Preview Card */}
        <View style={[styles.card, styles.calculationCard]}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle}>⚡ Canlı BMR & Hedef Özeti</Text>
            <View style={styles.targetBadge}>
              <Text style={styles.targetBadgeText}>Mifflin-St Jeor</Text>
            </View>
          </View>

          <View style={styles.previewMetricsRow}>
            <View style={styles.previewMetricItem}>
              <Text style={styles.previewMetricVal}>{calculatedMetrics.bmr}</Text>
              <Text style={styles.previewMetricLabel}>BMR (kcal)</Text>
            </View>
            <View style={styles.previewDivider} />
            <View style={styles.previewMetricItem}>
              <Text style={styles.previewMetricVal}>{calculatedMetrics.tdee}</Text>
              <Text style={styles.previewMetricLabel}>TDEE (kcal)</Text>
            </View>
            <View style={styles.previewDivider} />
            <View style={styles.previewMetricItem}>
              <Text style={[styles.previewMetricVal, { color: Colors.primary }]}>
                {calculatedMetrics.targetCalories}
              </Text>
              <Text style={styles.previewMetricLabel}>Hedef (kcal)</Text>
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

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  badgeText: {
    ...Typography.tiny,
    color: Colors.primaryDark,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    lineHeight: 20,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    ...Typography.captionBold,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    ...Typography.body,
    color: Colors.textPrimary,
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
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  genderButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  genderIcon: {
    fontSize: 18,
    marginRight: Spacing.xs,
  },
  genderText: {
    ...Typography.bodyBold,
    color: Colors.textSecondary,
  },
  genderTextActive: {
    color: Colors.primaryDark,
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
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  statInput: {
    ...Typography.h1,
    color: Colors.textPrimary,
    textAlign: 'center',
    minWidth: 60,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statUnit: {
    ...Typography.tiny,
    color: Colors.textMuted,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 48,
    backgroundColor: Colors.border,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  activityItemActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted,
  },
  radioDot: {
    width: 18,
    height: 18,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: Colors.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  radioDotInner: {
    width: 10,
    height: 10,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
  },
  activityLabel: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  activityLabelActive: {
    color: Colors.primaryDark,
  },
  activityDesc: {
    ...Typography.tiny,
    color: Colors.textMuted,
    marginTop: 2,
  },
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
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceSubtle,
  },
  goalCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  goalIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  goalTitle: {
    ...Typography.captionBold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  goalSub: {
    ...Typography.tiny,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  calculationCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  previewTitle: {
    ...Typography.h3,
    color: Colors.primaryDark,
  },
  targetBadge: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  targetBadgeText: {
    ...Typography.tiny,
    color: Colors.primaryDark,
    fontWeight: '700',
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
    color: Colors.textPrimary,
  },
  previewMetricLabel: {
    ...Typography.tiny,
    color: Colors.textMuted,
    marginTop: 2,
  },
  previewDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#BBF7D0',
  },
  macroBreakdownRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#DCFCE7',
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
  saveButton: {
    backgroundColor: Colors.primary,
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
  targetWeightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  targetWeightTitle: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  targetWeightSubtitle: {
    ...Typography.tiny,
    color: Colors.textMuted,
    marginTop: 2,
    lineHeight: 14,
  },
  targetWeightInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1.5,
    borderColor: Colors.primaryLight,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    minWidth: 85,
  },
  targetWeightInput: {
    ...Typography.h3,
    color: Colors.primaryDark,
    textAlign: 'center',
    paddingVertical: 4,
    minWidth: 44,
  },
  targetWeightUnit: {
    ...Typography.captionBold,
    color: Colors.primaryDark,
    marginLeft: 4,
  },
  allergySectionDesc: {
    ...Typography.caption,
    color: Colors.textMuted,
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
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  allergyItemChipActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  allergyItemEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  allergyItemLabel: {
    ...Typography.captionBold,
    color: Colors.textSecondary,
  },
  allergyItemLabelActive: {
    color: '#92400E',
  },
  checkMark: {
    color: '#D97706',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
