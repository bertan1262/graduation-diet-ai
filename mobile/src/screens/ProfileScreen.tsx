import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Colors, getThemeColors, ThemeColors } from '../constants/colors';
import { Spacing, BorderRadius, Typography, Shadows } from '../constants/theme';
import { useDietStore } from '../store/useDietStore';
import { OnboardingScreen } from './OnboardingScreen';

export const ProfileScreen: React.FC = () => {
  const { userProfile, useMockData, setUseMockData, resetDay, isDarkMode, toggleDarkMode } = useDietStore();
  const theme = getThemeColors(isDarkMode);
  const styles = useMemo(() => createStyles(theme, isDarkMode), [isDarkMode]);
  const [isEditing, setIsEditing] = useState(false);

  // BMI (Body Mass Index) Calculation
  const bmiData = useMemo(() => {
    const heightInMeters = userProfile.heightCm / 100;
    if (heightInMeters <= 0) return { bmi: 22.0, label: 'Normal Kilo', color: theme.primary };

    const bmi = userProfile.weightKg / (heightInMeters * heightInMeters);
    const roundedBmi = Math.round(bmi * 10) / 10;

    if (bmi < 18.5) {
      return { bmi: roundedBmi, label: 'Düşük Kilo (< 18.5)', color: '#3B82F6' };
    } else if (bmi < 25) {
      return { bmi: roundedBmi, label: 'Normal & İdeal Kilo (18.5 - 24.9)', color: theme.primary };
    } else if (bmi < 30) {
      return { bmi: roundedBmi, label: 'Hafif Kilolu (25.0 - 29.9)', color: '#F59E0B' };
    } else {
      return { bmi: roundedBmi, label: 'Obezite Sınırı (≥ 30)', color: theme.danger };
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

    switch (goalMode) {
      case 'loss': {
        const progressPercent = calcProgress();
        return {
          paceBadge: 'Haftalık -0.5 kg (Yağ Yakımı)',
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
          paceBadge: 'Haftalık +0.3 kg (Kas Kütlesi)',
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
  }, [goalMode, weightDeltaKg, theme]);

  const getGoalLabel = (goal: string) => {
    switch (goal) {
      case 'weight_loss':
        return '🔥 Kilo Verme & Yağ Yakımı (-500 kcal)';
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
        return 'Az Hareketli (1-3 gün spor)';
      case 'moderate':
        return 'Orta Düzey (3-5 gün spor)';
      case 'active':
        return 'Çok Hareketli (6-7 gün spor)';
      case 'very_active':
        return 'Ekstra Aktif (Ağır antrenman)';
      default:
        return 'Orta Düzey';
    }
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
      {/* Profile Header Card */}
      <View style={styles.card}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarText}>
            {userProfile.name
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </Text>
        </View>
        <Text style={styles.name}>{userProfile.name}</Text>
        <Text style={styles.role}>
          {userProfile.gender === 'male' ? '👨 Erkek' : '👩 Kadın'} • {userProfile.age} Yaş •{' '}
          {userProfile.heightCm} cm • {userProfile.weightKg} kg
        </Text>

        {/* BMI Badge */}
        <View style={[styles.bmiBadge, { borderColor: bmiData.color }]}>
          <Text style={[styles.bmiText, { color: bmiData.color }]}>
            BMI: {bmiData.bmi} kg/m² • {bmiData.label}
          </Text>
        </View>

        {/* Clinical Formula & Basis Badge */}
        <View style={styles.clinicalHeaderBadge}>
          <Text style={styles.clinicalHeaderBadgeTitle}>
            🧬 {userProfile.bmrFormulaUsed === 'mifflin_st_jeor' ? 'Klinik Motor: Mifflin-St Jeor (BMI > 30)' : 'Klinik Motor: Revised Harris-Benedict (BMI ≤ 30)'}
          </Text>
          <Text style={styles.clinicalHeaderBadgeSub}>
            🎯 Yaşa Göre İdeal Kilo: {userProfile.idealWeightKg || Math.round(22 * Math.pow(userProfile.heightCm / 100, 2) * 10) / 10} kg • Baz: {userProfile.calculationBasis === 'ideal' ? 'İdeal Kilo' : 'Mevcut Kilo'}
          </Text>
        </View>

        {/* Edit / Recalculate CTA Button */}
        <TouchableOpacity
          style={styles.editProfileButton}
          onPress={() => setIsEditing(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.editProfileButtonText}>✏️ Hedefleri & BMR'ı Yeniden Hesapla</Text>
        </TouchableOpacity>
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

          <View style={[styles.weightBox, { borderColor: theme.primaryLight, backgroundColor: theme.surfaceSubtle }]}>
            <Text style={[styles.weightBoxLabel, { color: theme.primary }]}>Hedef Kilo</Text>
            <Text style={[styles.weightBoxValue, { color: theme.primary }]}>{targetWeight} kg</Text>
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
            {userProfile.calculationBasis === 'ideal' ? '🎯 İdeal Kilo Bazlı' : '⚖️ Mevcut Kilo Bazlı'}
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
              <View style={[styles.conditionTag, { backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2' }]}>
                <Text style={[styles.conditionTagText, { color: theme.danger }]}>🩸 Diyabet</Text>
              </View>
            )}
            {userProfile.hasCholesterol && (
              <View style={[styles.conditionTag, { backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7' }]}>
                <Text style={[styles.conditionTagText, { color: theme.calories }]}>🫀 Kolesterol</Text>
              </View>
            )}
            {userProfile.hasHypertension && (
              <View style={[styles.conditionTag, { backgroundColor: isDarkMode ? 'rgba(168, 85, 247, 0.2)' : '#F3E8FF' }]}>
                <Text style={[styles.conditionTagText, { color: '#9333EA' }]}>🩺 Hipertansiyon</Text>
              </View>
            )}
            {!userProfile.hasDiabetes && !userProfile.hasCholesterol && !userProfile.hasHypertension && (
              <Text style={[styles.rowValue, { color: theme.textMuted }]}>Kronik risk faktörü yok</Text>
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

        {/* Macro Distribution Pills */}
        <View style={styles.macroRow}>
          <View style={[styles.macroPill, { backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : Colors.proteinLight }]}>
            <Text style={[styles.macroPillText, { color: theme.protein }]}>
              🥩 Protein: {userProfile.targetProteinGrams}g
            </Text>
          </View>
          <View style={[styles.macroPill, { backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.2)' : Colors.carbsLight }]}>
            <Text style={[styles.macroPillText, { color: theme.calories }]}>
              🌾 Karb: {userProfile.targetCarbsGrams}g
            </Text>
          </View>
          <View style={[styles.macroPill, { backgroundColor: isDarkMode ? 'rgba(236, 72, 153, 0.2)' : Colors.fatLight }]}>
            <Text style={[styles.macroPillText, { color: theme.fat }]}>
              🥑 Yağ: {userProfile.targetFatGrams}g
            </Text>
          </View>
          <View style={[styles.macroPill, { backgroundColor: isDarkMode ? 'rgba(6, 182, 212, 0.2)' : Colors.waterLight }]}>
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

      {/* Theme & Display Settings */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>🎨 Görünüm & Tema</Text>

        <View style={styles.row}>
          <View style={{ flex: 1, paddingRight: Spacing.md }}>
            <Text style={styles.rowLabel}>Karanlık Mod (Dark Mode)</Text>
            <Text style={styles.rowDesc}>
              {isDarkMode
                ? 'Aktif: Gece kullanımı için derin siyah OLED teması.'
                : 'Pasif: Standart aydınlık görünüm.'}
            </Text>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={toggleDarkMode}
            trackColor={{ false: theme.border, true: theme.primaryLight }}
            thumbColor={isDarkMode ? theme.primary : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Developer & Architecture Settings */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>⚙️ Geliştirici & API Ayarları</Text>

        {/* Active Telemetry Status Banner */}
        <View
          style={[
            styles.telemetryBanner,
            {
              backgroundColor: useMockData ? (isDarkMode ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7') : (isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#D1FAE5'),
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
              { color: useMockData ? (isDarkMode ? '#FDE68A' : '#92400E') : (isDarkMode ? '#6EE7B7' : Colors.primaryDark) },
            ]}
          >
            {useMockData
              ? 'Backend kapalı olsa bile kamera analizi ve sohbet çevrimdışı çalışır.'
              : 'Endpoint: http://192.168.1.X:8000/api/v1 (Canlı Model & PostgreSQL)'}
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
    },
    avatarLarge: {
      width: 68,
      height: 68,
      borderRadius: BorderRadius.full,
      backgroundColor: theme.primaryMuted,
      borderWidth: 2.5,
      borderColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      marginBottom: Spacing.md,
    },
    avatarText: {
      ...Typography.h2,
      color: isDarkMode ? theme.primary : Colors.primaryDark,
    },
    name: {
      ...Typography.h2,
      color: theme.textPrimary,
      textAlign: 'center',
    },
    role: {
      ...Typography.caption,
      color: theme.textMuted,
      textAlign: 'center',
      marginTop: 2,
    },
    bmiBadge: {
      marginTop: Spacing.sm,
      paddingVertical: 4,
      paddingHorizontal: Spacing.md,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      alignSelf: 'center',
      backgroundColor: theme.surfaceSubtle,
    },
    bmiText: {
      ...Typography.tiny,
      fontWeight: '700',
    },
    clinicalHeaderBadge: {
      marginTop: Spacing.sm,
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.md,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0',
      backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5',
      alignItems: 'center',
    },
    clinicalHeaderBadgeTitle: {
      ...Typography.tiny,
      fontWeight: '700',
      color: isDarkMode ? theme.primary : Colors.primaryDark,
    },
    clinicalHeaderBadgeSub: {
      ...Typography.tiny,
      color: theme.textSecondary,
      marginTop: 2,
    },
    clinicalTagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.xs,
      justifyContent: 'flex-end',
      maxWidth: '60%',
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
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderRadius: BorderRadius.full,
      alignSelf: 'center',
    },
    editProfileButtonText: {
      ...Typography.captionBold,
      color: isDarkMode ? theme.primary : Colors.primaryDark,
    },
    sectionTitle: {
      ...Typography.h3,
      color: theme.textPrimary,
      marginBottom: Spacing.xs,
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
    },
    rowLabel: {
      ...Typography.bodyBold,
      color: theme.textSecondary,
    },
    rowDesc: {
      ...Typography.caption,
      color: theme.textMuted,
      marginTop: 2,
    },
    rowValue: {
      ...Typography.bodyBold,
      color: theme.textPrimary,
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
