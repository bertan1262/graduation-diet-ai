import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Animated,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';

export interface ScanningOverlayProps {
  imageUri: string;
  onScanComplete: () => void;
  onCancel: () => void;
}

const STAGES = [
  { text: 'Görsel optimize ediliyor...', percent: 28 },
  { text: 'DietAI tabağınızdaki yemekleri tespit ediyor...', percent: 65 },
  { text: 'Porsiyon ve makro besinler hesaplanıyor...', percent: 94 },
  { text: 'Yapay zekâ analizi tamamlandı! 🎉', percent: 100 },
];

const RETICLE_SIZE = 280;

export const ScanningOverlay: React.FC<ScanningOverlayProps> = ({
  imageUri,
  onScanComplete,
  onCancel,
}) => {
  const [stageIndex, setStageIndex] = useState(0);

  // Animated laser scan position (0 -> 1 -> 0)
  const scanAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation for status pill
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Oscillating 60fps laser beam animation
    const scanLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    scanLoop.start();

    // 2. Gentle pulsing for status indicator
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // 3. Stage progression timers with comfortable reading intervals
    const timer1 = setTimeout(() => setStageIndex(1), 900); // 2. Stage (%65)
    const timer2 = setTimeout(() => setStageIndex(2), 1900); // 3. Stage (%94)
    const timer3 = setTimeout(() => setStageIndex(3), 2900); // 4. Stage (%100)
    const finishTimer = setTimeout(() => {
      onScanComplete();
    }, 3800); // Completion callback fires 900ms after reaching 100%

    return () => {
      scanLoop.stop();
      pulseLoop.stop();
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(finishTimer);
    };
  }, []);

  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, RETICLE_SIZE - 6],
  });

  const currentStage = STAGES[stageIndex];

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* 1. Frozen Background Image */}
      <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />

      {/* 2. Semi-transparent Darkened Sci-Fi Tint */}
      <View style={styles.darkTint} />

      {/* 3. Overlay Content */}
      <View style={styles.container}>
        {/* Top Header Bar */}
        <View style={styles.headerBar}>
          <View style={styles.aiBadge}>
            <Animated.View style={[styles.aiDot, { transform: [{ scale: pulseAnim }] }]} />
            <Text style={styles.aiBadgeText}>DietAI Vision Engine v1.0</Text>
          </View>

          <TouchableOpacity style={styles.cancelButton} onPress={onCancel} activeOpacity={0.75}>
            <Text style={styles.cancelButtonText}>İptal</Text>
          </TouchableOpacity>
        </View>

        {/* Center Laser Scanning Area */}
        <View style={styles.reticleContainer}>
          <View style={styles.reticleFrame}>
            {/* Corner Tech Brackets */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />

            {/* Glowing Laser Beam Traversal */}
            <Animated.View
              style={[
                styles.laserBeamContainer,
                {
                  transform: [{ translateY }],
                },
              ]}
            >
              {/* Laser Trail Glow */}
              <View style={styles.laserTrailGlow} />
              {/* Laser Core Line */}
              <View style={styles.laserBeamLine} />
            </Animated.View>

            {/* Reticle Tech Tag */}
            <View style={styles.reticleCenterTag}>
              <Text style={styles.reticleCenterText}>
                TARANIYOR %{currentStage.percent}
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom AI Status Pill and Progress Indicator */}
        <View style={styles.bottomStatusContainer}>
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Animated.Text style={[styles.statusIcon, { transform: [{ scale: pulseAnim }] }]}>
                🧠
              </Animated.Text>
              <View style={styles.statusTextGroup}>
                <Text style={styles.statusTitle}>Yemek Analiz Ediliyor</Text>
                <Text style={styles.statusSubtitle} numberOfLines={1}>
                  {currentStage.text}
                </Text>
              </View>
              <Text style={styles.percentText}>%{currentStage.percent}</Text>
            </View>

            {/* Horizontal Mini Progress Track */}
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${currentStage.percent}%` },
                ]}
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  darkTint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  aiDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginRight: Spacing.xs,
  },
  aiBadgeText: {
    ...Typography.tiny,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cancelButton: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  cancelButtonText: {
    ...Typography.tiny,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  reticleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  reticleFrame: {
    width: RETICLE_SIZE,
    height: RETICLE_SIZE,
    borderRadius: BorderRadius.xxl,
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: Colors.primary,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: BorderRadius.md,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: BorderRadius.md,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: BorderRadius.md,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: BorderRadius.md,
  },
  laserBeamContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 48,
    alignItems: 'center',
  },
  laserTrailGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 44,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  laserBeamLine: {
    width: '100%',
    height: 3.5,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 8,
  },
  reticleCenterTag: {
    position: 'absolute',
    bottom: Spacing.sm,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  reticleCenterText: {
    ...Typography.tiny,
    fontSize: 10,
    color: Colors.primaryLight,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  bottomStatusContainer: {
    marginBottom: Spacing.lg,
  },
  statusCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    ...Shadows.card,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  statusIcon: {
    fontSize: 28,
    marginRight: Spacing.md,
  },
  statusTextGroup: {
    flex: 1,
  },
  statusTitle: {
    ...Typography.bodyBold,
    color: '#FFFFFF',
  },
  statusSubtitle: {
    ...Typography.tiny,
    color: Colors.primaryLight,
    marginTop: 2,
  },
  percentText: {
    ...Typography.h3,
    color: Colors.primary,
    fontWeight: '700',
    marginLeft: Spacing.sm,
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
});
