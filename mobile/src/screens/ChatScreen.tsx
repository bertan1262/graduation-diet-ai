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
} from 'react-native';
import { Colors, getThemeColors, ThemeColors } from '../constants/colors';
import { Spacing, BorderRadius, Typography, Shadows } from '../constants/theme';
import { ChatMessage } from '../types';
import { ChatBubble } from '../components/chat/ChatBubble';
import { QuickPromptChips } from '../components/chat/QuickPromptChips';
import { TypingIndicator } from '../components/chat/TypingIndicator';
import { useDietStore } from '../store/useDietStore';
import { apiService } from '../services/api';

export const ChatScreen: React.FC = () => {
  const userProfile = useDietStore((state) => state.userProfile);
  const isDarkMode = useDietStore((state) => state.isDarkMode);
  const theme = getThemeColors(isDarkMode);
  const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);

  const initialAssistantMessage: ChatMessage = {
    id: 'msg-welcome',
    sender: 'assistant',
    content: `Merhaba ${userProfile.name}! 👋 Ben DietAI yapay zekâ beslenme danışmanınızım.\n\nGünlük ${userProfile.targetCalories} kcal hedefiniz ve ${userProfile.targetProteinGrams}g protein ihtiyacınız doğrultusunda tabağınızı analiz edebilir, ara öğün önerileri sunabilir veya makro dengenizi optimize edebilirim. Bugün size nasıl yardımcı olabilirim?`,
    timestamp: '09:00',
  };

  const [messages, setMessages] = useState<ChatMessage[]>([initialAssistantMessage]);
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

  // Smart Contextual AI Dietitian Responder
  const generateDietitianResponse = (userPrompt: string): { content: string; isMedicalWarning?: boolean } => {
    const query = userPrompt.toLowerCase();

    if (
      query.includes('ilaç') ||
      query.includes('tedavi') ||
      query.includes('hastalık') ||
      query.includes('ağrı') ||
      query.includes('reçete') ||
      query.includes('tansiyon') ||
      query.includes('diyabet')
    ) {
      return {
        content:
          'Sağlığınız her şeyden önemlidir. DietAI genel beslenme ve kalori rehberliği sunar; tıbbi tanı koyamaz ve ilaç tedavisi öneremez. Lütfen bu durumu mutlaka hekiminize veya uzman bir klinik diyetisyene danışınız.',
        isMedicalWarning: true,
      };
    }

    if (query.includes('protein')) {
      return {
        content: `Günlük protein hedefiniz ${userProfile.targetProteinGrams}g olarak belirlendi. Kas onarımı ve uzun süreli tokluk için öğünlerinizde ızgara tavuk göğsü, yumurta, lor peyniri, somon veya kinoa gibi yüksek kaliteli protein kaynaklarına yer verebilirsiniz. 🍗🥚`,
      };
    }

    if (query.includes('su') || query.includes('hidrasyon')) {
      return {
        content: `Harika bir konu! Günlük su hedefiniz ${userProfile.waterGoalMl} ml. Yeterli hidrasyon metabolizma hızınızı destekler ve sahte açlık krizlerini önler. Gün boyunca küçük yudumlarla su içmeyi ihmal etmeyin! 💧`,
      };
    }

    if (query.includes('kalori') || query.includes('kilo') || query.includes('bmr')) {
      return {
        content: `Mevcut BMR değeriniz ${userProfile.bmr} kcal, günlük hedefiniz ise ${userProfile.targetCalories} kcal'dir. Kalori açığınızı çok sert yapmadan, besin değeri yüksek gıdalarla ilerlemek yağ yakımını sürdürülebilir kılar. 🔥`,
      };
    }

    if (query.includes('akşam') || query.includes('gece')) {
      return {
        content:
          'Akşam öğünlerinde sindirimi kolay, glisemik indeksi düşük alternatifler tercih etmek kaliteli uyku ve yağ yakımı için idealdir. Örneğin buharda sebzeler eşliğinde ızgara balık veya zeytinyağlı taze mevsim salatası harika bir seçimdir. 🥗',
      };
    }

    if (query.includes('kahvaltı') || query.includes('sabah')) {
      return {
        content:
          'Güne kan şekerini dengede tutan protein ağırlıklı bir kahvaltıyla başlamak gün boyu tatlı ataklarını önler. 2 haşlanmış yumurta, çeyrek avokado ve bol yeşillik veya yulaf ezmesi tabağı güne harika bir başlangıç sağlar! 🍳',
      };
    }

    if (query.includes('tatlı') || query.includes('şeker') || query.includes('kriz')) {
      return {
        content:
          'Tatlı krizleri genellikle kan şekeri dalgalanması veya yetersiz proteinden kaynaklanır. Bitter çikolata (%80+), bir avuç badem ile tarçınlı yeşil elma dilimleri veya kakaolu lor tatlısı krizleri sağlıklı şekilde durdurur. 🍎🍫',
      };
    }

    return {
      content:
        'Beslenme hedeflerinizi titizlikle takip ediyorum! Günlük makrolarınızda temiz protein ve kompleks karbonhidratları dengeli tutarak enerjinizi zirvede tutabilirsiniz. Tabağınızdaki yemeklerin analizi veya alternatif tarifler için dilediğinizi sorabilirsiniz. 🥑✨',
    };
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

    setMessages((prev) => [...prev, userMessage]);
    if (textToSend === undefined) {
      setInputText('');
    }
    setIsTyping(true);

    const useMock = useDietStore.getState().useMockData;

    if (useMock) {
      // Offline local simulation
      setTimeout(() => {
        const responseData = generateDietitianResponse(trimmed);
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          sender: 'assistant',
          content: responseData.content,
          timestamp: getTimeString(),
          isMedicalWarning: responseData.isMedicalWarning,
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setIsTyping(false);
      }, 750);
    } else {
      // Live backend integration with graceful offline fallback
      apiService
        .sendChatMessage(trimmed)
        .then((liveMessage) => {
          setMessages((prev) => [
            ...prev,
            {
              ...liveMessage,
              timestamp: getTimeString(),
            },
          ]);
        })
        .catch(() => {
          const fallback = generateDietitianResponse(trimmed);
          setMessages((prev) => [
            ...prev,
            {
              id: `assistant-${Date.now()}`,
              sender: 'assistant',
              content: fallback.content,
              timestamp: getTimeString(),
              isMedicalWarning: fallback.isMedicalWarning,
            },
          ]);
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
      {/* 1. Legal Safety Guardrail Banner */}
      <View style={styles.safetyBanner}>
        <Text style={styles.safetyIcon}>🛡️</Text>
        <Text style={styles.safetyText}>
          <Text style={styles.safetyBold}>Tıbbi Sorumluluk Reddi: </Text>
          DietAI tıbbi tanı koymaz ve reçete vermez. Genel beslenme ve makro dengesi rehberliği sunar.
        </Text>
      </View>

      {/* 2. Messages Stream */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ChatBubble message={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={isTyping ? <TypingIndicator /> : null}
      />

      {/* 3. Day 14: Interactive Quick Prompt Suggestion Chips */}
      <QuickPromptChips
        onSelectPrompt={(promptText) => handleSendMessage(promptText)}
        disabled={isTyping}
      />

      {/* 4. Interactive Input Bar */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Diyetisyeninize bir soru sorun..."
          placeholderTextColor={Colors.textPlaceholder}
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
    safetyBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#172554' : '#EFF6FF',
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#1E3A8A' : '#DBEAFE',
    },
    safetyIcon: {
      fontSize: 14,
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
    typingIndicatorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: Spacing.xs,
      marginLeft: Spacing.xs,
    },
    typingAvatar: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: isDarkMode ? '#1E293B' : Colors.primaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 6,
    },
    typingAvatarText: {
      fontSize: 12,
    },
    typingPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surface,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs + 2,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: theme.border,
      ...Shadows.subtle,
    },
    typingText: {
      ...Typography.tiny,
      color: theme.textMuted,
      marginLeft: 6,
      fontStyle: 'italic',
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
