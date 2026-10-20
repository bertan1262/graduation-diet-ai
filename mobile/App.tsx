import React, { useState } from 'react';
import { StyleSheet, View, SafeAreaView, Platform, StatusBar as RNStatusBar } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { getThemeColors } from './src/constants/colors';
import { useDietStore } from './src/store/useDietStore';
import { Header } from './src/components/common/Header';
import { TabBar, TabKey } from './src/components/common/TabBar';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { MealPlanScreen } from './src/screens/MealPlanScreen';
import { CameraScreen } from './src/screens/CameraScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const { isDarkMode } = useDietStore();
  const theme = getThemeColors(isDarkMode);

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'plan':
        return <MealPlanScreen />;
      case 'camera':
        return <CameraScreen />;
      case 'chat':
        return <ChatScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  const getScreenTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'DietAI Günlük';
      case 'plan':
        return 'Haftalık Yemek Planı';
      case 'camera':
        return 'Akıllı Tarayıcı';
      case 'chat':
        return 'Diyetisyen AI';
      case 'profile':
        return 'Profil & Hedefler';
      default:
        return 'DietAI';
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />

      {/* Top Reusable Header with Dark Mode Toggle */}
      <Header
        title={getScreenTitle()}
        onAvatarPress={() => setActiveTab('profile')}
      />

      {/* Dynamic Screen Body */}
      <View style={[styles.body, { backgroundColor: theme.background }]}>{renderActiveScreen()}</View>

      {/* Bottom Floating Navigation Bar */}
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) : 0,
  },
  body: {
    flex: 1,
  },
});
