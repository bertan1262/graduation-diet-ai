import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Colors, getThemeColors, ThemeColors } from '../constants/colors';
import { Spacing, BorderRadius, Typography, Shadows } from '../constants/theme';
import { ChatMessage, UserDietContext } from '../types';
import { ChatBubble } from '../components/chat/ChatBubble';
import { QuickPromptChips } from '../components/chat/QuickPromptChips';
import { TypingIndicator } from '../components/chat/TypingIndicator';
import { useDietStore } from '../store/useDietStore';
import {
  apiService,
  isMedicalQuery,
  generateContextualMockDietitianReply,
} from '../services/api';

export const ChatScreen: React.FC = () => {
  // Atomic store selectors to prevent unnecessary re-renders
  const userProfile = useDietStore((state) => state.userProfile);
  const todayMeals = useDietStore((state) => state.todayMeals);
  const waterIntakeMl = useDietStore((state) => state.waterIntakeMl);
  const isDarkMode = useDietStore((state) => state.isDarkMode);
  const messages = useDietStore((state) => state.chatMessages);
  const addChatMessage = useDietStore((state) => state.addChatMessage);
  const clearChatMessages = useDietStore((state) => state.clearChatMessages);
  const getDailySummary = useDietStore((state) => state.getDailySummary);
  const useMockData = useDietStore((state) => state.useMockData);

  const theme = getThemeColors(isDarkMode);
  const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 120);
    return () => clearTimeout(timer);
  }, [messages, isTyping]);

  const getTimeString = () => {
    return new Intl.DateTimeFormat('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date());
  };

  // Build client-side user context payload for personalized dietary suggestions
  const buildUserContext = (): UserDietContext => {
    const summary = getDailySummary();
    return {
      targetCalories: userProfile.targetCalories,
      consumedCalories: summary.totalCalories,
      remainingCalories: summary.remainingCalories,
      consumedProtein: summary.totalProtein,
      targetProtein: userProfile.targetProteinGrams,
      consumedCarbs: summary.totalCarbs,
      targetCarbs: userProfile.targetCarbsGrams,
      consumedFat: summary.totalFat,
      targetFat: userProfile.targetFatGrams,
      waterIntakeMl,
      waterGoalMl: userProfile.waterGoalMl,
      goal: userProfile.dietaryGoal,
      currentWeightKg: userProfile.weightKg,
      targetWeightKg: userProfile.targetWeightKg,
      bmr: userProfile.bmr,
      recentMealNames: todayMeals.slice(-5).map((m) => m.name),
    };
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Sohbeti Sıfırla',
      'Diyetisyen ile olan mesaj geçmişini temizlemek ve yeni bir konuşma başlatmak istediğinize emin misiniz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sıfırla',
          style: 'destructive',
          onPress: () => clearChatMessages(),
        },
      ]
    );
  };

  const handleSendMessage = (textToSend?: string) => {
    const rawText = textToSend !== undefined ? textToSend : inputText;
    const trimmed = rawText.trim();
    if (!trimmed || isTyping) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: trimmed,
      timestamp: getTimeString(),
    };

    addChatMessage(userMessage);
    if (textToSend === undefined) {
      setInputText('');
    }
    setIsTyping(true);

    const clientContext = buildUserContext();
    const useMock = useDietStore.getState().useMockData;

    if (useMock) {
      // Deterministic offline context-aware reply
      setTimeout(() => {
        const isMedical = isMedicalQuery(trimmed);
        const replyText = isMedical
          ? 'Sağlığınız her şeyden önemlidir. DietAI genel beslenme ve kalori rehberliği sunar; tıbbi tanı koyamaz ve ilaç tedavisi öneremez. Lütfen bu durumu mutlaka hekiminize veya uzman bir klinik diyetisyene danışınız.'
          : generateContextualMockDietitianReply(trimmed, clientContext);

        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          sender: 'assistant',
          content: replyText,
          timestamp: getTimeString(),
          isMedicalWarning: isMedical,
          safety_flag_triggered: isMedical,
        };

        addChatMessage(assistantMessage);
        setIsTyping(false);
      }, 700);
    } else {
      // Live backend integration with metadata payload and graceful offline fallback
      apiService
        .sendChatMessage(trimmed, clientContext)
        .then((liveMessage) => {
          addChatMessage({
            ...liveMessage,
            isMedicalWarning: Boolean(
              liveMessage.isMedicalWarning || liveMessage.safety_flag_triggered
            ),
            timestamp: getTimeString(),
          });
        })
        .catch(() => {
          addChatMessage({
            id: `assistant-${Date.now()}`,
            sender: 'assistant',
            content:
              '⚠️ Sunucuya şu anda ulaşılamadı. Bağlantınızı kontrol edip mesajınızı tekrar gönderin.',
            timestamp: getTimeString(),
          });
        })
        .finally(() => {
          setIsTyping(false);
        });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screenContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* 1. Header Bar with Clear Chat Action */}
      <View style={styles.topHeader}>
        <View style={styles.headerTitleGroup}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarEmoji}>🤖</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>DietAI Diyetisyeni</Text>
            <View style={styles.headerStatusRow}>
              <View style={[styles.onlineDot, useMockData && styles.mockDot]} />
              <Text style={styles.headerSubtitle}>
                {useMockData ? 'Demo Modu • Çevrimdışı Veri' : 'Çevrimiçi • Beslenme Koçu'}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClearHistory}
          activeOpacity={0.7}
        >
          <Text style={styles.clearButtonText}>🗑️ Sıfırla</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Legal Safety Guardrail Banner */}
      <View style={styles.safetyBanner}>
        <Text style={styles.safetyIcon}>🛡️</Text>
        <Text style={styles.safetyText}>
          <Text style={styles.safetyBold}>Tıbbi Sorumluluk Reddi: </Text>
          DietAI genel beslenme ve kalori rehberliği sunar; tıbbi tanı koyamaz ve ilaç tedavisi öneremez.
        </Text>
      </View>

      {/* 3. Messages Stream */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ChatBubble message={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="interactive"
        ListFooterComponent={isTyping ? <TypingIndicator /> : undefined}
      />

      {/* 4. Interactive Quick Prompt Suggestion Chips (Time-of-day aware) */}
      <QuickPromptChips
        onSelectPrompt={(promptText) => handleSendMessage(promptText)}
        disabled={isTyping}
      />

      {/* 5. Interactive Input Bar */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Diyetisyeninize bir soru sorun..."
          placeholderTextColor={theme.textPlaceholder}
          value={inputText}
          onChangeText={setInputText}
          multiline={true}
          maxLength={300}
        />

        <TouchableOpacity
          style={[
            styles.sendButton,
            !inputText.trim() && styles.sendButtonDisabled,
          ]}
          onPress={() => handleSendMessage()}
          disabled={!inputText.trim() || isTyping}
          activeOpacity={0.8}
        >
          <Text style={styles.sendButtonIcon}>⬆️</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const createStyles = (theme: ThemeColors, isDarkMode: boolean) =>
  StyleSheet.create({
    screenContainer: {
      flex: 1,
      backgroundColor: theme.background,
    },
    topHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm + 2,
      backgroundColor: theme.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      ...Shadows.subtle,
    },
    headerTitleGroup: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDarkMode ? '#1E293B' : Colors.primaryMuted,
      borderWidth: 1,
      borderColor: isDarkMode ? '#334155' : Colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.sm,
    },
    headerAvatarEmoji: {
      fontSize: 18,
    },
    headerTitle: {
      ...Typography.subtitle,
      fontSize: 15,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    headerStatusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,
    },
    onlineDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: Colors.primary,
      marginRight: 5,
    },
    mockDot: {
      backgroundColor: '#F59E0B',
    },
    headerSubtitle: {
      ...Typography.tiny,
      fontSize: 11,
      color: theme.textMuted,
    },
    clearButton: {
      paddingHorizontal: Spacing.sm + 2,
      paddingVertical: 5,
      borderRadius: BorderRadius.md,
      backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
      borderWidth: 1,
      borderColor: isDarkMode ? '#334155' : '#E2E8F0',
    },
    clearButtonText: {
      ...Typography.tiny,
      fontSize: 11,
      fontWeight: '600',
      color: isDarkMode ? '#94A3B8' : '#64748B',
    },
    safetyBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#172554' : '#EFF6FF',
      paddingVertical: Spacing.xs + 2,
      paddingHorizontal: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#1E3A8A' : '#DBEAFE',
    },
    safetyIcon: {
      fontSize: 13,
      marginRight: Spacing.xs,
    },
    safetyText: {
      ...Typography.tiny,
      fontSize: 11,
      color: isDarkMode ? '#93C5FD' : '#1E40AF',
      flex: 1,
      lineHeight: 15,
    },
    safetyBold: {
      fontWeight: '700',
    },
    listContent: {
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.sm,
      paddingBottom: Spacing.lg,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      backgroundColor: theme.surface,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      ...Shadows.card,
    },
    textInput: {
      flex: 1,
      minHeight: 40,
      maxHeight: 100,
      backgroundColor: theme.surfaceSubtle,
      borderRadius: BorderRadius.xl,
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.sm,
      paddingBottom: Spacing.sm,
      ...Typography.body,
      color: theme.textPrimary,
    },
    sendButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: Colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: Spacing.sm,
      marginBottom: 1,
      ...Shadows.subtle,
    },
    sendButtonDisabled: {
      backgroundColor: isDarkMode ? '#334155' : Colors.borderDark,
      opacity: 0.6,
    },
    sendButtonIcon: {
      fontSize: 18,
    },
  });
