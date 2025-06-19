import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { getAI } from '@/services/hybridAI';
import { HealthContext, AIHealthResponse, ChatMessage } from '@/types/health';
import { colors, spacingX, spacingY, radius } from '@/constants/theme';
import { verticalScale } from '@/utils/styling';

// 1. 📊 Sağlık Analizi Komponenti
export const HealthAnalysisCard = ({ healthData }: { healthData: HealthContext }) => {
  const [analysis, setAnalysis] = useState<AIHealthResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const analyzeHealth = async () => {
    setLoading(true);
    try {
      const ai = getAI();
      const result = await ai.analyzeHealthData(healthData);
      setAnalysis(result);
    } catch (error) {
      console.error('AI Analysis Error:', error);
      Alert.alert('Hata', 'Sağlık analizi yapılamadı');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return colors.rose;       // Tema uyumlu kırmızı
      case 'medium': return '#f59e0b';       // Tema uyumlu turuncu
      case 'low': return colors.green;       // Tema uyumlu yeşil
      default: return colors.neutral500;     // Tema uyumlu gri
    }
  };

  const getRiskText = (level: string) => {
    switch (level) {
      case 'high': return 'Yüksek Risk';
      case 'medium': return 'Orta Risk';
      case 'low': return 'Düşük Risk';
      default: return 'Bilinmiyor';
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>🤖 AI Sağlık Analizi</Text>
      
      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={analyzeHealth}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'AI Analiz Ediyor...' : 'Analiz Et'}
        </Text>
      </TouchableOpacity>

      {analysis && (
        <ScrollView style={styles.results}>
          <View style={styles.riskSection}>
            <Text style={styles.sectionTitle}>⚠️ Risk Seviyesi:</Text>
            <View style={[styles.riskBadge, { backgroundColor: getRiskColor(analysis.riskLevel) }]}>
              <Text style={styles.riskText}>{getRiskText(analysis.riskLevel)}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Öneriler:</Text>
            {analysis.recommendations?.map((rec: string, index: number) => (
              <Text key={index} style={styles.recommendation}>
                • {rec}
              </Text>
            ))}
          </View>
          
          {analysis.insights && analysis.insights.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💡 Önemli Notlar:</Text>
              {analysis.insights.map((insight: string, index: number) => (
                <Text key={index} style={styles.insight}>
                  • {insight}
                </Text>
              ))}
            </View>
          )}

          {analysis.actionItems && analysis.actionItems.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>✅ Yapılacaklar:</Text>
              {analysis.actionItems.map((item: string, index: number) => (
                <Text key={index} style={styles.actionItem}>
                  • {item}
                </Text>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

// 2. 💬 Sağlık Sohbet Asistanı
export const HealthChatAssistant = ({ userContext }: { userContext?: HealthContext }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    // Hoş geldin mesajı
    const welcomeMessage: ChatMessage = {
      id: '1',
      role: 'assistant',
      content: '👋 Merhaba! Ben Medora sağlık asistanınızım. Sağlık konularında size yardımcı olmak için buradayım. Nasıl yardımcı olabilirim?',
      timestamp: new Date().toISOString()
    };
    setMessages([welcomeMessage]);
  }, []);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const ai = getAI();
      const response = await ai.chatWithHealthAssistant(inputText, userContext || {}, []);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat Error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: 'Üzgünüm, şu anda yanıt veremiyorum. Lütfen tekrar deneyin.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = (message: ChatMessage, index: number) => (
    <View key={index} style={[
      styles.messageContainer,
      message.role === 'user' ? styles.userMessage : styles.assistantMessage
    ]}>
      <Text style={[
        styles.messageText,
        message.role === 'user' ? styles.userMessageText : styles.assistantMessageText
      ]}>
        {message.content}
      </Text>
      <Text style={styles.timestamp}>
        {new Date(message.timestamp).toLocaleTimeString('tr-TR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </Text>
    </View>
  );

  return (
    <View style={styles.chatContainer}>
      <Text style={styles.title}>💬 Sağlık Asistanı</Text>
      
      <ScrollView style={styles.messagesContainer}>
        {messages.map(renderMessage)}
        {loading && (
          <View style={styles.loadingMessage}>
            <Text style={styles.loadingText}>🤖 Düşünüyor...</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Sağlık konusunda soru sorun..."
          multiline
          maxLength={500}
        />
        <TouchableOpacity 
          style={[styles.sendButton, (!inputText.trim() || loading) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim() || loading}
        >
          <Text style={styles.sendButtonText}>📤</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// 3. 🎯 Hızlı Sağlık İpuçları
export const QuickHealthTips = () => {
  const [tips, setTips] = useState<string[]>([
    '💧 Günde en az 8 bardak su için',
    '🚶‍♀️ Günlük 30 dakika yürüyüş yapın',
    '🥗 Renkli sebze ve meyveleri tercih edin',
    '😴 Kaliteli uyku için düzenli uyku saatlerine dikkat edin',
    '🧘‍♂️ Stres yönetimi için nefes egzersizleri yapın'
  ]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>💡 Günlük Sağlık İpuçları</Text>
      {tips.map((tip, index) => (
        <View key={index} style={styles.tipContainer}>
          <Text style={styles.tip}>{tip}</Text>
        </View>
      ))}
    </View>
  );
};

// 4. 🚨 Acil Durum Rehberi
export const EmergencyGuide = () => {
  const [emergencyTips, setEmergencyTips] = useState<string[]>([
    '🚨 Nefes almakta güçlük çekiyorsanız hemen 112 arayın',
    '💔 Göğüs ağrısı durumunda derhal hastaneye gidin',
    '🤕 Ciddi yaralanmalarda basınç uygulayın ve yardım çağırın',
    '🔥 Yüksek ateş (39°C+) devam ediyorsa doktora danışın',
    '😵 Bayılma durumunda kişiyi yan yatırın ve 112 arayın'
  ]);

  const callEmergency = () => {
    Alert.alert(
      'Acil Durum',
      'Gerçek bir acil durum mu?\n\n112 - Acil Servis\n911 - Polis\n110 - İtfaiye',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Ara', onPress: () => console.log('Emergency call') }
      ]
    );
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>🚨 Acil Durum Rehberi</Text>
      
      <TouchableOpacity style={styles.emergencyButton} onPress={callEmergency}>
        <Text style={styles.emergencyButtonText}>🚨 ACİL DURUM</Text>
      </TouchableOpacity>

      {emergencyTips.map((tip, index) => (
        <View key={index} style={styles.emergencyTip}>
          <Text style={styles.emergencyTipText}>{tip}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius._12,
    padding: spacingX._15,
    marginVertical: spacingY._10,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: spacingY._15,
    color: colors.neutral800,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius._10,
    padding: spacingX._12,
    alignItems: 'center',
    marginBottom: spacingY._15,
  },
  buttonDisabled: {
    backgroundColor: colors.neutral300,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  results: {
    maxHeight: 400,
  },
  riskSection: {
    marginBottom: spacingY._15,
  },
  riskBadge: {
    paddingHorizontal: spacingX._12,
    paddingVertical: spacingY._7,
    borderRadius: radius._15,
    alignSelf: 'flex-start',
    marginTop: spacingY._5,
  },
  riskText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: spacingY._15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacingY._10,
    color: colors.neutral800,
  },
  recommendation: {
    fontSize: 14,
    color: colors.neutral600,
    marginBottom: spacingY._5,
    lineHeight: 20,
  },
  insight: {
    fontSize: 14,
    color: colors.primaryLight,
    marginBottom: spacingY._5,
    lineHeight: 20,
  },
  actionItem: {
    fontSize: 14,
    color: colors.green,
    marginBottom: spacingY._5,
    lineHeight: 20,
  },
  chatContainer: {
    backgroundColor: colors.white,
    borderRadius: radius._12,
    flex: 1,
    margin: spacingX._10,
  },
  messagesContainer: {
    flex: 1,
    padding: spacingX._15,
    maxHeight: 400,
  },
  messageContainer: {
    marginBottom: spacingY._12,
    padding: spacingX._12,
    borderRadius: radius._10,
    maxWidth: '80%',
  },
  userMessage: {
    backgroundColor: colors.primary,
    alignSelf: 'flex-end',
  },
  assistantMessage: {
    backgroundColor: colors.neutral100,
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: colors.white,
  },
  assistantMessageText: {
    color: colors.neutral800,
  },
  timestamp: {
    fontSize: 10,
    color: colors.neutral500,
    marginTop: spacingY._5,
  },
  loadingMessage: {
    alignSelf: 'flex-start',
    backgroundColor: colors.neutral100,
    padding: spacingX._12,
    borderRadius: radius._10,
    marginBottom: spacingY._12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.neutral600,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: spacingX._15,
    borderTopWidth: 1,
    borderTopColor: colors.neutral200,
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.neutral300,
    borderRadius: radius._20,
    paddingHorizontal: spacingX._15,
    paddingVertical: spacingY._10,
    marginRight: spacingX._10,
    maxHeight: 100,
    fontSize: 14,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: radius._20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.neutral300,
  },
  sendButtonText: {
    fontSize: 18,
  },
  tipContainer: {
    backgroundColor: colors.neutral50,
    padding: spacingX._12,
    borderRadius: radius._10,
    marginBottom: spacingY._10,
  },
  tip: {
    fontSize: 14,
    color: colors.neutral800,
    lineHeight: 20,
  },
  emergencyButton: {
    backgroundColor: colors.rose,
    borderRadius: radius._10,
    padding: spacingX._15,
    alignItems: 'center',
    marginBottom: spacingY._15,
  },
  emergencyButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  emergencyTip: {
    backgroundColor: '#fff3cd',
    padding: spacingX._12,
    borderRadius: radius._10,
    marginBottom: spacingY._10,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  emergencyTipText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 18,
  },
});
