import React, { useState, useMemo, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Share,
  Alert,
  Image,
  PanResponder,
  LayoutChangeEvent,
} from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import { Colors, getThemeColors, ThemeColors } from '../constants/colors';
import { Spacing, BorderRadius, Typography, Shadows } from '../constants/theme';
import { useDietStore } from '../store/useDietStore';

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
  const {
    userProfile,
    todayMeals,
    waterIntakeMl,
    progressPhotos,
    addProgressPhoto,
    isDarkMode,
  } = useDietStore();
  const { width: screenWidth } = useWindowDimensions();
  const chartWidth = Math.max(240, screenWidth - Spacing.lg * 2 - Spacing.xl * 2);

  const theme = getThemeColors(isDarkMode);
  const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);

  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(6); // Default to today
  const [splitPercent, setSplitPercent] = useState<number>(50);
  const sliderWidthRef = useRef<number>(280);
  const startSplitRef = useRef<number>(50);

  const clampSplit = (val: number) => Math.max(12, Math.min(88, val));

  const splitPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_evt, gs) => Math.abs(gs.dx) > 2,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (evt) => {
        if (sliderWidthRef.current > 0 && evt.nativeEvent.locationX !== undefined) {
          const pct = clampSplit(
            Math.round((evt.nativeEvent.locationX / sliderWidthRef.current) * 100)
          );
          startSplitRef.current = pct;
          setSplitPercent(pct);
        }
      },
      onPanResponderMove: (_evt, gs) => {
        if (sliderWidthRef.current > 0) {
          const deltaPct = (gs.dx / sliderWidthRef.current) * 100;
          setSplitPercent(clampSplit(Math.round(startSplitRef.current + deltaPct)));
        }
      },
    })
  ).current;

  const handleSliderLayout = (e: LayoutChangeEvent) => {
    sliderWidthRef.current = e.nativeEvent.layout.width || 280;
  };

  const beforePhoto = progressPhotos[0] || {
    id: 'before-fallback',
    dateStr: 'Başlangıç',
    weightKg: (userProfile.weightKg || 76) + 3.4,
    imageUri:
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=600&q=80',
    label: 'Başlangıç (1. Gün)',
  };

  const afterPhoto = progressPhotos[progressPhotos.length - 1] || {
    id: 'after-fallback',
    dateStr: 'Bugün',
    weightKg: userProfile.weightKg || 76,
    imageUri:
      'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=600&q=80',
    label: 'Güncel Durum',
  };

  const weightDiff = Math.round((afterPhoto.weightKg - beforePhoto.weightKg) * 10) / 10;

  const handleAddProgressPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.75,
        selectionLimit: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const todayStr = new Intl.DateTimeFormat('tr-TR', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }).format(new Date());

        addProgressPhoto({
          dateStr: todayStr,
          weightKg: userProfile.weightKg || 76,
          imageUri: asset.uri,
          label: `Güncel (${todayStr})`,
        });
      }
    } catch {
      Alert.alert('Bilgi', 'Galeriden fotoğraf seçilemedi.');
    }
  };

  // Build reactive 7-day dataset with real calendar dates and current day dynamically linked to todayMeals
  const weeklyData: DayHistoryItem[] = useMemo(() => {
    const todayCalories = todayMeals.reduce((acc, m) => acc + m.calories, 0);
    const todayProtein = Math.round(todayMeals.reduce((acc, m) => acc + m.proteinGrams, 0));
    const todayCarbs = Math.round(todayMeals.reduce((acc, m) => acc + m.carbsGrams, 0));
    const todayFat = Math.round(todayMeals.reduce((acc, m) => acc + m.fatGrams, 0));

    const target = userProfile.targetCalories || 2100;
    const now = new Date();
    const dateFormatter = new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: 'short',
    });
    const weekdayFormatter = new Intl.DateTimeFormat('tr-TR', { weekday: 'short' });

    const historicalTemplates = [
      { calRatio: 0.94, protein: 110, carbs: 180, fat: 55, waterMl: 2500 },
      { calRatio: 1.02, protein: 135, carbs: 195, fat: 62, waterMl: 2750 },
      { calRatio: 0.98, protein: 125, carbs: 170, fat: 58, waterMl: 2250 },
      { calRatio: 0.91, protein: 105, carbs: 160, fat: 50, waterMl: 3000 },
      { calRatio: 1.05, protein: 140, carbs: 210, fat: 65, waterMl: 2500 },
      { calRatio: 0.99, protein: 130, carbs: 190, fat: 60, waterMl: 2000 },
    ];

    const pastDays: DayHistoryItem[] = historicalTemplates.map((tpl, idx) => {
      const daysAgo = 6 - idx;
      const d = new Date(now);
      d.setDate(now.getDate() - daysAgo);
      return {
        dayLabel: weekdayFormatter.format(d),
        dateStr: dateFormatter.format(d),
        calories: Math.round(target * tpl.calRatio),
        protein: tpl.protein,
        carbs: tpl.carbs,
        fat: tpl.fat,
        waterMl: tpl.waterMl,
      };
    });

    return [
      ...pastDays,
      {
        dayLabel: 'Bugün',
        dateStr: dateFormatter.format(now),
        calories: todayCalories,
        protein: todayProtein,
        carbs: todayCarbs,
        fat: todayFat,
        waterMl: waterIntakeMl,
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
  const waterGoal = userProfile.waterGoalMl || 2500;
  const waterDisciplineCount = weeklyData.filter((d) => d.waterMl >= waterGoal * 0.8).length;

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
                {selectedDay.calories} kcal
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
              const barHeight = Math.max(8, (d.calories / maxCal) * chartHeightInner);
              const y = chartHeightInner - barHeight;
              const isSelected = index === selectedDayIndex;

              const isWithinTarget = Math.abs(d.calories - targetCal) <= 200;
              const barColor = isSelected
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
                    fill={
                      isSelected
                        ? isDarkMode
                          ? theme.primary
                          : Colors.primaryDark
                        : theme.textSecondary
                    }
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

      {/* Phase 4.1: Cal AI Before & After Visual Transformation Split Slider Card */}
      <View style={styles.card}>
        <View style={styles.beforeAfterHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>📸 Vücut Değişim Karşılaştırıcısı</Text>
            <Text style={styles.cardSubtitle}>
              Çizgiyi sağa-sola kaydırarak ilerlemenizi inceleyin
            </Text>
          </View>
          <View style={styles.weightDiffBadge}>
            <Text style={styles.weightDiffText}>
              {weightDiff <= 0 ? `${weightDiff} kg` : `+${weightDiff} kg`}
            </Text>
          </View>
        </View>

        {/* Interactive Split Comparison Viewport */}
        <View
          style={styles.splitViewport}
          onLayout={handleSliderLayout}
          {...splitPanResponder.panHandlers}
        >
          {/* Base Full Layer: AFTER Photo (Right Side) */}
          <Image
            source={{ uri: afterPhoto.imageUri }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />

          {/* Clipped Overlay Layer: BEFORE Photo (Left Side up to splitPercent%) */}
          <View style={[styles.beforeClipContainer, { width: `${splitPercent}%` }]}>
            <Image
              source={{ uri: beforePhoto.imageUri }}
              style={[
                styles.beforeFullImage,
                { width: sliderWidthRef.current || chartWidth },
              ]}
              resizeMode="cover"
            />
          </View>

          {/* Left Badge: ÖNCESİ */}
          <View style={styles.beforeCornerBadge}>
            <Text style={styles.cornerBadgeTitle}>ÖNCESİ</Text>
            <Text style={styles.cornerBadgeSub}>
              {beforePhoto.dateStr} • {beforePhoto.weightKg} kg
            </Text>
          </View>

          {/* Right Badge: SONRASI */}
          <View style={styles.afterCornerBadge}>
            <Text style={styles.cornerBadgeTitle}>SONRASI</Text>
            <Text style={styles.cornerBadgeSub}>
              {afterPhoto.dateStr} • {afterPhoto.weightKg} kg
            </Text>
          </View>

          {/* Vertical Split Handle Line */}
          <View style={[styles.splitDividerLine, { left: `${splitPercent}%` }]}>
            <View style={styles.splitHandleCircle}>
              <Text style={styles.splitHandleArrows}>↔</Text>
            </View>
          </View>
        </View>

        {/* Quick Split Position & Upload Row */}
        <View style={styles.splitActionsRow}>
          {[25, 50, 75].map((pct) => (
            <TouchableOpacity
              key={`split-${pct}`}
              style={[
                styles.splitQuickChip,
                Math.abs(splitPercent - pct) < 8 && styles.splitQuickChipActive,
              ]}
              onPress={() => setSplitPercent(pct)}
            >
              <Text
                style={[
                  styles.splitQuickText,
                  Math.abs(splitPercent - pct) < 8 && styles.splitQuickTextActive,
                ]}
              >
                %{pct} Kıyasla
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.uploadPhotoBtn}
            onPress={handleAddProgressPhoto}
            activeOpacity={0.8}
          >
            <Text style={styles.uploadPhotoBtnText}>+ Fotoğraf Ekle</Text>
          </TouchableOpacity>
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
    beforeAfterHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    weightDiffBadge: {
      backgroundColor: isDarkMode ? theme.primaryMuted : Colors.primaryLight,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: theme.primary,
    },
    weightDiffText: {
      ...Typography.captionBold,
      color: isDarkMode ? theme.primary : Colors.primaryDark,
    },
    splitViewport: {
      width: '100%',
      height: 215,
      borderRadius: BorderRadius.xl,
      overflow: 'hidden',
      position: 'relative',
      backgroundColor: '#0F172A',
      borderWidth: 1.5,
      borderColor: theme.border,
    },
    beforeClipContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      overflow: 'hidden',
    },
    beforeFullImage: {
      height: 215,
    },
    beforeCornerBadge: {
      position: 'absolute',
      bottom: 10,
      left: 10,
      backgroundColor: 'rgba(15, 23, 42, 0.82)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: BorderRadius.md,
    },
    afterCornerBadge: {
      position: 'absolute',
      bottom: 10,
      right: 10,
      backgroundColor: 'rgba(16, 185, 129, 0.9)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: BorderRadius.md,
    },
    cornerBadgeTitle: {
      ...Typography.tiny,
      fontSize: 9,
      color: '#FFFFFF',
      fontWeight: '800',
      letterSpacing: 0.6,
    },
    cornerBadgeSub: {
      ...Typography.tiny,
      fontSize: 10,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    splitDividerLine: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      width: 3,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: -1.5,
    },
    splitHandleCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: Colors.primary,
      borderWidth: 2,
      borderColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
      ...Shadows.card,
    },
    splitHandleArrows: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '800',
    },
    splitActionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: Spacing.md,
    },
    splitQuickChip: {
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderRadius: BorderRadius.md,
      backgroundColor: theme.surfaceSubtle,
      borderWidth: 1,
      borderColor: theme.border,
    },
    splitQuickChipActive: {
      borderColor: theme.primary,
      backgroundColor: isDarkMode ? theme.primaryMuted : Colors.primaryLight,
    },
    splitQuickText: {
      ...Typography.tiny,
      fontSize: 10,
      color: theme.textSecondary,
      fontWeight: '600',
    },
    splitQuickTextActive: {
      color: isDarkMode ? theme.primary : Colors.primaryDark,
      fontWeight: '700',
    },
    uploadPhotoBtn: {
      flex: 1,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: BorderRadius.md,
      backgroundColor: theme.primary,
      alignItems: 'center',
    },
    uploadPhotoBtnText: {
      ...Typography.tiny,
      color: '#FFFFFF',
      fontWeight: '700',
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
