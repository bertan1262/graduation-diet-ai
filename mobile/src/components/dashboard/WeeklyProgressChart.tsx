import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions } from 'react-native';
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - Spacing.lg * 2 - Spacing.xl * 2;
const CHART_HEIGHT = 160;
const PADDING_TOP = 25;
const PADDING_BOTTOM = 25;

interface DayDataPoint {
  day: string;
  calories: number;
  weight: number;
}

const WEEKLY_DATA: DayDataPoint[] = [
  { day: 'Pzt', calories: 1980, weight: 76.5 },
  { day: 'Sal', calories: 2120, weight: 76.3 },
  { day: 'Çar', calories: 2050, weight: 76.2 },
  { day: 'Per', calories: 1920, weight: 76.0 },
  { day: 'Cum', calories: 2180, weight: 75.9 },
  { day: 'Cmt', calories: 2080, weight: 75.8 },
  { day: 'Bugün', calories: 2040, weight: 75.6 },
];

export const WeeklyProgressChart: React.FC = () => {
  const { userProfile, isDarkMode } = useDietStore();
  const theme = getThemeColors(isDarkMode);
  const styles = useMemo(() => createStyles(theme, isDarkMode), [isDarkMode]);
  const [metric, setMetric] = useState<MetricType>('calories');

  const targetCal = userProfile.targetCalories || 2100;
  const targetWeight = userProfile.targetWeightKg || 72;

  // Extract values based on active metric
  const values = metric === 'calories'
    ? WEEKLY_DATA.map((d) => d.calories)
    : WEEKLY_DATA.map((d) => d.weight);

  const targetVal = metric === 'calories' ? targetCal : targetWeight;

  const minVal = Math.min(...values, targetVal) * 0.96;
  const maxVal = Math.max(...values, targetVal) * 1.04;

  const getY = (val: number) => {
    if (maxVal === minVal) return CHART_HEIGHT / 2;
    return (
      PADDING_TOP +
      (1 - (val - minVal) / (maxVal - minVal)) *
        (CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM)
    );
  };

  const getX = (index: number) => {
    return (index / (WEEKLY_DATA.length - 1)) * CHART_WIDTH;
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
  const areaPath = `${linePath} L ${CHART_WIDTH} ${CHART_HEIGHT} L 0 ${CHART_HEIGHT} Z`;

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

      {/* SVG Canvas Area */}
      <View style={styles.chartWrapper}>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
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
                x1={0}
                y1={targetY}
                x2={CHART_WIDTH}
                y2={targetY}
                stroke={isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(15, 23, 42, 0.2)'}
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <SvgText
                x={CHART_WIDTH - 6}
                y={targetY - 5}
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
                    x={pt.x}
                    y={pt.y - 10}
                    fontSize={10}
                    fontWeight="700"
                    fill={theme.textPrimary}
                    textAnchor="middle"
                  >
                    {metric === 'calories' ? pt.val : `${pt.val}k`}
                  </SvgText>
                )}
              </React.Fragment>
            );
          })}
        </Svg>
      </View>

      {/* Weekday Axis Labels */}
      <View style={styles.axisLabelsRow}>
        {WEEKLY_DATA.map((d, i) => (
          <Text
            key={d.day}
            style={[
              styles.axisLabel,
              i === WEEKLY_DATA.length - 1 && styles.axisLabelToday,
            ]}
          >
            {d.day}
          </Text>
        ))}
      </View>

      {/* Motivational insight footer */}
      <View style={styles.insightBox}>
        <Text style={styles.insightText}>
          {metric === 'calories'
            ? '🔥 7 günün 5 gününde kalori hedefinizi tutturdunuz! Dengeli beslenme disiplini harika gidiyor.'
            : '🎯 Kilonuz haftalık -0.3 kg sağlıklı ritimde ilerliyor. Kas kaybı olmadan yağ yakımı sürüyor.'}
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
