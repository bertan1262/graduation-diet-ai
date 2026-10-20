import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Share,
  Alert,
} from 'react-native';
import Svg, { Rect, Line, Text as SvgText, Circle } from 'react-native-svg';
import { Colors, getThemeColors, ThemeColors } from '../constants/colors';
import { Spacing, BorderRadius, Typography, Shadows } from '../constants/theme';
import { useDietStore } from '../store/useDietStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - Spacing.lg * 2 - Spacing.xl * 2;
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
}

export const AnalyticsScreen: React.FC = () => {
  const { userProfile, todayMeals, waterIntakeMl, isDarkMode } = useDietStore();
  const theme = getThemeColors(isDarkMode);
  const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);

  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(6); // Default to today

  // Build reactive 7-day dataset with current day dynamically linked to todayMeals
  const weeklyData: DayHistoryItem[] = useMemo(() => {
    const todayCalories = todayMeals.reduce((acc, m) => acc + m.calories, 0);
    const todayProtein = Math.round(todayMeals.reduce((acc, m) => acc + m.proteinGrams, 0));
    const todayCarbs = Math.round(todayMeals.reduce((acc, m) => acc + m.carbsGrams, 0));
    const todayFat = Math.round(todayMeals.reduce((acc, m) => acc + m.fatGrams, 0));

    const target = userProfile.targetCalories || 2100;

    return [
      {
        dayLabel: 'Pzt',
        dateStr: '14 Eki',
        calories: Math.round(target * 0.94),
        protein: 110,
        carbs: 180,
        fat: 55,
        waterMl: 2500,
      },
      {
        dayLabel: 'Sal',
        dateStr: '15 Eki',
        calories: Math.round(target * 1.02),
        protein: 135,
        carbs: 195,
        fat: 62,
        waterMl: 2750,
      },
      {
        dayLabel: 'Çar',
        dateStr: '16 Eki',
        calories: Math.round(target * 0.98),
        protein: 125,
        carbs: 170,
        fat: 58,
        waterMl: 2250,
      },
      {
        dayLabel: 'Per',
        dateStr: '17 Eki',
        calories: Math.round(target * 0.91),
        protein: 105,
        carbs: 160,
        fat: 50,
        waterMl: 3000,
      },
      {
        dayLabel: 'Cum',
        dateStr: '18 Eki',
        calories: Math.round(target * 1.05),
        protein: 140,
        carbs: 210,
        fat: 65,
        waterMl: 2500,
      },
      {
        dayLabel: 'Cmt',
        dateStr: '19 Eki',
        calories: Math.round(target * 0.99),
        protein: 130,
        carbs: 190,
        fat: 60,
        waterMl: 2000,
      },
      {
        dayLabel: 'Bugün',
        dateStr: '20 Eki',
        calories: todayCalories > 0 ? todayCalories : Math.round(target * 0.88),
        protein: todayProtein > 0 ? todayProtein : 95,
        carbs: todayCarbs > 0 ? todayCarbs : 140,
        fat: todayFat > 0 ? todayFat : 45,
        waterMl: waterIntakeMl > 0 ? waterIntakeMl : 1750,
        isToday: true,
      },
    ];
  }, [todayMeals, waterIntakeMl, userProfile.targetCalories]);

  const selectedDay = weeklyData[selectedDayIndex] || weeklyData[6];

  // Weekly aggregates
  const avgCalories = Math.round(
    weeklyData.reduce((acc, d) => acc + d.calories, 0) / weeklyData.length
  );
  const targetCal = userProfile.targetCalories || 2100;
  const adherenceRate = Math.min(
    100,
    Math.round(
      (weeklyData.filter((d) => Math.abs(d.calories - targetCal) <= 250).length /
        weeklyData.length) *
        100
    )
  );

  // Macro percentages for selected day
  const totalMacroGrams = selectedDay.protein + selectedDay.carbs + selectedDay.fat;
  const proteinPercent =
    totalMacroGrams > 0 ? Math.round((selectedDay.protein / totalMacroGrams) * 100) : 30;
  const carbsPercent =
    totalMacroGrams > 0 ? Math.round((selectedDay.carbs / totalMacroGrams) * 100) : 45;
  const fatPercent =
    totalMacroGrams > 0 ? Math.round((selectedDay.fat / totalMacroGrams) * 100) : 25;

  // Max value for bar chart scaling
  const maxCal = Math.max(...weeklyData.map((d) => d.calories), targetCal * 1.15);
  const chartHeightInner = BAR_CHART_HEIGHT - 35;

  // PDF Export / Share Simulation
  const handleExportReport = async () => {
    try {
      const summaryText = `📋 DietAI Haftalık Klinik Beslenme Raporu\n` +
        `👤 Kullanıcı: ${userProfile.name} (${userProfile.age} Yaş, ${userProfile.weightKg} kg)\n` +
        `🎯 Hedef: ${userProfile.dietaryGoal === 'weight_loss' ? 'Kilo Verme' : userProfile.dietaryGoal === 'muscle_gain' ? 'Kas Kazanımı' : 'Form Koruma'}\n` +
        `🔥 Günlük Hedef Kalori: ${userProfile.targetCalories} kcal (7 Günlük Ort: ${avgCalories} kcal)\n` +
        `🥩 Hedef Protein: ${userProfile.targetProteinGrams}g | Karb: ${userProfile.targetCarbsGrams}g | Yağ: ${userProfile.targetFatGrams}g\n` +
        `💧 Su Hedefi: ${userProfile.waterGoalMl} ml\n` +
        `🧬 Hesaplama Motoru: ${userProfile.bmrFormulaUsed === 'mifflin_st_jeor' ? 'Mifflin-St Jeor' : 'Revised Harris-Benedict'}\n\n` +
        `Bu rapor DietAI Mobil Uygulaması tarafından üretilmiştir.`;

      await Share.share({
        message: summaryText,
        title: 'DietAI Beslenme Raporu',
      });
    } catch (err) {
      Alert.alert('Bilgi', 'Rapor dışa aktarılamadı.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
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
          <View style={[styles.kpiBadge, { backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5' }]}>
            <Text style={[styles.kpiBadgeText, { color: theme.primary }]}>Dengeli İlerleme</Text>
          </View>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiEmoji}>💧</Text>
          <Text style={[styles.kpiValue, { color: theme.water }]}>6/7</Text>
          <Text style={styles.kpiLabel}>Su Disiplini</Text>
          <View style={[styles.kpiBadge, { backgroundColor: isDarkMode ? 'rgba(6, 182, 212, 0.2)' : '#CFFAFE' }]}>
            <Text style={[styles.kpiBadgeText, { color: theme.water }]}>Düzenli</Text>
          </View>
        </View>
      </View>

      {/* 7-Day Calorie Bar Chart Card */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View>
            <Text style={styles.cardTitle}>📊 7 Günlük Kalori Dağılımı</Text>
            <Text style={styles.cardSubtitle}>
              Seçili Gün: <Text style={styles.bold}>{selectedDay.dayLabel} ({selectedDay.dateStr})</Text> •{' '}
              <Text style={{ color: theme.primary, fontWeight: '700' }}>{selectedDay.calories} kcal</Text>
            </Text>
          </View>
        </View>

        {/* SVG Bar Chart with Target Threshold Line */}
        <View style={styles.chartWrapper}>
          <Svg width={CHART_WIDTH} height={BAR_CHART_HEIGHT}>
            {/* Target line */}
            <Line
              x1={0}
              y1={chartHeightInner * (1 - targetCal / maxCal)}
              x2={CHART_WIDTH}
              y2={chartHeightInner * (1 - targetCal / maxCal)}
              stroke={isDarkMode ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.2)'}
              strokeDasharray="4, 4"
              strokeWidth={1.5}
            />

            {/* Target reference label */}
            <SvgText
              x={CHART_WIDTH - 65}
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
              const slotWidth = CHART_WIDTH / weeklyData.length;
              const x = slotWidth * index + (slotWidth - barWidth) / 2;
              const barHeight = Math.max(12, (d.calories / maxCal) * chartHeightInner);
              const y = chartHeightInner - barHeight;
              const isSelected = index === selectedDayIndex;

              const isWithinTarget = Math.abs(d.calories - targetCal) <= 200;
              const barColor = isSelected
                ? theme.primary
                : isWithinTarget
                ? isDarkMode ? '#10B981' : Colors.primary
                : d.calories > targetCal
                ? theme.calories
                : theme.protein;

              return (
                <React.Fragment key={`bar-${index}`}>
                  <Rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx={6}
                    fill={barColor}
                    opacity={isSelected ? 1 : 0.8}
                  />

                  {/* Day Label Text */}
                  <SvgText
                    x={x + barWidth / 2}
                    y={BAR_CHART_HEIGHT - 8}
                    fontSize={11}
                    fontWeight={isSelected ? '700' : '500'}
                    fill={isSelected ? (isDarkMode ? theme.primary : Colors.primaryDark) : theme.textSecondary}
                    textAnchor="middle"
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
              onPress={() => setSelectedDayIndex(idx)}
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
          Toplam: <Text style={styles.bold}>{selectedDay.calories} kcal</Text> • Alınan Makro Gramajları
        </Text>

        {/* Multi-segmented Macro Ratio Bar */}
        <View style={styles.segmentedBar}>
          <View style={[styles.segment, { flex: proteinPercent, backgroundColor: theme.protein }]} />
          <View style={[styles.segment, { flex: carbsPercent, backgroundColor: theme.calories }]} />
          <View style={[styles.segment, { flex: fatPercent, backgroundColor: theme.fat }]} />
        </View>

        {/* Macro Details Grid */}
        <View style={styles.macroGrid}>
          <View style={[styles.macroGridItem, { borderColor: isDarkMode ? '#1E3A8A' : '#BFDBFE' }]}>
            <Text style={[styles.macroGridValue, { color: theme.protein }]}>
              {selectedDay.protein}g (%{proteinPercent})
            </Text>
            <Text style={styles.macroGridLabel}>🥩 Protein</Text>
          </View>

          <View style={[styles.macroGridItem, { borderColor: isDarkMode ? '#78350F' : '#FDE68A' }]}>
            <Text style={[styles.macroGridValue, { color: theme.calories }]}>
              {selectedDay.carbs}g (%{carbsPercent})
            </Text>
            <Text style={styles.macroGridLabel}>🌾 Karbonhidrat</Text>
          </View>

          <View style={[styles.macroGridItem, { borderColor: isDarkMode ? '#831843' : '#FBCFE8' }]}>
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
  });
