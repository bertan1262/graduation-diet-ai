import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Colors, getThemeColors } from '../../constants/colors';
import { Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { useDietStore } from '../../store/useDietStore';
import { useLiveToday } from '../../utils/dateUtils';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showAvatar?: boolean;
  onAvatarPress?: () => void;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'DietAI',
  subtitle,
  showAvatar = true,
  onAvatarPress,
  rightAction,
}) => {
  const userName = useDietStore((state) => state.userProfile?.name);
  const isDarkMode = useDietStore((state) => state.isDarkMode);
  const toggleDarkMode = useDietStore((state) => state.toggleDarkMode);
  const theme = getThemeColors(isDarkMode);
  const { formattedHeaderDate } = useLiveToday();

  const initials =
    (userName || 'Diet AI')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'DA';

  // Format current date in Turkish if no custom subtitle provided
  const formattedDate = subtitle || formattedHeaderDate;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.78)' : 'rgba(255, 255, 255, 0.82)',
          borderBottomColor: theme.border,
        },
      ]}
    >
      <BlurView
        intensity={Platform.OS === 'ios' ? 70 : 100}
        tint={isDarkMode ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.textContainer}>
        <View style={styles.brandRow}>
          <Text style={styles.leafIcon}>🥗</Text>
          <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
        </View>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>{formattedDate}</Text>
      </View>

      <View style={styles.actionContainer}>
        {rightAction ? (
          rightAction
        ) : (
          <View style={styles.actionsRow}>
            {/* Quick Dark Mode / Light Mode Switcher */}
            <TouchableOpacity
              style={[
                styles.themeToggleBtn,
                { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                toggleDarkMode();
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.themeToggleIcon}>{isDarkMode ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>

            {showAvatar && (
              <TouchableOpacity
                style={[
                  styles.avatarButton,
                  { backgroundColor: theme.primaryMuted, borderColor: theme.primary },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  onAvatarPress?.();
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.avatarText, { color: isDarkMode ? theme.primary : Colors.primaryDark }]}>
                  {initials}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    ...Shadows.soft,
  },
  textContainer: {
    flex: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leafIcon: {
    fontSize: 20,
    marginRight: Spacing.xs,
  },
  title: {
    ...Typography.h2,
  },
  subtitle: {
    ...Typography.caption,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  actionContainer: {
    marginLeft: Spacing.md,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  themeToggleBtn: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeToggleIcon: {
    fontSize: 18,
  },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...Typography.captionBold,
  },
});
