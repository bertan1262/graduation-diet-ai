import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, getThemeColors } from '../../constants/colors';
import { Spacing, BorderRadius, Typography } from '../../constants/theme';
import { useDietStore } from '../../store/useDietStore';

export interface PromptItem {
  id: string;
  icon: string;
  text: string;
}

const MORNING_PROMPTS: PromptItem[] = [
  { id: 'm1', icon: '🍳', text: 'Kahvaltıda ne önerirsin?' },
  { id: 'm2', icon: '🥚', text: 'Güne yüksek proteinle başlama fikirleri' },
  { id: 'm3', icon: '☕', text: 'Sabah kahvesi kalorisi ve metabolizma' },
  { id: 'm4', icon: '💧', text: 'Sabah aç karnına ne kadar su içmeliyim?' },
];

const AFTERNOON_PROMPTS: PromptItem[] = [
  { id: 'a1', icon: '🥗', text: 'Öğle yemeği için hafif ve tok tutan ne var?' },
  { id: 'a2', icon: '🍗', text: 'Kalan protein hedefimi nasıl tamamlarım?' },
  { id: 'a3', icon: '🥑', text: 'Tatlı krizini nasıl önlerim?' },
  { id: 'a4', icon: '📊', text: 'Kalan kalori hakkıma göre ara öğün' },
];

const EVENING_PROMPTS: PromptItem[] = [
  { id: 'e1', icon: '🐟', text: 'Akşam için hafif ne yiyebilirim?' },
  { id: 'e2', icon: '🌙', text: 'Gece acıkırsam ne atıştırabilirim?' },
  { id: 'e3', icon: '💧', text: 'Bugünkü su hedefimi tamamlayabildim mi?' },
  { id: 'e4', icon: '🔥', text: 'Bugünkü kalori ve makro durumum nasıl?' },
];

const ALL_PROMPTS: PromptItem[] = [
  ...MORNING_PROMPTS,
  ...AFTERNOON_PROMPTS,
  ...EVENING_PROMPTS,
];

interface QuickPromptChipsProps {
  onSelectPrompt: (promptText: string) => void;
  disabled?: boolean;
}

type FilterMode = 'auto' | 'all';

export const QuickPromptChips: React.FC<QuickPromptChipsProps> = ({
  onSelectPrompt,
  disabled = false,
}) => {
  const isDarkMode = useDietStore((state) => state.isDarkMode);
  const theme = getThemeColors(isDarkMode);
  const [filterMode, setFilterMode] = useState<FilterMode>('auto');

  // Detect time of day
  const timeContext = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return {
        label: '☀️ Sabah Önerileri',
        prompts: MORNING_PROMPTS,
      };
    } else if (hour >= 12 && hour < 18) {
      return {
        label: '🌤️ Gün İçi Rehberi',
        prompts: AFTERNOON_PROMPTS,
      };
    } else {
      return {
        label: '🌙 Akşam Rehberi',
        prompts: EVENING_PROMPTS,
      };
    }
  }, []);

  const displayedPrompts = filterMode === 'auto' ? timeContext.prompts : ALL_PROMPTS;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
          borderTopColor: theme.border,
        },
      ]}
    >
      <ScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Time of Day Badge / Mode Switcher */}
        <TouchableOpacity
          style={[
            styles.timeBadge,
            {
              backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
              borderColor: isDarkMode ? '#334155' : '#E2E8F0',
            },
          ]}
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            setFilterMode((prev) => (prev === 'auto' ? 'all' : 'auto'));
          }}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.timeBadgeText,
              { color: isDarkMode ? '#94A3B8' : '#64748B' },
            ]}
          >
            {filterMode === 'auto' ? timeContext.label : '✨ Tümü'}
          </Text>
        </TouchableOpacity>

        {/* Suggestion Chips */}
        {displayedPrompts.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.chip,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
              disabled && styles.chipDisabled,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              onSelectPrompt(item.text);
            }}
            disabled={disabled}
            activeOpacity={0.75}
          >
            <Text style={styles.chipIcon}>{item.icon}</Text>
            <Text
              style={[styles.chipText, { color: theme.textSecondary }]}
              numberOfLines={1}
            >
              {item.text}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.xs + 2,
    borderTopWidth: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs + 2,
    alignItems: 'center',
  },
  timeBadge: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  timeBadgeText: {
    ...Typography.tiny,
    fontSize: 11,
    fontWeight: '700',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  chipDisabled: {
    opacity: 0.5,
  },
  chipIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  chipText: {
    ...Typography.tiny,
    fontSize: 12,
    fontWeight: '600',
  },
});
