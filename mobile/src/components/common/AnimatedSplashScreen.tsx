import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Animated,
  Dimensions,
  Image,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Colors, getThemeColors } from '../../constants/colors';
import { Spacing, BorderRadius, Typography } from '../../constants/theme';
import { useDietStore } from '../../store/useDietStore';

interface AnimatedSplashScreenProps {
  hasHydrated: boolean;
  onFinish: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const AnimatedSplashScreen: React.FC<AnimatedSplashScreenProps> = ({
  hasHydrated,
  onFinish,
}) => {
  const isDarkMode = useDietStore((state) => state.isDarkMode);
  const theme = getThemeColors(isDarkMode);

  // Animation values (all transforms using native driver)
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const contentSlideAnim = useRef(new Animated.Value(16)).current;
  const exitOpacityAnim = useRef(new Animated.Value(1)).current;
  const exitScaleAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [statusText, setStatusText] = useState('⚡ Profil verileri yükleniyor...');
  const isExitingRef = useRef(false);

  // 1. Entrance & Continuous Pulse Animations
  useEffect(() => {
    // Entrance sequence
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(contentSlideAnim, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 750,
        useNativeDriver: false,
      }),
    ]).start();

    // Subtle rhythmic breathing pulse
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.04,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // Enforce a minimum display time of 800ms for visual polish
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 800);

    // Fail-safe max timeout (2.5 seconds) in case storage hydration hangs
    const safetyTimer = setTimeout(() => {
      triggerExit();
    }, 2500);

    return () => {
      pulseLoop.stop();
      clearTimeout(timer);
      clearTimeout(safetyTimer);
    };
  }, []);

  // 2. Synchronize Hydration & Exit Trigger
  const triggerExit = () => {
    if (isExitingRef.current) return;
    isExitingRef.current = true;
    setStatusText('✓ Hazır!');

    Animated.parallel([
      Animated.timing(exitOpacityAnim, {
        toValue: 0,
        duration: 320,
        useNativeDriver: true,
      }),
      Animated.timing(exitScaleAnim, {
        toValue: 1.05,
        duration: 320,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onFinish();
    });
  };

  useEffect(() => {
    if (hasHydrated && minTimeElapsed && !isExitingRef.current) {
      triggerExit();
    }
  }, [hasHydrated, minTimeElapsed]);

  // Fast-forward dismiss if tapped and hydration is already done
  const handleTap = () => {
    if (hasHydrated && !isExitingRef.current) {
      triggerExit();
    }
  };

  const progressBarWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <TouchableWithoutFeedback onPress={handleTap}>
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: theme.background,
            opacity: exitOpacityAnim,
            transform: [{ scale: exitScaleAnim }],
          },
        ]}
      >
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />

        {/* Ambient Halo Glow */}
        <View
          style={[
            styles.haloRing,
            {
              backgroundColor: isDarkMode
                ? 'rgba(16, 185, 129, 0.08)'
                : 'rgba(16, 185, 129, 0.12)',
            },
          ]}
        />

        {/* Center Brand Identity */}
        <Animated.View
          style={[
            styles.brandCenter,
            {
              opacity: fadeAnim,
              transform: [
                { scale: Animated.multiply(scaleAnim, pulseAnim) },
                { translateY: contentSlideAnim },
              ],
            },
          ]}
        >
          {/* Emblem Icon Card */}
          <View
            style={[
              styles.emblemCard,
              {
                backgroundColor: '#0A0A0E',
                borderColor: 'rgba(255, 71, 87, 0.35)',
                shadowColor: '#FF4757',
              },
            ]}
          >
            <Image
              source={require('../../../assets/icon.png')}
              style={styles.logoImage}
              resizeMode="cover"
            />
          </View>

          {/* Micro Brand Pill */}
          <View
            style={[
              styles.categoryPill,
              {
                backgroundColor: isDarkMode
                  ? 'rgba(255, 71, 87, 0.15)'
                  : '#FEE2E2',
                borderColor: isDarkMode
                  ? 'rgba(255, 71, 87, 0.3)'
                  : '#FECACA',
                borderWidth: 1,
              },
            ]}
          >
            <Text style={[styles.categoryPillText, { color: '#FF4757' }]}>
              🔥 AKILLI KALORİ & BESLENME
            </Text>
          </View>

          {/* Main App Title */}
          <View style={styles.titleRow}>
            <Text style={[styles.titleDiet, { color: theme.textPrimary }]}>Diet</Text>
            <Text style={[styles.titleAi, { color: theme.primary }]}>AI</Text>
          </View>

          {/* Tagline */}
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            Kişiselleştirilmiş Beslenme & Sağlık Asistanı
          </Text>

          {/* Micro Progress Track */}
          <View
            style={[
              styles.progressTrack,
              { backgroundColor: isDarkMode ? '#1E293B' : theme.border },
            ]}
          >
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: progressBarWidth,
                  backgroundColor: theme.primary,
                },
              ]}
            />
          </View>

          {/* Hydration / Readiness Status */}
          <Text style={[styles.statusText, { color: theme.textSecondary }]}>
            {statusText}
          </Text>
        </Animated.View>

        {/* Bottom Version & Model Footnote */}
        <View style={styles.footerContainer}>
          <Text style={[styles.footerText, { color: theme.textMuted }]}>
            DietAI v1.0 • Gemini Destekli Akıllı Analiz
          </Text>
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    zIndex: 99999,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 100,
  },
  haloRing: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.85,
    height: SCREEN_WIDTH * 0.85,
    borderRadius: (SCREEN_WIDTH * 0.85) / 2,
  },
  brandCenter: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emblemCard: {
    width: 96,
    height: 96,
    borderRadius: BorderRadius.xxl,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 8,
    overflow: 'hidden',
  },
  logoImage: {
    width: 96,
    height: 96,
    borderRadius: BorderRadius.xxl,
  },
  categoryPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.xs,
  },
  categoryPillText: {
    ...Typography.tiny,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  titleDiet: {
    ...Typography.display,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  titleAi: {
    ...Typography.display,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    ...Typography.caption,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    letterSpacing: 0.2,
  },
  progressTrack: {
    width: 140,
    height: 3.5,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  progressBar: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  statusText: {
    ...Typography.tiny,
    fontSize: 11,
    letterSpacing: 0.3,
  },
  footerContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 44 : 28,
    alignItems: 'center',
  },
  footerText: {
    ...Typography.tiny,
    fontSize: 11,
  },
});
