import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors, getThemeColors } from '../../constants/colors';
import { Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { useDietStore } from '../../store/useDietStore';

export type TabKey = 'dashboard' | 'plan' | 'camera' | 'chat' | 'profile';

interface TabItem {
  key: TabKey;
  label: string;
  icon: string;
  isSpecialAction?: boolean;
}

const TABS: TabItem[] = [
  { key: 'dashboard', label: 'Özet', icon: '📊' },
  { key: 'plan', label: 'Plan', icon: '🥗' },
  { key: 'camera', label: 'Kamera', icon: '📸', isSpecialAction: true },
  { key: 'chat', label: 'Danışman', icon: '💬' },
  { key: 'profile', label: 'Profil', icon: '👤' },
];

interface TabBarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

export const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange }) => {
  const isDarkMode = useDietStore((state) => state.isDarkMode);
  const theme = getThemeColors(isDarkMode);
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'ios' ? Spacing.sm : Spacing.xs);

  const handlePress = (tabKey: TabKey) => {
    if (tabKey !== activeTab) {
      if (tabKey === 'camera') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
    }
    onTabChange(tabKey);
  };

  return (
    <View
      style={[
        styles.container,
        {
          borderTopColor: theme.tabBarBorder,
          paddingBottom: bottomPadding,
        },
      ]}
    >
      {/* Blurred Translucent Background Layer */}
      <View
        style={[
          StyleSheet.absoluteFill,
          styles.backgroundFill,
          {
            backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.78)' : 'rgba(255, 255, 255, 0.82)',
          },
        ]}
        pointerEvents="none"
      >
        <BlurView
          intensity={Platform.OS === 'ios' ? 70 : 100}
          tint={isDarkMode ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
      </View>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;

        // Elevated centerpiece camera button
        if (tab.isSpecialAction) {
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.specialButtonWrapper}
              onPress={() => handlePress(tab.key)}
              activeOpacity={0.85}
              hitSlop={{ top: 16, bottom: 8, left: 16, right: 16 }}
            >
              <View
                style={[
                  styles.specialButton,
                  { borderColor: theme.surface, backgroundColor: theme.primary },
                  isActive && { backgroundColor: theme.primaryDark, transform: [{ scale: 1.05 }] },
                ]}
              >
                <Text style={styles.specialIcon}>{tab.icon}</Text>
              </View>
              <Text
                style={[
                  styles.specialLabel,
                  { color: isActive ? theme.primary : theme.tabInactive },
                  isActive && { fontWeight: '700' },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabItem}
            onPress={() => handlePress(tab.key)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.iconWrapper,
                isActive && { backgroundColor: theme.primaryMuted },
              ]}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
            </View>
            <Text
              style={[
                styles.tabLabel,
                { color: isActive ? (isDarkMode ? theme.primary : Colors.primaryDark) : theme.tabInactive },
                isActive && { fontWeight: '700' },
              ]}
            >
              {tab.label}
            </Text>
            {isActive && <View style={[styles.activeDot, { backgroundColor: theme.primary }]} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    overflow: 'visible',
    paddingTop: Spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? Spacing.xl : Spacing.sm,
    alignItems: 'center',
    justifyContent: 'space-around',
    ...Shadows.floating,
  },
  backgroundFill: {
    overflow: 'hidden',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
  },
  iconWrapper: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  tabIcon: {
    fontSize: 22,
  },
  tabLabel: {
    ...Typography.tiny,
    marginTop: 2,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: BorderRadius.full,
    marginTop: 3,
  },
  specialButtonWrapper: {
    flex: 1,
    alignItems: 'center',
    marginTop: -20, // Floating center camera button
  },
  specialButton: {
    width: 54,
    height: 54,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    ...Shadows.floating,
  },
  specialIcon: {
    fontSize: 24,
  },
  specialLabel: {
    ...Typography.tiny,
    marginTop: 4,
  },
});
