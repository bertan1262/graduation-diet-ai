import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, useWindowDimensions } from 'react-native';
import Svg, {
  Path,
  Circle,
  Line,
  Defs,
  LinearGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { Colors, getThemeColors, ThemeColors } from '../../constants/colors';
import { Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { useDietStore } from '../../store/useDietStore';

type MetricType = 'calories' | 'weight';

const CHART_HEIGHT = 165;
const PADDING_TOP = 28;
const PADDING_BOTTOM = 24;
const PADDING_X = 24;

interface DayDataPoint {
  day: string;
  calories: number;
  weight: number;
}

export const WeeklyProgressChart: React.FC = () => {
  const userProfile = useDietStore((state) => state.userProfile);
  const todayMeals = useDietStore((state) => state.todayMeals);
  const isDarkMode = useDietStore((state) => state.isDarkMode);
  const dailyHistory = useDietStore((state) => state.dailyHistory);
  const { width: screenWidth } = useWindowDimensions();
  const chartWidth = Math.max(240, screenWidth - Spacing.lg * 2 - Spacing.xl * 2 - 4);

  const theme = getThemeColors(isDarkMode);
  const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);
  const [metric, setMetric] = useState<MetricType>('calories');

  const targetCal = userProfile.targetCalories || 2100;
  const curWeight = userProfile.weightKg || 75.6;
  const targetWeight =
    userProfile.targetWeightKg ||
    (userProfile.dietaryGoal === 'muscle_gain'
      ? parseFloat((curWeight + 3).toFixed(1))
      : userProfile.dietaryGoal === 'maintenance'
      ? curWeight
      : parseFloat((curWeight - 3).toFixed(1)));

  const weeklyData: DayDataPoint[] = useMemo(() => {
    const curW = userProfile.weightKg || 75.6;
    const now = new Date();
    const weekdayFormatter = new Intl.DateTimeFormat('tr-TR', { weekday: 'short' });

    const pastDays: DayDataPoint[] = [];
    for (let i = 6; i >= 1; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const isoDate = new Intl.DateTimeFormat('en-CA').format(d);
      const recorded = dailyHistory && dailyHistory[isoDate];
      if (!recorded) continue;
      pastDays.push({
        day: weekdayFormatter.format(d),
        calories: recorded.calories,
        weight: recorded.weightKg ?? curW,
      });
    }

    const todayCalories = todayMeals.reduce((acc, m) => acc + m.calories, 0);
    return [...pastDays, { day: 'Bugün', calories: todayCalories, weight: curW }];
  }, [todayMeals, userProfile.weightKg, dailyHistory]);

  // Extract values based on active metric
  const values =
    metric === 'calories'
      ? weeklyData.map((d) => d.calories)
      : weeklyData.map((d) => d.weight);

  const targetVal = metric === 'calories' ? targetCal : targetWeight;

  const rawMin = Math.min(...values, targetVal);
  const rawMax = Math.max(...values, targetVal);
  const spread = Math.max(rawMax - rawMin, metric === 'calories' ? 300 : 1.5);
  const minVal = rawMin - spread * 0.22;
  const maxVal = rawMax + spread * 0.25;

  const getY = (val: number) => {
    if (maxVal === minVal) return CHART_HEIGHT / 2;
    return (
      PADDING_TOP +
      (1 - (val - minVal) / (maxVal - minVal)) *
        (CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM)
    );
  };

  const getX = (index: number) => {
    const innerWidth = Math.max(100, chartWidth - PADDING_X * 2);
    if (weeklyData.length <= 1) return PADDING_X + innerWidth / 2;
    return PADDING_X + (index / (weeklyData.length - 1)) * innerWidth;
  };

  const points = values.map((val, i) => ({
    x: getX(i),
    y: getY(val),
    val,
  }));

  // Build smooth cubic Bézier curve SVG path
  const linePath = points.reduce((acc, pt, i, arr) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = arr[i - 1];
    const cpX1 = prev.x + (pt.x - prev.x) / 2;
    const cpY1 = prev.y;
    const cpX2 = prev.x + (pt.x - prev.x) / 2;
    const cpY2 = pt.y;
    return `${acc} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${pt.x} ${pt.y}`;
  }, '');

  // Closed area under the curve for gradient fill
  const firstX = points[0]?.x ?? PADDING_X;
  const lastX = points[points.length - 1]?.x ?? chartWidth - PADDING_X;
  const areaPath = `${linePath} L ${lastX} ${CHART_HEIGHT} L ${firstX} ${CHART_HEIGHT} Z`;

  // Target guideline Y position
  const targetY = getY(targetVal);

  return (
    <View style={styles.card}>
      {/* Title & Metric Switcher Tabs */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>📈 Haftalık İlerleme Trendi</Text>
        <Text style={styles.subtitle}>
          7 günlük metabolik kalori dengesi ve tartı dalgalanmaları
        </Text>

        <View style={styles.toggleGroup}>
          <TouchableOpacity
            style={[styles.toggleBtn, metric === 'calories' && styles.toggleBtnActive]}
            onPress={() => setMetric('calories')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.toggleBtnText,
                metric === 'calories' && styles.toggleBtnTextActive,
              ]}
            >
              🔥 Kalori
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleBtn, metric === 'weight' && styles.toggleBtnActive]}
            onPress={() => setMetric('weight')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.toggleBtnText,
                metric === 'weight' && styles.toggleBtnTextActive,
              ]}
            >
              ⚖️ Kilo
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {weeklyData.length >= 2 ? (
        <>
          {/* SVG Canvas Area */}
          <View style={styles.chartWrapper}>
            <Svg width={chartWidth} height={CHART_HEIGHT}>
              <Defs>
                <LinearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <Stop
                    offset="0%"
                    stopColor={metric === 'calories' ? theme.primary : theme.protein}
                    stopOpacity={isDarkMode ? 0.35 : 0.28}
                  />
                  <Stop
                    offset="100%"
                    stopColor={metric === 'calories' ? theme.primary : theme.protein}
                    stopOpacity={0.0}
                  />
                </LinearGradient>
              </Defs>

              {/* Target Guideline */}
              {targetY >= 0 && targetY <= CHART_HEIGHT && (
                <>
                  <Line
                    x1={PADDING_X - 8}
                    y1={targetY}
                    x2={chartWidth - PADDING_X + 8}
                    y2={targetY}
                    stroke={isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(15, 23, 42, 0.2)'}
                    strokeWidth={1}
                    strokeDasharray="4 4"
                  />
                  <SvgText
                    x={chartWidth - PADDING_X}
                    y={targetY < 20 ? targetY + 13 : targetY - 6}
                    fontSize={9}
                    fill={theme.textMuted}
                    textAnchor="end"
                    fontWeight="600"
                  >
                    Hedef: {targetVal} {metric === 'calories' ? 'kcal' : 'kg'}
                  </SvgText>
                </>
              )}

              {/* Area Fill */}
              <Path d={areaPath} fill="url(#chartGradient)" />

              {/* Main Trend Line */}
              <Path
                d={linePath}
                fill="none"
                stroke={metric === 'calories' ? theme.primary : theme.protein}
                strokeWidth={3}
                strokeLinecap="round"
              />

              {/* Data Points / Nodes */}
              {points.map((pt, i) => {
                const isToday = i === points.length - 1;
                const anchor = i === 0 ? 'start' : isToday ? 'end' : 'middle';
                const labelX = i === 0 ? pt.x - 4 : isToday ? pt.x + 4 : pt.x;
                return (
                  <React.Fragment key={`pt-${i}`}>
                    {/* Node circle */}
                    <Circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isToday ? 6 : 4}
                      fill={isToday ? (metric === 'calories' ? theme.primary : theme.protein) : theme.surface}
                      stroke={metric === 'calories' ? theme.primary : theme.protein}
                      strokeWidth={2}
                    />

                    {/* Value on peak nodes */}
                    {(i === 0 || i === 3 || isToday) && (
                      <SvgText
                        x={labelX}
                        y={pt.y - 10}
                        fontSize={10}
                        fontWeight="700"
                        fill={theme.textPrimary}
                        textAnchor={anchor}
                      >
                        {metric === 'calories' ? pt.val : `${pt.val} kg`}
                      </SvgText>
                    )}
                  </React.Fragment>
                );
              })}
            </Svg>
          </View>

          {/* Weekday Axis Labels */}
          <View style={styles.axisLabelsRow}>
            {weeklyData.map((d, i) => (
              <Text
                key={d.day}
                style={[
                  styles.axisLabel,
                  i === weeklyData.length - 1 && styles.axisLabelToday,
                ]}
              >
                {d.day}
              </Text>
            ))}
          </View>
        </>
      ) : (
        <View style={[styles.chartWrapper, { justifyContent: 'center', alignItems: 'center', minHeight: 140, paddingHorizontal: Spacing.md }]}>
          <Text style={{ ...Typography.caption, color: theme.textMuted, textAlign: 'center' }}>
            📈 Grafiği görmek için en az 2 günlük gerçek kayıt gerekir — ilk gününüzü tamamladıkça burada görünecek.
          </Text>
        </View>
      )}

      {/* Motivational insight footer */}
      <View style={styles.insightBox}>
        <Text style={styles.insightText}>
          {metric === 'calories'
            ? '🔥 Grafik yalnız kayıtlı günlerinizin gerçek kalori verilerini gösterir; hedef çizgisiyle karşılaştırarak güçlü ve eksik günleri görebilirsiniz.'
            : '⚖️ Kilo eğilimi yalnızca güne kaydettiğiniz gerçek tartı ölçümleri üzerinden çizilir.'}
        </Text>
      </View>
    </View>
  );
};

