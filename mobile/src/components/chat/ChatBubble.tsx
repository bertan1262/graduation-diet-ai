import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, getThemeColors } from '../../constants/colors';
import { Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { ChatMessage } from '../../types';
import { useDietStore } from '../../store/useDietStore';

interface ChatBubbleProps {
  message: ChatMessage;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isDarkMode = useDietStore((state) => state.isDarkMode);
  const theme = getThemeColors(isDarkMode);
  const isUser = message.sender === 'user';

  return (
    <View
      style={[
        styles.container,
        isUser ? styles.containerUser : styles.containerAssistant,
      ]}
    >
      {/* Assistant Header with AI Avatar */}
      {!isUser && (
        <View style={styles.assistantHeader}>
          <View style={[styles.avatarCircle, { backgroundColor: isDarkMode ? '#1E293B' : Colors.primaryMuted, borderColor: isDarkMode ? '#334155' : Colors.primaryLight }]}>
            <Text style={styles.avatarEmoji}>🤖</Text>
          </View>
          <Text style={[styles.assistantName, { color: theme.textSecondary }]}>DietAI Diyetisyeni</Text>
          <View style={styles.verifiedDot} />
        </View>
      )}

      {/* Bubble Body */}
      <View
        style={[
          styles.bubble,
          isUser
            ? styles.bubbleUser
            : [
                styles.bubbleAssistant,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ],
        ]}
      >
        <Text
          style={[
            styles.messageText,
            isUser
              ? styles.messageTextUser
              : [styles.messageTextAssistant, { color: theme.textPrimary }],
          ]}
        >
          {message.content}
        </Text>

        {/* Timestamp */}
        <Text
          style={[
            styles.timestampText,
            isUser ? styles.timestampUser : styles.timestampAssistant,
          ]}
        >
          {message.timestamp}
        </Text>
      </View>

      {/* Optional Medical Safety Note */}
      {message.isMedicalWarning && (
        <View style={styles.medicalWarningCard}>
          <Text style={styles.medicalWarningIcon}>⚠️</Text>
          <Text style={styles.medicalWarningText}>
            Bu tavsiye genel beslenme rehberidir. Kronik rahatsızlıklarınız için lütfen hekiminize danışın.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.xs + 2,
    maxWidth: '84%',
  },
  containerUser: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  containerAssistant: {
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
  verifiedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginLeft: 4,
  },
  bubble: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    ...Shadows.subtle,
  },
  bubbleUser: {
    backgroundColor: Colors.primary,
    borderTopRightRadius: BorderRadius.xs,
    borderBottomRightRadius: BorderRadius.xl,
    borderBottomLeftRadius: BorderRadius.xl,
    borderTopLeftRadius: BorderRadius.xl,
  },
  bubbleAssistant: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xs,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  messageText: {
    ...Typography.body,
    lineHeight: 22,
  },
  messageTextUser: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  messageTextAssistant: {
    color: Colors.textPrimary,
  },
  timestampText: {
    ...Typography.tiny,
    fontSize: 10,
    marginTop: 4,
  },
  timestampUser: {
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'right',
  },
  timestampAssistant: {
    color: Colors.textMuted,
    textAlign: 'left',
  },
  medicalWarningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    marginTop: 4,
    marginLeft: Spacing.xs,
  },
  medicalWarningIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  medicalWarningText: {
    ...Typography.tiny,
    fontSize: 10,
    color: '#991B1B',
    flex: 1,
    lineHeight: 14,
  },
});
