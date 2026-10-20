import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated } from 'react-native';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';

export const TypingIndicator: React.FC = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createBounceAnimation = (anim: Animated.Value) => {
      return Animated.sequence([
        Animated.timing(anim, {
          toValue: -5,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]);
    };

    const loopAnim = Animated.loop(
      Animated.stagger(150, [
        createBounceAnimation(dot1),
        createBounceAnimation(dot2),
        createBounceAnimation(dot3),
      ])
    );

    loopAnim.start();

    return () => {
      loopAnim.stop();
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* Assistant Header */}
      <View style={styles.assistantHeader}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarEmoji}>🤖</Text>
        </View>
        <Text style={styles.assistantName}>DietAI Diyetisyeni</Text>
        <View style={styles.activeDot} />
      </View>

      {/* Typing Bubble with 3 Bouncing Emerald Dots */}
      <View style={styles.bubble}>
        <View style={styles.dotsRow}>
          <Animated.View
            style={[
              styles.dot,
              { transform: [{ translateY: dot1 }] },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              { transform: [{ translateY: dot2 }] },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              { transform: [{ translateY: dot3 }] },
            ]}
          />
        </View>
        <Text style={styles.typingLabel}>Yanıt hazırlanıyor...</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.xs,
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  assistantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    marginLeft: Spacing.xs,
  },
  avatarCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  avatarEmoji: {
    fontSize: 12,
  },
  assistantName: {
    ...Typography.tiny,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginLeft: 4,
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md + 2,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.xl,
    borderTopLeftRadius: BorderRadius.xs,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.subtle,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginRight: Spacing.sm,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.primary,
  },
  typingLabel: {
    ...Typography.tiny,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
});
