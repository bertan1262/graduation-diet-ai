import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform } from 'react-native';
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
  const { isDarkMode } = useDietStore();
  const theme = getThemeColors(isDarkMode);

  return (
    <View style={[styles.container, { backgroundColor: theme.tabBarBg, borderTopColor: theme.tabBarBorder }]}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;

        // Elevated centerpiece camera button
        if (tab.isSpecialAction) {
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.specialButtonWrapper}
              onPress={() => onTabChange(tab.key)}
              activeOpacity={0.85}
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
            onPress={() => onTabChange(tab.key)}
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
    paddingTop: Spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? Spacing.xl : Spacing.sm,
    alignItems: 'center',
    justifyContent: 'space-around',
    ...Shadows.floating,
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
