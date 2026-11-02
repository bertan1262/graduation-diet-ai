import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  AppState,
  BackHandler,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
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
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { AnimatedSplashScreen } from './src/components/common/AnimatedSplashScreen';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const isDarkMode = useDietStore((state) => state.isDarkMode);
  const hasHydrated = useDietStore((state) => state.hasHydrated);
  const checkAndRollOverDay = useDietStore((state) => state.checkAndRollOverDay);
  const hasCompletedOnboarding = useDietStore((state) => state.hasCompletedOnboarding);
  const setHasCompletedOnboarding = useDietStore((state) => state.setHasCompletedOnboarding);
  const theme = getThemeColors(isDarkMode);

  // Android hardware / gesture back button: return to dashboard tab first
  useEffect(() => {
    const onBackPress = () => {
      if (activeTab !== 'dashboard') {
        setActiveTab('dashboard');
        return true;
      }
      return false;
    };

    const backSubscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    );

    return () => {
      backSubscription.remove();
    };
  }, [activeTab]);

  useEffect(() => {
    // Check if midnight rolled over on mount
    checkAndRollOverDay();

    // Re-check whenever user returns to the app from background
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkAndRollOverDay();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [checkAndRollOverDay]);

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
    <SafeAreaProvider>
      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={[styles.safeArea, { backgroundColor: theme.background }]}
      >
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />

        {/* Once hydrated, mount the appropriate application branch */}
        {hasHydrated && (
          !hasCompletedOnboarding ? (
            <OnboardingScreen
              isEditing={false}
              onComplete={() => {
                setHasCompletedOnboarding(true);
                setActiveTab('dashboard');
              }}
            />
          ) : (
            <>
              {/* Top Reusable Header with Dark Mode Toggle */}
              <Header
                title={getScreenTitle()}
                onAvatarPress={() => setActiveTab('profile')}
              />

              {/* Persistent Screen Body: Preserves scroll positions, local form inputs & active day tabs */}
              <View style={[styles.body, { backgroundColor: theme.background }]}>
                <View style={[styles.tabContent, activeTab !== 'dashboard' && styles.hiddenContent]}>
                  <DashboardScreen />
                </View>
                <View style={[styles.tabContent, activeTab !== 'plan' && styles.hiddenContent]}>
                  <MealPlanScreen />
                </View>
                <View style={[styles.tabContent, activeTab !== 'camera' && styles.hiddenContent]}>
                  <CameraScreen
                    isActive={activeTab === 'camera'}
                    onNavigateToDashboard={() => setActiveTab('dashboard')}
                  />
                </View>
                <View style={[styles.tabContent, activeTab !== 'chat' && styles.hiddenContent]}>
                  <ChatScreen />
                </View>
                <View style={[styles.tabContent, activeTab !== 'profile' && styles.hiddenContent]}>
                  <ProfileScreen />
                </View>
              </View>

              {/* Bottom Floating Navigation Bar */}
              <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
            </>
          )
        )}

        {/* Non-blocking Lightweight Animated Splash Screen */}
        {isSplashVisible && (
          <AnimatedSplashScreen
            hasHydrated={hasHydrated}
            onFinish={() => setIsSplashVisible(false)}
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
  },
  hiddenContent: {
    display: 'none',
  },
});
