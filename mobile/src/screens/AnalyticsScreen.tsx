import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Share,
  Alert,
} from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Colors, getThemeColors, ThemeColors } from '../constants/colors';
import { Spacing, BorderRadius, Typography, Shadows } from '../constants/theme';
import { useDietStore } from '../store/useDietStore';
import {
  getLocalIsoDate,
  formatTurkishShortDate,
  formatTurkishWeekdayShort,
  useLiveToday,
} from '../utils/dateUtils';

const BAR_CHART_HEIGHT = 160;

interface DayHistoryItem {
  dayLabel: string;
  dateStr: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  waterMl: number;
  isToday?: boolean;
  hasData?: boolean;
}

export const AnalyticsScreen: React.FC = () => {
  const userProfile = useDietStore((state) => state.userProfile);
  const todayMeals = useDietStore((state) => state.todayMeals);
  const waterIntakeMl = useDietStore((state) => state.waterIntakeMl);
  const isDarkMode = useDietStore((state) => state.isDarkMode);
  const dailyHistory = useDietStore((state) => state.dailyHistory);
  const { todayDate } = useLiveToday();

  const { width: screenWidth } = useWindowDimensions();
  const chartWidth = Math.max(240, screenWidth - Spacing.lg * 2 - Spacing.xl * 2);

  const theme = getThemeColors(isDarkMode);
  const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);

  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(6); // Default to today

  // Build reactive 7-day dataset with real calendar dates and current day dynamically linked to todayMeals
  const weeklyData: DayHistoryItem[] = useMemo(() => {
    const todayCalories = todayMeals.reduce((acc, m) => acc + m.calories, 0);
    const todayProtein = Math.round(todayMeals.reduce((acc, m) => acc + m.proteinGrams, 0));
    const todayCarbs = Math.round(todayMeals.reduce((acc, m) => acc + m.carbsGrams, 0));
    const todayFat = Math.round(todayMeals.reduce((acc, m) => acc + m.fatGrams, 0));

    const pastDays: DayHistoryItem[] = [];
    for (let daysAgo = 6; daysAgo >= 1; daysAgo--) {
      const d = new Date(
        todayDate.getFullYear(),
        todayDate.getMonth(),
        todayDate.getDate() - daysAgo,
        12,
        0,
        0
      );
      const isoDate = getLocalIsoDate(d);
      const recorded = dailyHistory && dailyHistory[isoDate];

      if (recorded) {
        pastDays.push({
          dayLabel: formatTurkishWeekdayShort(d),
          dateStr: formatTurkishShortDate(d),
          calories: recorded.calories,
          protein: recorded.proteinGrams,
          carbs: recorded.carbsGrams,
          fat: recorded.fatGrams,
          waterMl: recorded.waterMl,
          hasData: true,
        });
      } else {
        pastDays.push({
          dayLabel: formatTurkishWeekdayShort(d),
          dateStr: formatTurkishShortDate(d),
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          waterMl: 0,
          hasData: false,
        });
      }
    }

    return [
      ...pastDays,
      {
        dayLabel: 'Bugün',
        dateStr: formatTurkishShortDate(todayDate),
        calories: todayCalories,
        protein: todayProtein,
        carbs: todayCarbs,
        fat: todayFat,
        waterMl: waterIntakeMl,
        isToday: true,
        hasData: true,
      },
    ];
  }, [todayMeals, waterIntakeMl, dailyHistory, todayDate]);

  const selectedDay = weeklyData[selectedDayIndex] || weeklyData[6];

  // Weekly aggregates
  const daysWithData = weeklyData.filter((d) => d.hasData !== false);
  const dataCount = daysWithData.length || 1;
  const avgCalories = Math.round(
    daysWithData.reduce((acc, d) => acc + d.calories, 0) / dataCount
  );
  const targetCal = userProfile.targetCalories || 2100;
  const adherenceRate = Math.min(
    100,
    Math.round(
      (daysWithData.filter((d) => Math.abs(d.calories - targetCal) <= 250).length /
        dataCount) *
        100
    )
  );
  const waterGoal = userProfile.waterGoalMl || 2500;
  const waterDisciplineCount = daysWithData.filter((d) => d.waterMl >= waterGoal * 0.8).length;

  // Macro percentages for selected day
  const totalMacroGrams = selectedDay.protein + selectedDay.carbs + selectedDay.fat;
  const proteinPercent =
    totalMacroGrams > 0 ? Math.round((selectedDay.protein / totalMacroGrams) * 100) : 30;
  const carbsPercent =
    totalMacroGrams > 0 ? Math.round((selectedDay.carbs / totalMacroGrams) * 100) : 45;
  const fatPercent =
    totalMacroGrams > 0 ? Math.round((selectedDay.fat / totalMacroGrams) * 100) : 25;

  // Max value for bar chart scaling
  const maxCal = Math.max(...weeklyData.map((d) => d.calories), targetCal * 1.15, 100);
  const chartHeightInner = BAR_CHART_HEIGHT - 35;

  // PDF Export / Share Simulation
  const handleExportReport = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    try {
      const summaryText =
        `📋 DietAI Haftalık Klinik Beslenme Raporu\n` +
        `👤 Kullanıcı: ${userProfile.name} (${userProfile.age} Yaş, ${userProfile.weightKg} kg)\n` +
        `🎯 Hedef: ${
          userProfile.dietaryGoal === 'weight_loss'
            ? 'Kilo Verme'
            : userProfile.dietaryGoal === 'muscle_gain'
            ? 'Kas Kazanımı'
            : 'Form Koruma'
        }\n` +
        `🔥 Günlük Hedef Kalori: ${userProfile.targetCalories} kcal (7 Günlük Ort: ${avgCalories} kcal)\n` +
        `🥩 Hedef Protein: ${userProfile.targetProteinGrams}g | Karb: ${userProfile.targetCarbsGrams}g | Yağ: ${userProfile.targetFatGrams}g\n` +
        `💧 Su Hedefi: ${userProfile.waterGoalMl} ml (Disiplin: ${waterDisciplineCount}/7 gün)\n` +
        `🧬 Hesaplama Motoru: ${
          userProfile.bmrFormulaUsed === 'mifflin_st_jeor'
            ? 'Mifflin-St Jeor'
            : 'Revised Harris-Benedict'
        }\n\n` +
        `Bu rapor DietAI Mobil Uygulaması tarafından üretilmiştir.`;

      await Share.share({
        message: summaryText,
        title: 'DietAI Beslenme Raporu',
      });
    } catch {
      Alert.alert('Bilgi', 'Rapor dışa aktarılamadı.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Motivational Weekly Adherence Hero Card */}
      <View style={[styles.adherenceHeroCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.adherenceHeroTop}>
          <View style={{ flex: 1 }}>
            <View style={styles.adherenceBadgeRow}>
              <Text
                style={[
                  styles.adherenceBadge,
                  {
                    color: theme.primary,
                    backgroundColor: isDarkMode ? theme.primaryMuted : Colors.primaryLight,
                  },
                ]}
              >
                🎯 HAFTALIK KALORİ UYUMU
              </Text>
            </View>
            <Text style={[styles.adherenceScoreValue, { color: theme.textPrimary }]}>
              %{adherenceRate}{' '}
              <Text style={[styles.adherenceScoreSubtitle, { color: theme.primary }]}>
                {adherenceRate >= 85
                  ? '• Mükemmel Denge 🌟'
                  : adherenceRate >= 65
                  ? '• İyi İlerleme 🔥'
                  : '• Gelişiyor ⚡'}
              </Text>
            </Text>
          </View>
          <View
            style={[
              styles.adherenceRingMini,
              {
                borderColor: theme.primary,
                backgroundColor: isDarkMode ? theme.primaryMuted : Colors.primaryLight,
              },
            ]}
          >
            <Text style={styles.adherenceRingEmoji}>{adherenceRate >= 80 ? '🏆' : '📈'}</Text>
          </View>
        </View>

        {/* Adherence Progress Track */}
        <View style={[styles.adherenceTrack, { backgroundColor: theme.surfaceSubtle }]}>
          <View
            style={[
              styles.adherenceFill,
              { width: `${adherenceRate}%`, backgroundColor: theme.primary },
            ]}
          />
        </View>

        <Text style={[styles.adherenceMotivationText, { color: theme.textSecondary }]}>
          {adherenceRate >= 85
            ? 'Son 7 günde kalori ve makro hedefinizi istikrarla korudunuz. Metabolizmanız hedefinize hızla adapte oluyor!'
            : adherenceRate >= 65
            ? 'Hedef kalorinize oldukça yakınsınız. Öğünler arası porsiyon dengesiyle uyum skorunuzu zirveye taşıyabilirsiniz.'
            : 'Haftalık hedeflerinize ulaşmak için ana öğünlerde porsiyon kontrolünü elden bırakmayın.'}
        </Text>
      </View>

      {/* KPI Highlight Cards */}
      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiEmoji}>🔥</Text>
          <Text style={styles.kpiValue}>{avgCalories}</Text>
          <Text style={styles.kpiLabel}>Haftalık Ort. Kalori</Text>
          <View style={styles.kpiBadge}>
            <Text style={styles.kpiBadgeText}>Hedef: {targetCal}</Text>
          </View>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiEmoji}>🎯</Text>
          <Text style={[styles.kpiValue, { color: theme.primary }]}>%{adherenceRate}</Text>
          <Text style={styles.kpiLabel}>Hedef Uyumu</Text>
          <View
            style={[
              styles.kpiBadge,
              { backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5' },
            ]}
          >
            <Text style={[styles.kpiBadgeText, { color: theme.primary }]}>Dengeli İlerleme</Text>
          </View>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiEmoji}>💧</Text>
          <Text style={[styles.kpiValue, { color: theme.water }]}>{waterDisciplineCount}/7</Text>
          <Text style={styles.kpiLabel}>Su Disiplini</Text>
          <View
            style={[
              styles.kpiBadge,
              { backgroundColor: isDarkMode ? 'rgba(6, 182, 212, 0.2)' : '#CFFAFE' },
            ]}
          >
            <Text style={[styles.kpiBadgeText, { color: theme.water }]}>
              {waterDisciplineCount >= 5 ? 'Düzenli' : 'Geliştirilmeli'}
            </Text>
          </View>
        </View>
      </View>

      {/* 7-Day Calorie Bar Chart Card */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View>
            <Text style={styles.cardTitle}>📊 7 Günlük Kalori Dağılımı</Text>
            <Text style={styles.cardSubtitle}>
              Seçili Gün:{' '}
              <Text style={styles.bold}>
                {selectedDay.dayLabel} ({selectedDay.dateStr})
              </Text>{' '}
              •{' '}
              <Text style={{ color: theme.primary, fontWeight: '700' }}>
                {selectedDay.hasData === false ? 'Kayıt yok' : `${selectedDay.calories} kcal`}
              </Text>
            </Text>
          </View>
        </View>

        {/* SVG Bar Chart with Target Threshold Line */}
        <View style={styles.chartWrapper}>
          <Svg width={chartWidth} height={BAR_CHART_HEIGHT}>
            {/* Target line */}
            <Line
              x1={0}
              y1={chartHeightInner * (1 - targetCal / maxCal)}
              x2={chartWidth}
              y2={chartHeightInner * (1 - targetCal / maxCal)}
              stroke={isDarkMode ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.2)'}
              strokeDasharray="4, 4"
              strokeWidth={1.5}
            />

            {/* Target reference label */}
            <SvgText
              x={chartWidth - 65}
              y={chartHeightInner * (1 - targetCal / maxCal) - 4}
              fontSize={10}
              fill={theme.textMuted}
              fontWeight="600"
            >
              Hedef ({targetCal})
            </SvgText>

            {/* Daily Bars */}
            {weeklyData.map((d, index) => {
              const barWidth = 26;
              const slotWidth = chartWidth / weeklyData.length;
              const x = slotWidth * index + (slotWidth - barWidth) / 2;
              const barHeight =
                d.hasData === false ? 10 : Math.max(8, (d.calories / maxCal) * chartHeightInner);
              const y = chartHeightInner - barHeight;
              const isSelected = index === selectedDayIndex;

              const isWithinTarget = Math.abs(d.calories - targetCal) <= 200;
              const barColor =
                d.hasData === false
                  ? theme.border
                  : isSelected
                  ? theme.primary
                  : isWithinTarget
                  ? isDarkMode
                    ? '#10B981'
                    : Colors.primary
                  : d.calories > targetCal
                  ? theme.calories
                  : theme.protein;

              return (
                <React.Fragment key={`bar-${index}`}>
                  {/* Selection Indicator Pin */}
                  {isSelected && (
                    <SvgText
                      x={x + barWidth / 2}
                      y={Math.max(12, y - 4)}
                      fontSize={10}
                      fontWeight="800"
                      fill={theme.primary}
                      textAnchor="middle"
                    >
                      ▼
                    </SvgText>
                  )}

                  <Rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx={6}
                    fill={barColor}
                    opacity={d.hasData === false ? 0.35 : isSelected ? 1 : 0.75}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setSelectedDayIndex(index);
                    }}
                  />

                  {/* Day Label Text */}
                  <SvgText
                    x={x + barWidth / 2}
                    y={BAR_CHART_HEIGHT - 8}
                    fontSize={11}
                    fontWeight={isSelected ? '700' : '500'}
                    fill={
                      isSelected
                        ? isDarkMode
                          ? theme.primary
                          : Colors.primaryDark
                        : theme.textSecondary
                    }
                    textAnchor="middle"
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setSelectedDayIndex(index);
                    }}
                  >
                    {d.dayLabel}
                  </SvgText>
                </React.Fragment>
              );
            })}
          </Svg>
        </View>

        {/* Day Selectors Buttons */}
        <View style={styles.daySelectorRow}>
          {weeklyData.map((d, idx) => (
            <TouchableOpacity
              key={`btn-${idx}`}
              style={[
                styles.daySelectorBtn,
                idx === selectedDayIndex && {
                  backgroundColor: isDarkMode ? theme.primaryMuted : Colors.primaryLight,
                  borderColor: theme.primary,
                },
              ]}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setSelectedDayIndex(idx);
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.daySelectorText,
                  idx === selectedDayIndex && { color: theme.primary, fontWeight: '700' },
                ]}
              >
                {d.dayLabel}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Selected Day Macronutrient Balance Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🥗 {selectedDay.dayLabel} Günü Makro Dengesi</Text>
        <Text style={styles.cardSubtitle}>
          Toplam: <Text style={styles.bold}>{selectedDay.calories} kcal</Text> • Alınan Makro
          Gramajları
        </Text>

        {/* Multi-segmented Macro Ratio Bar */}
        <View style={styles.segmentedBar}>
          <View
            style={[styles.segment, { flex: proteinPercent, backgroundColor: theme.protein }]}
          />
          <View
            style={[styles.segment, { flex: carbsPercent, backgroundColor: theme.calories }]}
          />
          <View style={[styles.segment, { flex: fatPercent, backgroundColor: theme.fat }]} />
        </View>

        {/* Macro Details Grid */}
        <View style={styles.macroGrid}>
          <View
            style={[styles.macroGridItem, { borderColor: isDarkMode ? '#1E3A8A' : '#BFDBFE' }]}
          >
            <Text style={[styles.macroGridValue, { color: theme.protein }]}>
              {selectedDay.protein}g (%{proteinPercent})
            </Text>
            <Text style={styles.macroGridLabel}>🥩 Protein</Text>
          </View>

          <View
            style={[styles.macroGridItem, { borderColor: isDarkMode ? '#78350F' : '#FDE68A' }]}
          >
            <Text style={[styles.macroGridValue, { color: theme.calories }]}>
              {selectedDay.carbs}g (%{carbsPercent})
            </Text>
            <Text style={styles.macroGridLabel}>🌾 Karbonhidrat</Text>
          </View>

          <View
            style={[styles.macroGridItem, { borderColor: isDarkMode ? '#831843' : '#FBCFE8' }]}
          >
            <Text style={[styles.macroGridValue, { color: theme.fat }]}>
              {selectedDay.fat}g (%{fatPercent})
            </Text>
            <Text style={styles.macroGridLabel}>🥑 Yağ</Text>
          </View>
        </View>
      </View>

      {/* AI Dietitian Weekly Insight & PDF Export Card */}
      <View style={[styles.card, styles.aiInsightCard]}>
        <View style={styles.aiHeaderRow}>
          <Text style={styles.aiTitle}>🤖 Diyetisyen AI Haftalık Değerlendirmesi</Text>
        </View>
        <Text style={styles.aiBodyText}>
          Tebrikler {userProfile.name}! Bu hafta kalori açığı ve protein hedeflerinizde{' '}
          <Text style={styles.bold}>%{adherenceRate} başarı</Text> yakaladınız.{' '}
          {userProfile.dietaryGoal === 'weight_loss'
            ? 'Metabolik hızınızı koruyarak haftalık 0.5 kg yağ kaybı temposunu sürdürüyorsunuz.'
            : 'Kas kütlesi kazanımı için pozitif enerji dengesi başarıyla korunuyor.'}
        </Text>

        <TouchableOpacity
          style={styles.exportButton}
          onPress={handleExportReport}
          activeOpacity={0.85}
        >
          <Text style={styles.exportButtonText}>📄 Raporu Paylaş / Diyetisyene Gönder</Text>
        </TouchableOpacity>
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
    kpiRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginBottom: Spacing.lg,
    },
    kpiCard: {
      flex: 1,
      backgroundColor: theme.surface,
      borderRadius: BorderRadius.xl,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      ...Shadows.card,
    },
    kpiEmoji: {
      fontSize: 22,
      marginBottom: 4,
    },
    kpiValue: {
      ...Typography.h3,
      color: theme.textPrimary,
      fontWeight: '800',
    },
    kpiLabel: {
      ...Typography.tiny,
      color: theme.textMuted,
      marginTop: 2,
      textAlign: 'center',
      fontSize: 10,
    },
    kpiBadge: {
      marginTop: Spacing.xs,
      paddingHorizontal: Spacing.xs,
      paddingVertical: 2,
      borderRadius: BorderRadius.full,
      backgroundColor: theme.surfaceSubtle,
    },
    kpiBadgeText: {
      ...Typography.tiny,
      fontSize: 9,
      color: theme.textSecondary,
      fontWeight: '700',
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
      marginBottom: Spacing.md,
    },
    cardTitle: {
      ...Typography.h3,
      color: theme.textPrimary,
    },
    cardSubtitle: {
      ...Typography.caption,
      color: theme.textMuted,
      marginTop: 2,
    },
    bold: {
      fontWeight: '700',
      color: theme.textPrimary,
    },
    chartWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    daySelectorRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 4,
      marginTop: Spacing.sm,
      paddingTop: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    daySelectorBtn: {
      flex: 1,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      backgroundColor: theme.surfaceSubtle,
    },
    daySelectorText: {
      ...Typography.tiny,
      color: theme.textSecondary,
      fontWeight: '600',
    },
    segmentedBar: {
      flexDirection: 'row',
      height: 12,
      borderRadius: BorderRadius.full,
      overflow: 'hidden',
      marginTop: Spacing.md,
      marginBottom: Spacing.md,
    },
    segment: {
      height: '100%',
    },
    macroGrid: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    macroGridItem: {
      flex: 1,
      padding: Spacing.sm,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      backgroundColor: theme.surfaceSubtle,
      alignItems: 'center',
    },
    macroGridValue: {
      ...Typography.captionBold,
      marginBottom: 2,
    },
    macroGridLabel: {
      ...Typography.tiny,
      color: theme.textMuted,
    },
    aiInsightCard: {
      backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.08)' : '#ECFDF5',
      borderColor: isDarkMode ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0',
    },
    aiHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.xs,
    },
    aiTitle: {
      ...Typography.bodyBold,
      color: isDarkMode ? theme.primary : Colors.primaryDark,
    },
    aiBodyText: {
      ...Typography.caption,
      color: theme.textSecondary,
      lineHeight: 18,
      marginBottom: Spacing.md,
    },
    exportButton: {
      backgroundColor: theme.primary,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      ...Shadows.glow,
    },
    exportButtonText: {
      ...Typography.bodyBold,
      color: '#FFFFFF',
    },
    /* Weekly Adherence Hero Card */
    adherenceHeroCard: {
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
      ...Shadows.subtle,
    },
    adherenceHeroTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.sm,
    },
    adherenceBadgeRow: {
      flexDirection: 'row',
      marginBottom: 4,
    },
    adherenceBadge: {
      ...Typography.tiny,
      fontSize: 10,
      fontWeight: '800',
      paddingHorizontal: Spacing.sm,
      paddingVertical: 3,
      borderRadius: BorderRadius.full,
      letterSpacing: 0.5,
    },
    adherenceScoreValue: {
      ...Typography.h1,
      fontSize: 26,
      fontWeight: '800',
    },
    adherenceScoreSubtitle: {
      fontSize: 15,
      fontWeight: '600',
    },
    adherenceRingMini: {
      width: 48,
      height: 48,
      borderRadius: 24,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    adherenceRingEmoji: {
      fontSize: 22,
    },
    adherenceTrack: {
      height: 8,
      borderRadius: BorderRadius.full,
      overflow: 'hidden',
      marginBottom: Spacing.sm,
    },
    adherenceFill: {
      height: '100%',
      borderRadius: BorderRadius.full,
    },
    adherenceMotivationText: {
      ...Typography.caption,
      lineHeight: 18,
    },
  });