const createStyles = (theme: ThemeColors, isDarkMode: boolean) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.surface,
      borderRadius: BorderRadius.xl,
      padding: Spacing.xl,
      borderWidth: 1,
      borderColor: theme.border,
      ...Shadows.card,
      marginBottom: Spacing.lg,
    },
    headerRow: {
      marginBottom: Spacing.md,
    },
    title: {
      ...Typography.h3,
      color: theme.textPrimary,
    },
    subtitle: {
      ...Typography.tiny,
      color: theme.textMuted,
      marginTop: 2,
      lineHeight: 16,
    },
    toggleGroup: {
      flexDirection: 'row',
      backgroundColor: theme.surfaceSubtle,
      borderRadius: BorderRadius.lg,
      padding: 3,
      marginTop: Spacing.sm,
      borderWidth: 1,
      borderColor: theme.border,
    },
    toggleBtn: {
      flex: 1,
      paddingVertical: 6,
      alignItems: 'center',
      borderRadius: BorderRadius.md,
    },
    toggleBtnActive: {
      backgroundColor: theme.surface,
      ...Shadows.card,
    },
    toggleBtnText: {
      ...Typography.tiny,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    toggleBtnTextActive: {
      color: isDarkMode ? theme.primary : Colors.primaryDark,
      fontWeight: '700',
    },
    chartWrapper: {
      alignItems: 'center',
      marginTop: Spacing.xs,
    },
    axisLabelsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 2,
      marginTop: Spacing.xs,
    },
    axisLabel: {
      ...Typography.tiny,
      color: theme.textMuted,
      fontWeight: '600',
    },
    axisLabelToday: {
      color: isDarkMode ? theme.primary : Colors.primaryDark,
      fontWeight: '800',
    },
    insightBox: {
      backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.12)' : '#F0FDF4',
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(16, 185, 129, 0.25)' : '#DCFCE7',
      borderRadius: BorderRadius.md,
      padding: Spacing.sm,
      marginTop: Spacing.md,
    },
    insightText: {
      ...Typography.tiny,
      color: isDarkMode ? '#6EE7B7' : Colors.primaryDark,
      lineHeight: 16,
    },
  });
