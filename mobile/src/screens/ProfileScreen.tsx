import React, { useState, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Switch,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Colors, getThemeColors, ThemeColors } from '../constants/colors';
import { Spacing, BorderRadius, Typography, Shadows } from '../constants/theme';
import { useDietStore } from '../store/useDietStore';
import { apiService } from '../services/api';
import { OnboardingScreen } from './OnboardingScreen';

export const ProfileScreen: React.FC = () => {
  const {
    userProfile,
    updateProfile,
    weeklyWeightLogs,
    addWeeklyWeightLog,
    markWeeklyLogCalibrated,
    useMockData,
    setUseMockData,
    resetDay,
    isDarkMode,
    setHasCompletedOnboarding,
  } = useDietStore();
  const theme = getThemeColors(isDarkMode);
  const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);
  const [isEditing, setIsEditing] = useState(false);
  const [weeklyInputKg, setWeeklyInputKg] = useState(String(userProfile.weightKg));
  const apiConfig = apiService.getConfig();

  useEffect(() => {
    setWeeklyInputKg(String(userProfile.weightKg));
  }, [userProfile.weightKg]);

  // BMI (Body Mass Index) Calculation
  const bmiData = useMemo(() => {
    const heightInMeters = userProfile.heightCm / 100;
    if (heightInMeters <= 0) return { bmi: 22.0, label: 'Normal Kilo', color: theme.primary };

    const bmi = userProfile.weightKg / (heightInMeters * heightInMeters);
    const roundedBmi = Math.round(bmi * 10) / 10;

    if (bmi < 18.5) {
      return { bmi: roundedBmi, shortLabel: 'Düşük', label: 'Düşük Kilo (< 18.5)', color: '#3B82F6' };
    } else if (bmi < 25) {
      return { bmi: roundedBmi, shortLabel: 'Normal', label: 'Normal & İdeal Kilo (18.5 - 24.9)', color: theme.primary };
    } else if (bmi < 30) {
      return { bmi: roundedBmi, shortLabel: 'Hafif Kilolu', label: 'Hafif Kilolu (25.0 - 29.9)', color: '#F59E0B' };
    } else {
      return { bmi: roundedBmi, shortLabel: 'Obezite', label: 'Obezite Sınırı (≥ 30)', color: theme.danger };
    }
  }, [userProfile.heightCm, userProfile.weightKg, theme]);

  // Dynamic Target Weight & Progress Telemetry
  const targetWeight = useMemo(() => {
    if (typeof userProfile.targetWeightKg === 'number' && userProfile.targetWeightKg > 0) {
      return userProfile.targetWeightKg;
    }
    if (userProfile.dietaryGoal === 'weight_loss') {
      return Math.max(40, userProfile.weightKg - 4);
    } else if (userProfile.dietaryGoal === 'muscle_gain') {
      return userProfile.weightKg + 3;
    }
    return userProfile.weightKg;
  }, [userProfile.targetWeightKg, userProfile.weightKg, userProfile.dietaryGoal]);

  const weightDeltaKg = Math.round(Math.abs(userProfile.weightKg - targetWeight) * 10) / 10;

  const goalMode = useMemo(() => {
    if (userProfile.dietaryGoal === 'maintenance' || userProfile.weightKg === targetWeight) {
      return 'maintenance';
    }
    if (userProfile.weightKg > targetWeight) {
      return 'loss';
    }
    return 'gain';
  }, [userProfile.dietaryGoal, userProfile.weightKg, targetWeight]);

  const goalTelemetry = useMemo(() => {
    const calcProgress = () => {
      if (weightDeltaKg === 0) return 100;
      const baselineDelta = Math.max(weightDeltaKg, 5.0);
      const ratio = Math.max(0.2, 1 - weightDeltaKg / (baselineDelta * 1.5));
      return Math.min(95, Math.max(20, Math.round(ratio * 100)));
    };

    const paceVal = userProfile.weeklyPaceKg || 0.5;
    switch (goalMode) {
      case 'loss': {
        const progressPercent = calcProgress();
        return {
          paceBadge: `Haftalık -${paceVal} kg (Yağ Yakımı)`,
          arrowIcon: '↘',
          arrowColor: theme.calories,
          deltaText: `${weightDeltaKg} kg verilecek`,
          progressPercent,
          hintText: 'Dengeli kalori açığı ile kas kaybı önleniyor.',
        };
      }
      case 'gain': {
        const progressPercent = calcProgress();
        return {
          paceBadge: `Haftalık +${paceVal} kg (Kas Kütlesi)`,
          arrowIcon: '↗',
          arrowColor: theme.protein,
          deltaText: `+${weightDeltaKg} kg hedefleniyor`,
          progressPercent,
          hintText: 'Yüksek protein destekli temiz hacim kazanımı.',
        };
      }
      default: {
        return {
          paceBadge: 'Form Koruma (Kilo Sabit)',
          arrowIcon: '→',
          arrowColor: theme.primary,
          deltaText: 'Kilo dengede',
          progressPercent: 100,
          hintText: 'Metabolik denge ve sağlıklı besin dağılımı.',
        };
      }
    }
  }, [goalMode, weightDeltaKg, theme, userProfile.weeklyPaceKg]);

  const getGoalLabel = (goal: string) => {
    switch (goal) {
      case 'weight_loss':
        return '🔥 Kilo Verme & Yağ Yakımı (-400 kcal)';
      case 'muscle_gain':
        return '💪 Kas Kazanımı & Hipertrofi (+300 kcal)';
      case 'maintenance':
        return '⚖️ Form Koruma & Sağlıklı Yaşam (Denge)';
      default:
        return 'Kilo Verme';
    }
  };

  const getActivityLabel = (activity: string) => {
    switch (activity) {
      case 'sedentary':
        return 'Hareketsiz (Masa başı)';
      case 'light':
        return 'Az Hareketli (1-2 gün spor)';
      case 'moderate':
        return 'Orta Düzey (3-4 gün spor)';
      case 'active':
        return 'Çok Hareketli (5-6 gün spor)';
      case 'very_active':
        return 'Ekstra Aktif (7 gün / Ağır antrenman)';
      default:
        return 'Orta Düzey';
    }
  };

  // Adjust Weekly Check-In Input by 0.1 kg
  const adjustWeeklyInput = (delta: number) => {
    const current = parseFloat(weeklyInputKg) || userProfile.weightKg;
    const next = Math.max(35, Math.min(220, Math.round((current + delta) * 10) / 10));
    setWeeklyInputKg(Number(next.toFixed(1)).toString());
  };

  // Save Weekly Weigh-In
  const handleSaveWeeklyWeight = () => {
    const parsed = parseFloat(weeklyInputKg);
    if (isNaN(parsed) || parsed < 35 || parsed > 220) {
      Alert.alert('Geçersiz Kilo', 'Lütfen 35 kg ile 220 kg arasında geçerli bir tartım girin.');
      return;
    }
    addWeeklyWeightLog(parsed);
  };

  // Smart Weekly Trend & Goal Alignment Analysis
  const weeklyTrendAnalysis = useMemo(() => {
    const latestLog =
      weeklyWeightLogs.length > 0 ? weeklyWeightLogs[weeklyWeightLogs.length - 1] : null;
    if (!latestLog) return null;

    const delta = latestLog.deltaKg;
    const goal = userProfile.dietaryGoal;
    const pace = userProfile.weeklyPaceKg || 0.5;

    // Recalculate baseline BMR & TDEE from current weight
    const w = userProfile.weightKg;
    const h = userProfile.heightCm;
    const a = userProfile.age;
    const isMale = userProfile.gender === 'male';
    const heightM = h / 100;
    const currentBmi = w / (heightM * heightM);

    const bmr =
      currentBmi > 30
        ? Math.round(10 * w + 6.25 * h - 5 * a + (isMale ? 5 : -161))
        : Math.round(
            isMale
              ? 88.362 + 13.397 * w + 4.799 * h - 5.677 * a
              : 447.593 + 9.247 * w + 3.098 * h - 4.33 * a
          );

    const palMap: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    };
    const tdee = Math.round(bmr * (palMap[userProfile.activityLevel] || 1.55));
    const minSafeCalories = isMale ? 1400 : 1200;

    // CASE 1: User selected Muscle/Weight Gain, but LOST weight
    if (goal === 'muscle_gain' && delta < -0.1) {
      const extraBoost = Math.min(450, Math.round(Math.abs(delta) * 450 + 200));
      const baseSurplus = Math.round(pace * 700);
      const recommendedCalories = Math.max(
        userProfile.targetCalories + 250,
        tdee + baseSurplus + Math.round(extraBoost * 0.5)
      );
      return {
        logId: latestLog.id,
        alreadyCalibrated: latestLog.caloriesAdjustedTo === recommendedCalories,
        status: 'mismatch' as const,
        badgeText: '⚠️ Hedef Sapması: Kilo Kaybı',
        color: theme.danger,
        bgColor: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
        borderColor: isDarkMode ? 'rgba(239, 68, 68, 0.35)' : '#FCA5A5',
        title: `Kilo/Kas alma hedefindesiniz ancak ${Math.abs(delta)} kg verdiniz`,
        description: `Son tartımda (${latestLog.previousWeightKg} kg → ${latestLog.weightKg} kg) kilo kaybı yaşandı. Mevcut kaloriniz (${userProfile.targetCalories} kcal) metabolik harcamanızın altında kalıyor. Kas gelişimi için günlük kalorinizi +${recommendedCalories - userProfile.targetCalories} kcal artırmanız önerilir.`,
        recommendedCalories,
        newBmr: bmr,
        newTdee: tdee,
        buttonLabel: `⚡ Kalori Hedefini ${recommendedCalories} kcal'ye Yükselt`,
      };
    }

    // CASE 2: User selected Weight Loss, but GAINED weight
    if (goal === 'weight_loss' && delta > 0.1) {
      const baseDeficit = Math.round(pace * 900);
      const recommendedCalories = Math.max(
        minSafeCalories,
        Math.min(userProfile.targetCalories - 200, tdee - baseDeficit)
      );
      return {
        logId: latestLog.id,
        alreadyCalibrated: latestLog.caloriesAdjustedTo === recommendedCalories,
        status: 'mismatch' as const,
        badgeText: '⚠️ Hedef Sapması: Kilo Artışı',
        color: '#D97706',
        bgColor: isDarkMode ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7',
        borderColor: isDarkMode ? 'rgba(245, 158, 11, 0.35)' : '#FDE68A',
        title: `Kilo verme hedefindesiniz ancak +${delta} kg aldınız`,
        description: `Son tartımda (${latestLog.previousWeightKg} kg → ${latestLog.weightKg} kg) artış görüldü. Sağlıklı yağ yakımına geri dönmek için günlük kalorinizi güvenli sınırlarda ${recommendedCalories} kcal seviyesine dengeleyebilirsiniz.`,
        recommendedCalories,
        newBmr: bmr,
        newTdee: tdee,
        buttonLabel: `⚡ Kalori Hedefini ${recommendedCalories} kcal'ye Dengele`,
      };
    }

    // CASE 3: Weight stalled (Plateau) while trying to lose or gain
    if (goal !== 'maintenance' && Math.abs(delta) <= 0.1) {
      const adjustment = goal === 'muscle_gain' ? 180 : -180;
      const recommendedCalories = Math.max(
        minSafeCalories,
        userProfile.targetCalories + adjustment
      );
      return {
        logId: latestLog.id,
        alreadyCalibrated: latestLog.caloriesAdjustedTo === recommendedCalories,
        status: 'plateau' as const,
        badgeText: 'ℹ️ Plato / Sabit Kilo',
        color: '#3B82F6',
        bgColor: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF',
        borderColor: isDarkMode ? 'rgba(59, 130, 246, 0.35)' : '#BFDBFE',
        title: `Bu hafta kilonuz sabit kaldı (${delta >= 0 ? '+' : ''}${delta} kg)`,
        description: `Hedefiniz olan haftalık ${pace} kg ${
          goal === 'weight_loss' ? 'yağ yakımını' : 'kas kazanımını'
        } tekrar tetiklemek için günlük kalorinizi ${
          adjustment > 0 ? `+${adjustment}` : adjustment
        } kcal güncelleyebilirsiniz.`,
        recommendedCalories,
        newBmr: bmr,
        newTdee: tdee,
        buttonLabel: `⚡ Plato Kırıcı Kalori Ayarı (${recommendedCalories} kcal)`,
      };
    }

    // CASE 4: On track!
    const standardTarget =
      goal === 'weight_loss'
        ? Math.max(minSafeCalories, tdee - Math.round(pace * 900))
        : goal === 'muscle_gain'
        ? tdee + Math.round(pace * 700)
        : tdee;

    return {
      logId: latestLog.id,
      alreadyCalibrated: latestLog.caloriesAdjustedTo === standardTarget,
      status: 'ontrack' as const,
      badgeText: '✅ Hedefle Uyumlu İlerleme',
      color: theme.primary,
      bgColor: isDarkMode ? 'rgba(16, 185, 129, 0.14)' : '#ECFDF5',
      borderColor: isDarkMode ? 'rgba(16, 185, 129, 0.35)' : '#A7F3D0',
      title: `Harika! Haftalık değişiminiz (${delta > 0 ? `+${delta}` : delta} kg) hedefinizle tutarlı`,
      description: `Güncel kilonuza (${userProfile.weightKg} kg) göre bazal metabolizmanız ${bmr} kcal, günlük harcamanız ${tdee} kcal olarak hesaplandı.`,
      recommendedCalories: standardTarget,
      newBmr: bmr,
      newTdee: tdee,
      buttonLabel: `🔄 Yeni Kiloya Göre BMR & Makroları Güncelle (${standardTarget} kcal)`,
    };
  }, [weeklyWeightLogs, userProfile, theme, isDarkMode]);

  const handleApplyCalibration = () => {
    if (!weeklyTrendAnalysis) return;
    const cal = weeklyTrendAnalysis.recommendedCalories;
    const isGain = userProfile.dietaryGoal === 'muscle_gain';
    const newProtein = Math.round((cal * (isGain ? 0.32 : 0.3)) / 4);
    const newCarbs = Math.round((cal * 0.4) / 4);
    const newFat = Math.round((cal * (isGain ? 0.28 : 0.3)) / 9);

    updateProfile({
      bmr: weeklyTrendAnalysis.newBmr,
      tdee: weeklyTrendAnalysis.newTdee,
      targetCalories: cal,
      targetProteinGrams: newProtein,
      targetCarbsGrams: newCarbs,
      targetFatGrams: newFat,
    });
    markWeeklyLogCalibrated(weeklyTrendAnalysis.logId, cal);
    Alert.alert(
      'Planınız Kalibre Edildi',
      `Günlük hedefiniz haftalık kilo değişiminize göre ${cal} kcal (${newProtein}g Protein, ${newCarbs}g Karbonhidrat, ${newFat}g Yağ) olarak güncellendi.`
    );
  };

  // Safe Reset Day Confirmation
  const handleResetDay = () => {
    Alert.alert(
      'Günü Sıfırla',
      'Bugün kaydettiğiniz tüm öğünler ve su tüketimi sıfırlanacaktır. Bu işlem geri alınamaz. Devam etmek istiyor musunuz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Evet, Sıfırla',
          style: 'destructive',
          onPress: () => {
            resetDay();
            Alert.alert('Bilgi', 'Bugünkü beslenme ve su takibi başarıyla sıfırlandı.');
          },
        },
      ]
    );
  };

  if (isEditing) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <View style={styles.editHeaderBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setIsEditing(false)}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>← Vazgeç</Text>
          </TouchableOpacity>
          <Text style={styles.editHeaderTitle}>Hedef Düzenleme</Text>
          <View style={{ width: 60 }} />
        </View>
        <OnboardingScreen isEditing={true} onComplete={() => setIsEditing(false)} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Clean & Decluttered Profile Header Card */}
      <View style={styles.card}>
        <View style={styles.profileTopRow}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>
              {userProfile.name
                .split(' ')
                .filter(Boolean)
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileIdentityCol}>
            <Text style={styles.name}>{userProfile.name}</Text>
            <Text style={styles.role}>
              {userProfile.gender === 'male' ? '👨 Erkek' : '👩 Kadın'} • {userProfile.age} Yaş
            </Text>
          </View>
        </View>

        {/* Compact 3-Column Physical Stats Bar */}
        <View style={styles.compactStatsStrip}>
          <View style={styles.compactStatItem}>
            <Text style={styles.compactStatLabel}>Boy</Text>
            <Text style={styles.compactStatValue}>{userProfile.heightCm} cm</Text>
          </View>
          <View style={styles.compactStatDivider} />
          <View style={styles.compactStatItem}>
            <Text style={styles.compactStatLabel}>Güncel Kilo</Text>
            <Text style={styles.compactStatValue}>{userProfile.weightKg} kg</Text>
          </View>
          <View style={styles.compactStatDivider} />
          <View style={styles.compactStatItem}>
            <Text style={styles.compactStatLabel}>VKİ ({bmiData.shortLabel})</Text>
            <Text style={[styles.compactStatValue, { color: bmiData.color }]}>
              {bmiData.bmi}
            </Text>
          </View>
        </View>

        {/* Single Clean Edit Button */}
        <TouchableOpacity
          style={styles.editProfileButton}
          onPress={() => setIsEditing(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.editProfileButtonText}>
            ✏️ Hedefleri & Fiziksel Ölçüleri Düzenle
          </Text>
        </TouchableOpacity>
      </View>

      {/* Weekly Weight Check-In & Adaptive Calorie Calibration Card */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>⚖️ Haftalık Kilo Takibi & Analiz</Text>
            <Text style={styles.weeklyCardSub}>
              Her hafta tartılıp kilonuzu girin; hedefinizle ters düşen değişimlerde planınız otomatik dengelensin.
            </Text>
          </View>
        </View>

        {/* Weekly Weight Stepper & Save Row */}
        <View style={styles.weeklyCheckInBox}>
          <View style={styles.weeklyStepperGroup}>
            <TouchableOpacity
              style={styles.weeklyStepBtn}
              onPress={() => adjustWeeklyInput(-0.1)}
              activeOpacity={0.7}
            >
              <Text style={styles.weeklyStepBtnText}>−0.1</Text>
            </TouchableOpacity>
            <View style={styles.weeklyInputWrapper}>
              <TextInput
                style={styles.weeklyWeightInput}
                value={weeklyInputKg}
                onChangeText={setWeeklyInputKg}
                keyboardType="decimal-pad"
                maxLength={5}
              />
              <Text style={styles.weeklyWeightUnit}>kg</Text>
            </View>
            <TouchableOpacity
              style={styles.weeklyStepBtn}
              onPress={() => adjustWeeklyInput(0.1)}
              activeOpacity={0.7}
            >
              <Text style={styles.weeklyStepBtnText}>+0.1</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.weeklySaveBtn}
            onPress={handleSaveWeeklyWeight}
            activeOpacity={0.8}
          >
            <Text style={styles.weeklySaveBtnText}>Tartımı Kaydet</Text>
          </TouchableOpacity>
        </View>

        {/* Smart Adaptive Feedback Banner */}
        {weeklyTrendAnalysis && (
          <View
            style={[
              styles.adaptiveReviewBox,
              {
                backgroundColor: weeklyTrendAnalysis.bgColor,
                borderColor: weeklyTrendAnalysis.borderColor,
              },
            ]}
          >
            <View style={styles.adaptiveBadgeRow}>
              <Text style={[styles.adaptiveBadgeText, { color: weeklyTrendAnalysis.color }]}>
                {weeklyTrendAnalysis.badgeText}
              </Text>
            </View>
            <Text style={styles.adaptiveTitle}>{weeklyTrendAnalysis.title}</Text>
            <Text style={styles.adaptiveDesc}>{weeklyTrendAnalysis.description}</Text>

            {!weeklyTrendAnalysis.alreadyCalibrated ? (
              <TouchableOpacity
                style={[
                  styles.adaptiveActionBtn,
                  { backgroundColor: weeklyTrendAnalysis.color },
                ]}
                onPress={handleApplyCalibration}
                activeOpacity={0.85}
              >
                <Text style={styles.adaptiveActionBtnText}>
                  {weeklyTrendAnalysis.buttonLabel}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.calibratedDoneTag}>
                <Text style={[styles.calibratedDoneText, { color: theme.primary }]}>
                  ✓ Bu tartım için kalori ve makro hedefleriniz dengelendi ({userProfile.targetCalories} kcal)
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Recent Weekly Weigh-Ins History */}
        {weeklyWeightLogs.length > 0 && (
          <View style={styles.weeklyHistorySection}>
            <Text style={styles.weeklyHistoryHeader}>SON HAFTALIK TARTIMLAR</Text>
            {weeklyWeightLogs
              .slice(-4)
              .reverse()
              .map((entry) => {
                const isGain = entry.deltaKg > 0;
                const isLoss = entry.deltaKg < 0;
                const deltaStr =
                  entry.deltaKg > 0
                    ? `+${entry.deltaKg} kg`
                    : entry.deltaKg < 0
                    ? `${entry.deltaKg} kg`
                    : '0.0 kg';

                // Check if delta matches the goal at log time
                const alignedWithGoal =
                  (entry.goalAtLog === 'muscle_gain' && isGain) ||
                  (entry.goalAtLog === 'weight_loss' && isLoss) ||
                  (entry.goalAtLog === 'maintenance' && Math.abs(entry.deltaKg) <= 0.3);

                return (
                  <View key={entry.id} style={styles.weeklyHistoryRow}>
                    <View>
                      <Text style={styles.weeklyHistoryWeek}>{entry.weekLabel}</Text>
                      <Text style={styles.weeklyHistoryDate}>{entry.dateStr}</Text>
                    </View>
                    <View style={styles.weeklyHistoryRight}>
                      <Text style={styles.weeklyHistoryWeight}>{entry.weightKg} kg</Text>
                      <View
                        style={[
                          styles.weeklyDeltaPill,
                          {
                            backgroundColor: alignedWithGoal
                              ? isDarkMode
                                ? 'rgba(16, 185, 129, 0.2)'
                                : '#D1FAE5'
                              : isDarkMode
                              ? 'rgba(245, 158, 11, 0.2)'
                              : '#FEF3C7',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.weeklyDeltaPillText,
                            {
                              color: alignedWithGoal
                                ? theme.primary
                                : isDarkMode
                                ? '#FCD34D'
                                : '#B45309',
                            },
                          ]}
                        >
                          {deltaStr}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
          </View>
        )}
      </View>

      {/* Goal Weight & Target Progress Card */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.sectionTitle}>🎯 Kilo Hedefi & İlerleme</Text>
          <View style={styles.paceBadge}>
            <Text style={styles.paceBadgeText}>{goalTelemetry.paceBadge}</Text>
          </View>
        </View>

        <View style={styles.weightProgressRow}>
          <View style={styles.weightBox}>
            <Text style={styles.weightBoxLabel}>Mevcut Kilo</Text>
            <Text style={styles.weightBoxValue}>{userProfile.weightKg} kg</Text>
          </View>

          <View style={styles.weightArrowContainer}>
            <Text style={[styles.weightArrowIcon, { color: goalTelemetry.arrowColor }]}>
              {goalTelemetry.arrowIcon}
            </Text>
            <Text style={styles.weightDeltaText}>{goalTelemetry.deltaText}</Text>
          </View>

          <View
            style={[
              styles.weightBox,
              { borderColor: theme.primaryLight, backgroundColor: theme.surfaceSubtle },
            ]}
          >
            <Text style={[styles.weightBoxLabel, { color: theme.primary }]}>Hedef Kilo</Text>
            <Text style={[styles.weightBoxValue, { color: theme.primary }]}>
              {targetWeight} kg
            </Text>
          </View>
        </View>

        {/* Visual Progress Bar */}
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${goalTelemetry.progressPercent}%`,
                backgroundColor:
                  goalMode === 'gain'
                    ? theme.protein
                    : goalMode === 'loss'
                    ? theme.primary
                    : theme.primaryDark,
              },
            ]}
          />
        </View>
        <Text style={styles.progressHintText}>
          {`Hedefe %${goalTelemetry.progressPercent} yaklaşıldı • ${goalTelemetry.hintText}`}
        </Text>
      </View>

      {/* Target Macros & Nutrition Plan */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>⚡ Klinik Metabolizma & BMR Telemetrisi</Text>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Günlük Kalori Hedefi</Text>
          <Text style={[styles.rowValue, { color: theme.primary, fontSize: 18 }]}>
            {userProfile.targetCalories} kcal
          </Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Klinik BMR Formülü</Text>
          <Text style={[styles.rowValue, { color: theme.primary }]}>
            {userProfile.bmrFormulaUsed === 'mifflin_st_jeor'
              ? 'Mifflin-St Jeor (BMI > 30)'
              : 'Revised Harris-Benedict (BMI ≤ 30)'}
          </Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Hesaplama Dayanağı</Text>
          <Text style={styles.rowValue}>
            {userProfile.calculationBasis === 'ideal'
              ? '🎯 İdeal Kilo Bazlı'
              : '⚖️ Mevcut Kilo Bazlı'}
          </Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.rowLabel}>BMR (Bazal Metabolizma)</Text>
          <Text style={styles.rowValue}>{userProfile.bmr} kcal</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.rowLabel}>TDEE (Toplam Harcama)</Text>
          <Text style={styles.rowValue}>{userProfile.tdee} kcal</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Spor & Egzersiz Rutini</Text>
          <Text style={styles.rowValue}>
            {userProfile.doesSports
              ? `🏃 Haftada ${userProfile.sportsDaysPerWeek || 3} Gün`
              : '🚶 Düzenli Spor Yok'}
          </Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Kronik Sağlık Durumu</Text>
          <View style={styles.clinicalTagsContainer}>
            {userProfile.hasDiabetes && (
              <View
                style={[
                  styles.conditionTag,
                  { backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2' },
                ]}
              >
                <Text style={[styles.conditionTagText, { color: theme.danger }]}>
                  🩸 Diyabet
                </Text>
              </View>
            )}
            {userProfile.hasCholesterol && (
              <View
                style={[
                  styles.conditionTag,
                  { backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7' },
                ]}
              >
                <Text style={[styles.conditionTagText, { color: theme.calories }]}>
                  🫀 Kolesterol
                </Text>
              </View>
            )}
            {userProfile.hasHypertension && (
              <View
                style={[
                  styles.conditionTag,
                  { backgroundColor: isDarkMode ? 'rgba(168, 85, 247, 0.2)' : '#F3E8FF' },
                ]}
              >
                <Text style={[styles.conditionTagText, { color: '#9333EA' }]}>
                  🩺 Hipertansiyon
                </Text>
              </View>
            )}
            {!userProfile.hasDiabetes &&
              !userProfile.hasCholesterol &&
              !userProfile.hasHypertension && (
                <Text style={[styles.rowValue, { color: theme.textMuted }]}>
                  Kronik risk faktörü yok
                </Text>
              )}
          </View>
        </View>
        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Aktivite Seviyesi</Text>
          <Text style={styles.rowValue}>{getActivityLabel(userProfile.activityLevel)}</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Birincil Hedef</Text>
          <Text style={[styles.rowValue, { color: theme.primary }]}>
            {getGoalLabel(userProfile.dietaryGoal)}
          </Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Günlük Öğün & Saat Aralığı</Text>
          <Text style={styles.rowValue}>
            🍽️ {userProfile.dailyMealsCount || 3} Öğün ({userProfile.firstMealTime || '09:00'} –{' '}
            {userProfile.lastMealTime || '19:00'})
          </Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Hafta Sonu Esnekliği</Text>
          <Text style={styles.rowValue}>
            {userProfile.weekendFlexibility !== false
              ? '😋 Cumartesi & Pazar Aktif'
              : 'Standart Sabit Plan'}
          </Text>
        </View>

        {/* Macro Distribution Pills */}
        <View style={styles.macroRow}>
          <View
            style={[
              styles.macroPill,
              { backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : Colors.proteinLight },
            ]}
          >
            <Text style={[styles.macroPillText, { color: theme.protein }]}>
              🥩 Protein: {userProfile.targetProteinGrams}g
            </Text>
          </View>
          <View
            style={[
              styles.macroPill,
              { backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.2)' : Colors.carbsLight },
            ]}
          >
            <Text style={[styles.macroPillText, { color: theme.calories }]}>
              🌾 Karb: {userProfile.targetCarbsGrams}g
            </Text>
          </View>
          <View
            style={[
              styles.macroPill,
              { backgroundColor: isDarkMode ? 'rgba(236, 72, 153, 0.2)' : Colors.fatLight },
            ]}
          >
            <Text style={[styles.macroPillText, { color: theme.fat }]}>
              🥑 Yağ: {userProfile.targetFatGrams}g
            </Text>
          </View>
          <View
            style={[
              styles.macroPill,
              { backgroundColor: isDarkMode ? 'rgba(6, 182, 212, 0.2)' : Colors.waterLight },
            ]}
          >
            <Text style={[styles.macroPillText, { color: theme.water }]}>
              💧 Su: {userProfile.waterGoalMl}ml
            </Text>
          </View>
        </View>
      </View>

      {/* Allergies & Dietary Preferences */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.sectionTitle}>🌿 Besin Alerjileri & Hassasiyetler</Text>
          <TouchableOpacity onPress={() => setIsEditing(true)}>
            <Text style={styles.editLinkText}>Düzenle</Text>
          </TouchableOpacity>
        </View>

        {userProfile.allergies && userProfile.allergies.length > 0 ? (
          <View style={styles.allergyChipsContainer}>
            {userProfile.allergies.map((allergy, index) => (
              <View key={`allergy-${index}`} style={styles.allergyChip}>
                <Text style={styles.allergyChipText}>{allergy}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.noAllergyBox}>
            <Text style={styles.noAllergyText}>
              ✨ Kayıtlı besin hassasiyeti bulunmuyor. DiyetAI tüm gıda gruplarını güvenli kabul eder.
            </Text>
          </View>
        )}
      </View>

      {/* Developer & Architecture Settings */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>⚙️ Geliştirici, Güvenlik & API Ayarları</Text>

        {/* Active Telemetry Status Banner */}
        <View
          style={[
            styles.telemetryBanner,
            {
              backgroundColor: useMockData
                ? isDarkMode
                  ? 'rgba(245, 158, 11, 0.15)'
                  : '#FEF3C7'
                : isDarkMode
                ? 'rgba(16, 185, 129, 0.15)'
                : '#D1FAE5',
              borderColor: useMockData ? theme.calories : theme.primary,
            },
          ]}
        >
          <Text
            style={[
              styles.telemetryBannerTitle,
              { color: useMockData ? (isDarkMode ? '#FCD34D' : '#B45309') : theme.primary },
            ]}
          >
            {useMockData
              ? '🟡 Aktif Mod: Yerel Mock JSON Motoru'
              : '🟢 Aktif Mod: Canlı FastAPI & Gemini Backend'}
          </Text>
          <Text
            style={[
              styles.telemetryBannerDesc,
              {
                color: useMockData
                  ? isDarkMode
                    ? '#FDE68A'
                    : '#92400E'
                  : isDarkMode
                  ? '#6EE7B7'
                  : Colors.primaryDark,
              },
            ]}
          >
            {useMockData
              ? 'Backend kapalı olsa bile kamera analizi ve sohbet çevrimdışı çalışır.'
              : `Endpoint: ${apiConfig.baseUrl} (${
                  apiConfig.isHttps ? '🔒 HTTPS Şifreli' : '🛠️ Geliştirme Modu'
                })`}
          </Text>
          <Text
            style={[
              styles.telemetryBannerDesc,
              {
                marginTop: 4,
                color: useMockData
                  ? isDarkMode
                    ? '#FDE68A'
                    : '#92400E'
                  : isDarkMode
                  ? '#6EE7B7'
                  : Colors.primaryDark,
              },
            ]}
          >
            {`🛡️ JWT Depolama: ${
              apiConfig.isSecureStoreActive
                ? 'Expo SecureStore (Keychain / Keystore)'
                : 'Expo Web Güvenli Geri Dönüş'
            } • Üretim HTTPS Zorunluluğu Aktif`}
          </Text>
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1, paddingRight: Spacing.md }}>
            <Text style={styles.rowLabel}>Sahte Veri Modu (Mock Data)</Text>
            <Text style={styles.rowDesc}>
              Açıkken backend servisleri aranmaz; deterministik test verileri kullanılır.
            </Text>
          </View>
          <Switch
            value={useMockData}
            onValueChange={setUseMockData}
            trackColor={{ false: theme.border, true: theme.primaryLight }}
            thumbColor={useMockData ? theme.primary : '#f4f3f4'}
          />
        </View>

        <View style={styles.divider} />

        <TouchableOpacity
          style={[styles.editProfileButton, { marginBottom: Spacing.sm }]}
          onPress={() => setHasCompletedOnboarding(false)}
          activeOpacity={0.8}
        >
          <Text style={styles.editProfileButtonText}>
            🪄 İlk Açılış Karşılama Sihirbazını Test Et
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resetButton} onPress={handleResetDay} activeOpacity={0.8}>
          <Text style={styles.resetButtonText}>🗑️ Bugünkü Kayıtları Sıfırla (Güvenli)</Text>
        </TouchableOpacity>
      </View>

      {/* App Version & Credits Footer */}
      <View style={styles.footerContainer}>
        <Text style={styles.footerBrand}>DietAI Mobile • v1.0.0 (Expo SDK 52)</Text>
        <Text style={styles.footerSub}>Mifflin-St Jeor & Gemini Flash Hibrit Beslenme Motoru</Text>
        <Text style={styles.footerCredits}>Bertan Beyal • Bitirme Tezi Projesi</Text>
      </View>
    </ScrollView>
  );
};

const createStyles = (theme: ThemeColors, isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      padding: Spacing.lg,
      paddingBottom: Spacing.xxxl,
      backgroundColor: theme.background,
    },
    editHeaderBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      backgroundColor: theme.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    backButton: {
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.sm,
    },
    backButtonText: {
      ...Typography.bodyBold,
      color: theme.primary,
    },
    editHeaderTitle: {
      ...Typography.h3,
      color: theme.textPrimary,
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
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.md,
      flexWrap: 'wrap',
      gap: Spacing.xs,
    },
    avatarLarge: {
      width: 56,
      height: 56,
      borderRadius: BorderRadius.full,
      backgroundColor: theme.primaryMuted,
      borderWidth: 2,
      borderColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      ...Typography.h3,
      color: isDarkMode ? theme.primary : Colors.primaryDark,
    },
    profileTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      marginBottom: Spacing.md,
    },
    profileIdentityCol: {
      flex: 1,
    },
    name: {
      ...Typography.h2,
      color: theme.textPrimary,
    },
    role: {
      ...Typography.caption,
      color: theme.textMuted,
      marginTop: 2,
    },
    compactStatsStrip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surfaceSubtle,
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing.sm + 2,
      paddingHorizontal: Spacing.sm,
      borderWidth: 1,
      borderColor: theme.border,
    },
    compactStatItem: {
      flex: 1,
      alignItems: 'center',
    },
    compactStatLabel: {
      ...Typography.tiny,
      color: theme.textMuted,
      fontWeight: '600',
    },
    compactStatValue: {
      ...Typography.bodyBold,
      color: theme.textPrimary,
      marginTop: 2,
    },
    compactStatDivider: {
      width: 1,
      height: 28,
      backgroundColor: theme.border,
    },
    weeklyCardSub: {
      ...Typography.caption,
      color: theme.textMuted,
      lineHeight: 18,
      marginTop: 2,
    },
    weeklyCheckInBox: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.surfaceSubtle,
      padding: Spacing.sm,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      gap: Spacing.sm,
    },
    weeklyStepperGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flex: 1,
    },
    weeklyStepBtn: {
      paddingHorizontal: 10,
      height: 38,
      borderRadius: BorderRadius.md,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    weeklyStepBtnText: {
      ...Typography.captionBold,
      color: theme.textPrimary,
    },
    weeklyInputWrapper: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'center',
      flex: 1,
    },
    weeklyWeightInput: {
      ...Typography.h3,
      fontSize: 22,
      lineHeight: 28,
      color: theme.textPrimary,
      textAlign: 'center',
      minWidth: 54,
      paddingVertical: 0,
    },
    weeklyWeightUnit: {
      ...Typography.captionBold,
      color: theme.textMuted,
      marginLeft: 3,
    },
    weeklySaveBtn: {
      backgroundColor: isDarkMode ? theme.primary : '#0F172A',
      paddingHorizontal: Spacing.md,
      height: 38,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    weeklySaveBtnText: {
      ...Typography.captionBold,
      color: '#FFFFFF',
    },
    adaptiveReviewBox: {
      marginTop: Spacing.md,
      padding: Spacing.md,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
    },
    adaptiveBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    adaptiveBadgeText: {
      ...Typography.tiny,
      fontWeight: '800',
      letterSpacing: 0.3,
    },
    adaptiveTitle: {
      ...Typography.bodyBold,
      color: theme.textPrimary,
      marginBottom: 4,
    },
    adaptiveDesc: {
      ...Typography.caption,
      color: theme.textSecondary,
      lineHeight: 18,
    },
    adaptiveActionBtn: {
      marginTop: Spacing.sm + 2,
      paddingVertical: Spacing.sm + 2,
      paddingHorizontal: Spacing.md,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
    },
    adaptiveActionBtnText: {
      ...Typography.captionBold,
      color: '#FFFFFF',
    },
    calibratedDoneTag: {
      marginTop: Spacing.sm,
      paddingTop: Spacing.xs,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    calibratedDoneText: {
      ...Typography.tiny,
      fontWeight: '700',
    },
    weeklyHistorySection: {
      marginTop: Spacing.md,
      paddingTop: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    weeklyHistoryHeader: {
      ...Typography.tiny,
      fontWeight: '800',
      color: theme.textMuted,
      letterSpacing: 0.6,
      marginBottom: Spacing.xs,
    },
    weeklyHistoryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 6,
    },
    weeklyHistoryWeek: {
      ...Typography.captionBold,
      color: theme.textPrimary,
    },
    weeklyHistoryDate: {
      ...Typography.tiny,
      color: theme.textMuted,
    },
    weeklyHistoryRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    weeklyHistoryWeight: {
      ...Typography.bodyBold,
      color: theme.textPrimary,
    },
    weeklyDeltaPill: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: BorderRadius.full,
      minWidth: 56,
      alignItems: 'center',
    },
    weeklyDeltaPillText: {
      ...Typography.tiny,
      fontWeight: '800',
    },
    clinicalTagsContainer: {
      flex: 1,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.xs,
      justifyContent: 'flex-end',
    },
    conditionTag: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: 3,
      borderRadius: BorderRadius.xs,
    },
    conditionTagText: {
      ...Typography.tiny,
      fontWeight: '700',
    },
    editProfileButton: {
      marginTop: Spacing.md,
      backgroundColor: theme.surfaceSubtle,
      borderWidth: 1,
      borderColor: theme.border,
      paddingVertical: Spacing.sm + 2,
      paddingHorizontal: Spacing.lg,
      borderRadius: BorderRadius.full,
      alignItems: 'center',
      width: '100%',
    },
    editProfileButtonText: {
      ...Typography.captionBold,
      color: isDarkMode ? theme.primary : Colors.primaryDark,
    },
    sectionTitle: {
      ...Typography.h3,
      color: theme.textPrimary,
      marginBottom: Spacing.xs,
      flexShrink: 1,
    },
    editLinkText: {
      ...Typography.captionBold,
      color: isDarkMode ? theme.primary : Colors.primaryDark,
    },
    paceBadge: {
      backgroundColor: isDarkMode ? theme.primaryMuted : Colors.primaryLight,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 3,
      borderRadius: BorderRadius.full,
    },
    paceBadgeText: {
      ...Typography.tiny,
      color: isDarkMode ? theme.primary : Colors.primaryDark,
      fontWeight: '700',
    },
    weightProgressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: Spacing.sm,
    },
    weightBox: {
      flex: 1,
      padding: Spacing.md,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      backgroundColor: theme.surface,
    },
    weightBoxLabel: {
      ...Typography.tiny,
      color: theme.textMuted,
      fontWeight: '600',
      marginBottom: 2,
    },
    weightBoxValue: {
      ...Typography.h3,
      color: theme.textPrimary,
    },
    weightArrowContainer: {
      alignItems: 'center',
      paddingHorizontal: Spacing.sm,
    },
    weightArrowIcon: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    weightDeltaText: {
      ...Typography.tiny,
      color: theme.textMuted,
      fontWeight: '600',
      marginTop: 2,
    },
    progressBarTrack: {
      height: 8,
      backgroundColor: theme.border,
      borderRadius: BorderRadius.full,
      marginTop: Spacing.md,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      borderRadius: BorderRadius.full,
    },
    progressHintText: {
      ...Typography.tiny,
      color: theme.textMuted,
      marginTop: Spacing.xs,
      textAlign: 'center',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Spacing.xs,
      gap: Spacing.sm,
    },
    rowLabel: {
      ...Typography.bodyBold,
      color: theme.textSecondary,
      flexShrink: 0,
      maxWidth: '46%',
    },
    rowDesc: {
      ...Typography.caption,
      color: theme.textMuted,
      marginTop: 2,
    },
    rowValue: {
      ...Typography.bodyBold,
      color: theme.textPrimary,
      flex: 1,
      flexShrink: 1,
      textAlign: 'right',
    },
    divider: {
      height: 1,
      backgroundColor: theme.border,
      marginVertical: Spacing.sm,
    },
    macroRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.xs,
      marginTop: Spacing.md,
      paddingTop: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    macroPill: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: 5,
      borderRadius: BorderRadius.xs,
    },
    macroPillText: {
      ...Typography.tiny,
      fontWeight: '700',
    },
    allergyChipsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
      marginTop: Spacing.xs,
    },
    allergyChip: {
      backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7',
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(245, 158, 11, 0.35)' : '#FDE68A',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.full,
    },
    allergyChipText: {
      ...Typography.captionBold,
      color: isDarkMode ? '#FCD34D' : '#92400E',
    },
    noAllergyBox: {
      padding: Spacing.md,
      backgroundColor: theme.surfaceSubtle,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: theme.border,
      marginTop: Spacing.xs,
    },
    noAllergyText: {
      ...Typography.caption,
      color: theme.textMuted,
      lineHeight: 18,
    },
    telemetryBanner: {
      padding: Spacing.md,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      marginBottom: Spacing.md,
    },
    telemetryBannerTitle: {
      ...Typography.captionBold,
      marginBottom: 2,
    },
    telemetryBannerDesc: {
      ...Typography.tiny,
      lineHeight: 16,
    },
    resetButton: {
      backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(239, 68, 68, 0.3)' : '#FCA5A5',
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.lg,
      alignItems: 'center',
      marginTop: Spacing.sm,
    },
    resetButtonText: {
      ...Typography.captionBold,
      color: theme.danger,
    },
    footerContainer: {
      alignItems: 'center',
      paddingVertical: Spacing.lg,
      marginTop: Spacing.xs,
    },
    footerBrand: {
      ...Typography.captionBold,
      color: theme.textSecondary,
    },
    footerSub: {
      ...Typography.tiny,
      color: theme.textMuted,
      marginTop: 2,
    },
    footerCredits: {
      ...Typography.tiny,
      color: theme.textMuted,
      marginTop: 4,
    },
  });
