import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { apiService } from './src/services/api';
import { RecognitionResponse, ChatMessage } from './src/types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'camera' | 'diet' | 'chat'>('camera');
  const [analyzing, setAnalyzing] = useState(false);
  const [recognitionResult, setRecognitionResult] = useState<RecognitionResponse | null>(null);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-1',
      sender: 'assistant',
      content: 'Merhaba! Ben DietAI beslenme danışmanınızım. Günlük hedefleriniz veya öğünleriniz hakkında sorularınızı yanıtlayabilirim.',
      timestamp: '10:00',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Handle Photo Analysis
  const handleAnalyzePhoto = async () => {
    setAnalyzing(true);
    try {
      const result = await apiService.analyzeFoodImage('data:image/sample');
      setRecognitionResult(result);
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  };

  // Handle Send Chat
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      content: chatInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);
    const currentInput = chatInput;
    setChatInput('');
    setChatLoading(true);

    try {
      const reply = await apiService.sendChatMessage(currentInput);
      setMessages((prev) => [...prev, reply]);
    } catch (err) {
      console.error(err);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>DietAI</Text>
        <Text style={styles.headerSubtitle}>Akıllı Beslenme & Diyet Yönetimi</Text>
      </View>

      {/* Main Content Area */}
      <View style={styles.content}>
        {activeTab === 'camera' && (
          <ScrollView contentContainerStyle={styles.tabContainer}>
            <View style={styles.cameraBox}>
              <Text style={styles.cameraIcon}>📸</Text>
              <Text style={styles.cameraBoxTitle}>Kamera ile Yemek Tanıma</Text>
              <Text style={styles.cameraBoxSub}>
                Tabağınızın fotoğrafını çekin; yapay zekâ porsiyonu ve besin değerlerini çıkarsın.
              </Text>
              <TouchableOpacity
                style={[styles.primaryButton, analyzing && styles.disabledButton]}
                onPress={handleAnalyzePhoto}
                disabled={analyzing}
              >
                {analyzing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Fotoğraf Çek & Analiz Et</Text>
                )}
              </TouchableOpacity>
            </View>

            {recognitionResult && (
              <View style={styles.resultCard}>
                <Text style={styles.resultHeader}>Tespit Edilen Besinler</Text>
                {recognitionResult.detectedFoods.map((item) => (
                  <View key={item.id} style={styles.foodRow}>
                    <View>
                      <Text style={styles.foodName}>{item.foodName}</Text>
                      <Text style={styles.foodPortion}>
                        Tahmini: {item.portionGrams}g | Güven: %{Math.round(item.confidenceScore * 100)}
                      </Text>
                    </View>
                    <Text style={styles.foodCal}>{item.nutrition.calories} kcal</Text>
                  </View>
                ))}

                <View style={styles.macroSummary}>
                  <Text style={styles.macroText}>
                    Toplam: <Text style={styles.bold}>{recognitionResult.totalNutrition.calories} kcal</Text>
                  </Text>
                  <Text style={styles.macroSub}>
                    P: {recognitionResult.totalNutrition.proteinGrams}g | K: {recognitionResult.totalNutrition.carbsGrams}g | Y: {recognitionResult.totalNutrition.fatGrams}g
                  </Text>
                </View>

                <Text style={styles.disclaimerText}>⚠️ {recognitionResult.disclaimer}</Text>
              </View>
            )}
          </ScrollView>
        )}

        {activeTab === 'diet' && (
          <ScrollView contentContainerStyle={styles.tabContainer}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Günlük Hedef & BMR</Text>
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>1,750</Text>
                  <Text style={styles.statLabel}>BMR (kcal)</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>2,100</Text>
                  <Text style={styles.statLabel}>Hedef Kalori</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>135g</Text>
                  <Text style={styles.statLabel}>Hedef Protein</Text>
                </View>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Haftalık Kişiselleştirilmiş Plan</Text>
              <Text style={styles.mealTitle}>🌅 Sabah</Text>
              <Text style={styles.mealDesc}>Yulaflı omlet (2 yumurta), lor peyniri ve zeytin</Text>
              <Text style={styles.mealTitle}>☀️ Öğle</Text>
              <Text style={styles.mealDesc}>Izgara tavuk göğsü (180g), kinoa salatası</Text>
              <Text style={styles.mealTitle}>🌙 Akşam</Text>
              <Text style={styles.mealDesc}>Fırında somon balığı, brokoli ve limon</Text>
            </View>
          </ScrollView>
        )}

        {activeTab === 'chat' && (
          <View style={styles.chatWrapper}>
            <View style={styles.safetyBanner}>
              <Text style={styles.safetyText}>
                🛡️ Güvenlik Koruması: Bot tıbbi teşhis koymaz veya aşırı kalori kısıtlaması önermez.
              </Text>
            </View>
            <ScrollView style={styles.chatScroll}>
              {messages.map((m) => (
                <View
                  key={m.id}
                  style={[
                    styles.chatBubble,
                    m.sender === 'user' ? styles.userBubble : styles.botBubble,
                  ]}
                >
                  <Text style={m.sender === 'user' ? styles.userText : styles.botText}>
                    {m.content}
                  </Text>
                </View>
              ))}
              {chatLoading && <ActivityIndicator style={{ marginVertical: 8 }} />}
            </ScrollView>

            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                placeholder="Beslenme sorusu sorun..."
                value={chatInput}
                onChangeText={setChatInput}
                onSubmitEditing={handleSendMessage}
              />
              <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
                <Text style={styles.sendButtonText}>Gönder</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'camera' && styles.activeNavItem]}
          onPress={() => setActiveTab('camera')}
        >
          <Text style={styles.navIcon}>📸</Text>
          <Text style={[styles.navLabel, activeTab === 'camera' && styles.activeNavLabel]}>Kamera</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === 'diet' && styles.activeNavItem]}
          onPress={() => setActiveTab('diet')}
        >
          <Text style={styles.navIcon}>🥗</Text>
          <Text style={[styles.navLabel, activeTab === 'diet' && styles.activeNavLabel]}>Diyet Planı</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === 'chat' && styles.activeNavItem]}
          onPress={() => setActiveTab('chat')}
        >
          <Text style={styles.navIcon}>💬</Text>
          <Text style={[styles.navLabel, activeTab === 'chat' && styles.activeNavLabel]}>Danışman</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  tabContainer: {
    padding: 16,
  },
  cameraBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cameraIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  cameraBoxTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  cameraBoxSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginVertical: 10,
    lineHeight: 18,
  },
  primaryButton: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  resultHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  foodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  foodName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  foodPortion: {
    fontSize: 12,
    color: '#64748B',
  },
  foodCal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },
  macroSummary: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  macroText: {
    fontSize: 15,
    color: '#1E293B',
  },
  bold: {
    fontWeight: '700',
  },
  macroSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  disclaimerText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 12,
    lineHeight: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  statVal: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10B981',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  mealTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginTop: 10,
  },
  mealDesc: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  chatWrapper: {
    flex: 1,
  },
  safetyBanner: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
  },
  safetyText: {
    fontSize: 11,
    color: '#1D4ED8',
    fontWeight: '500',
  },
  chatScroll: {
    flex: 1,
    padding: 16,
  },
  chatBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#10B981',
  },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  userText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  botText: {
    color: '#1E293B',
    fontSize: 14,
    lineHeight: 20,
  },
  inputRow: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: '#10B981',
    borderRadius: 20,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  activeNavItem: {
    borderTopWidth: 2,
    borderTopColor: '#10B981',
  },
  navIcon: {
    fontSize: 20,
  },
  navLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  activeNavLabel: {
    color: '#10B981',
    fontWeight: '600',
  },
});
