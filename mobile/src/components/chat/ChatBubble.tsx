import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, getThemeColors } from '../../constants/colors';
import { Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { ChatMessage } from '../../types';
import { useDietStore } from '../../store/useDietStore';

interface ChatBubbleProps {
  message: ChatMessage;
}

/**
 * Lightweight inline markdown renderer for bold (**text**) and bullet lists (• item)
 * Avoids heavy 3rd-party dependencies while preserving React 19 fast rendering.
 */
const renderFormattedText = (
  content: string,
  baseStyle: object,
  boldStyle: object,
  keyPrefix: string
) => {
  const lines = content.split('\n');

  return lines.map((line, lineIdx) => {
    // Check if line is a bullet item
    const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-');
    const lineText = isBullet ? line.trim().replace(/^[•\-]\s*/, '') : line;

    // Split by **bold** delimiters
    const parts = lineText.split(/(\*\*.*?\*\*)/g);

    return (
      <View
        key={`${keyPrefix}-line-${lineIdx}`}
        style={[
          styles.textLineRow,
          isBullet && styles.bulletLineRow,
          lineIdx > 0 && !isBullet && styles.paragraphSpacing,
        ]}
      >
        {isBullet && (
          <Text style={[baseStyle, styles.bulletDot]}>•</Text>
        )}
        <Text style={[baseStyle, isBullet && styles.bulletContent]}>
          {parts.map((part, partIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              const boldContent = part.slice(2, -2);
              return (
                <Text
                  key={`${keyPrefix}-${lineIdx}-${partIdx}`}
                  style={boldStyle}
                >
                  {boldContent}
                </Text>
              );
            }
            return part;
          })}
        </Text>
      </View>
    );
  });
};

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isDarkMode = useDietStore((state) => state.isDarkMode);
  const theme = getThemeColors(isDarkMode);
  const isUser = message.sender === 'user';

  const baseTextStyle = isUser
    ? styles.messageTextUser
    : [styles.messageTextAssistant, { color: theme.textPrimary }];

  const boldTextStyle = isUser
    ? styles.messageTextUserBold
    : [styles.messageTextAssistantBold, { color: isDarkMode ? '#6EE7B7' : Colors.primaryDark }];

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
          <View
            style={[
              styles.avatarCircle,
              {
                backgroundColor: isDarkMode ? '#1E293B' : Colors.primaryMuted,
                borderColor: isDarkMode ? '#334155' : Colors.primaryLight,
              },
            ]}
          >
            <Text style={styles.avatarEmoji}>🤖</Text>
          </View>
          <Text style={[styles.assistantName, { color: theme.textSecondary }]}>
            DietAI Diyetisyeni
          </Text>
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
        <View style={styles.contentWrapper}>
          {renderFormattedText(
            message.content,
            baseTextStyle,
            boldTextStyle,
            message.id
          )}
        </View>

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

      {/* Optional Medical Safety Warning Card */}
      {message.isMedicalWarning && (
        <View
          style={[
            styles.medicalWarningCard,
            {
              backgroundColor: isDarkMode ? '#3F1212' : '#FEF2F2',
              borderColor: isDarkMode ? '#7F1D1D' : '#FECACA',
            },
          ]}
        >
          <Text style={styles.medicalWarningIcon}>⚠️</Text>
          <Text
            style={[
              styles.medicalWarningText,
              { color: isDarkMode ? '#FCA5A5' : '#991B1B' },
            ]}
          >
            Bu tavsiye genel beslenme rehberidir. Kronik rahatsızlıklarınız veya ilaç tedaviniz için lütfen hekiminize danışın.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.xs + 2,
    maxWidth: '86%',
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
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  avatarEmoji: {
    fontSize: 13,
  },
  assistantName: {
    ...Typography.tiny,
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
    paddingHorizontal: Spacing.md + 2,
    paddingVertical: Spacing.md - 2,
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
    borderTopLeftRadius: BorderRadius.xs,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  contentWrapper: {
    flexDirection: 'column',
  },
  textLineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  bulletLineRow: {
    flexDirection: 'row',
    paddingLeft: Spacing.xs,
    marginVertical: 2,
  },
  bulletDot: {
    marginRight: 6,
    fontWeight: '700',
  },
  bulletContent: {
    flex: 1,
  },
  paragraphSpacing: {
    marginTop: 4,
  },
  messageTextUser: {
    ...Typography.body,
    fontSize: 14,
    lineHeight: 21,
    color: '#FFFFFF',
    fontWeight: '400',
  },
  messageTextUserBold: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  messageTextAssistant: {
    ...Typography.body,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '400',
  },
  messageTextAssistantBold: {
    fontWeight: '700',
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
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    marginTop: 6,
    marginLeft: Spacing.xs,
  },
  medicalWarningIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  medicalWarningText: {
    ...Typography.tiny,
    fontSize: 10,
    flex: 1,
    lineHeight: 14,
  },
});
