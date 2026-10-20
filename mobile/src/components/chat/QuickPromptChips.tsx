import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Colors, getThemeColors } from '../../constants/colors';
import { Spacing, BorderRadius, Typography } from '../../constants/theme';
import { useDietStore } from '../../store/useDietStore';

export interface PromptItem {
  id: string;
  icon: string;
  text: string;
}

const DEFAULT_PROMPTS: PromptItem[] = [
  { id: '1', icon: '🥗', text: 'Akşam için hafif ne yiyebilirim?' },
  { id: '2', icon: '🍗', text: 'Proteinimi nasıl tamamlarım?' },
  { id: '3', icon: '🔥', text: 'Günlük kalori hedefim nedir?' },
  { id: '4', icon: '💧', text: 'Bugün ne kadar su içmeliyim?' },
  { id: '5', icon: '🥑', text: 'Tatlı krizini nasıl önlerim?' },
  { id: '6', icon: '🍳', text: 'Kahvaltıda ne önerirsin?' },
];

interface QuickPromptChipsProps {
  onSelectPrompt: (promptText: string) => void;
  disabled?: boolean;
}

export const QuickPromptChips: React.FC<QuickPromptChipsProps> = ({
  onSelectPrompt,
  disabled = false,
}) => {
  const isDarkMode = useDietStore((state) => state.isDarkMode);
  const theme = getThemeColors(isDarkMode);

  return (
    <View style={[styles.container, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
      <ScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {DEFAULT_PROMPTS.map((item) => (
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
            onPress={() => onSelectPrompt(item.text)}
            disabled={disabled}
            activeOpacity={0.75}
          >
            <Text style={styles.chipIcon}>{item.icon}</Text>
            <Text style={[styles.chipText, { color: theme.textSecondary }]} numberOfLines={1}>
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
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs + 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
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
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});
