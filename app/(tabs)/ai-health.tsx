import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/authContext';
import { getAI } from '../../services/hybridAI';
import { HealthContext, ChatMessage } from '../../types/health';
import { colors } from '../../constants/theme';
import { scale, verticalScale } from '../../utils/styling';
import * as Icons from 'phosphor-react-native';
import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';

// Helper functions
const wp = (percentage: number) => scale(percentage * 3.75);
const hp = (percentage: number) => verticalScale(percentage * 8.12);

// Theme object
const theme = {
  colors: {
    primary: colors.primary,
    primaryLight: colors.primaryLight + '20',
    background: colors.neutral900,
    surface: colors.neutral800,
    text: colors.text,
    textSecondary: colors.neutral400,
    border: colors.neutral700,
    white: colors.white,
    success: colors.green
  }
};

interface DisplayChatMessage extends ChatMessage {
  isLoading?: boolean;
}

const AIHealthScreen = () => {
  const { user } = useAuth();
  
  // Chat functionality
  const getWelcomeMessage = () => {
    const userName = user?.firstName || 'Değerli kullanıcı';
    return `Merhaba ${userName}! Ben sağlık asistanınızım. Size şu konularda yardımcı olabilirim:\n\n• Sağlık verilerinizi analiz etmek\n• Sağlık tavsiyesi vermek\n• Semptomlarınızı değerlendirmek\n• İlaç ve tedavi hakkında bilgi vermek\n\nNasıl yardımcı olabilirim?`;
  };

  const [messages, setMessages] = useState<DisplayChatMessage[]>([
    {
      id: '1',
      content: getWelcomeMessage(),
      role: 'assistant',
      timestamp: Date.now().toString(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Update welcome message when user data changes
  useEffect(() => {
    setMessages([
      {
        id: '1',
        content: getWelcomeMessage(),
        role: 'assistant',
        timestamp: Date.now().toString(),
      }
    ]);
  }, [user?.firstName]);

  // Suggested chat examples
  const suggestedChats = [
    "Kalp hızım normal mi?",
    "Kan basıncım yüksek, ne yapmalıyım?",
    "Uyku kalitemi nasıl artırabilirim?",
    "Egzersiz önerileriniz neler?",
    "Beslenme tavsiyesi ver",
    "Stres seviyem yüksek, yardım edin"
  ];

  // Chat functions
  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputText.trim();
    if (!textToSend) return;

    const userMessage: DisplayChatMessage = {
      id: Date.now().toString(),
      content: textToSend,
      role: 'user',
      timestamp: Date.now().toString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setChatLoading(true);

    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Prepare health context
      const healthContext: HealthContext = {
        vitals: {
          heartRate: 75,
          bloodPressure: { systolic: 120, diastolic: 80 },
          weight: 70,
          height: 170,
        },
        demographics: {
          age: 30,
          gender: 'male',
          medicalHistory: [],
          conditions: [],
          medications: [],
        },
        timeframe: '24h',
      };

      // Get AI response
      const ai = getAI();
      const response = await ai.chatWithHealthAssistant(textToSend, healthContext);

      const aiMessage: DisplayChatMessage = {
        id: (Date.now() + 1).toString(),
        content: response,
        role: 'assistant',
        timestamp: Date.now().toString(),
      };

      setMessages(prev => [...prev, aiMessage]);

      // Auto scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: DisplayChatMessage = {
        id: (Date.now() + 1).toString(),
        content: 'Üzgünüm, şu anda bir hata oluştu. Lütfen tekrar deneyin.',
        role: 'assistant',
        timestamp: Date.now().toString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        content: getWelcomeMessage(),
        role: 'assistant',
        timestamp: Date.now().toString(),
      }
    ]);
  };

  return (
    <ScreenWrapper>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icons.Robot size={24} color={colors.primary} weight="fill" />
          <Typo size={20} fontWeight="700" color={colors.white}>AI Sağlık Asistanı</Typo>
        </View>
        <View style={styles.statusIndicator}>
          <View style={styles.statusDot} />
          <Typo size={12} color={colors.green}>Aktif</Typo>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={styles.chatContainer} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Chat Messages */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageContainer,
                message.role === 'user' ? styles.userMessage : styles.aiMessage,
              ]}
            >
              {message.role === 'assistant' && (
                <View style={styles.aiAvatar}>
                  <Icons.Robot size={16} color={colors.primary} weight="fill" />
                </View>
              )}
              <View style={[
                styles.messageBubble,
                message.role === 'user' ? styles.userBubble : styles.aiBubble,
              ]}>
                <Typo 
                  size={14} 
                  color={message.role === 'user' ? colors.white : colors.text}
                  style={styles.messageText}
                >
                  {message.content}
                </Typo>
              </View>
            </View>
          ))}
          
          {chatLoading && (
            <View style={[styles.messageContainer, styles.aiMessage]}>
              <View style={styles.aiAvatar}>
                <Icons.Robot size={16} color={colors.primary} weight="fill" />
              </View>
              <View style={[styles.messageBubble, styles.aiBubble]}>
                <View style={styles.typingIndicator}>
                  <View style={[styles.typingDot, { animationDelay: '0ms' }]} />
                  <View style={[styles.typingDot, { animationDelay: '150ms' }]} />
                  <View style={[styles.typingDot, { animationDelay: '300ms' }]} />
                </View>
              </View>
            </View>
          )}

          {/* Suggested Chats - Show after first message */}
          {messages.length === 1 && (
            <View style={styles.suggestedContainer}>
              <View style={styles.suggestedGrid}>
                {suggestedChats.map((chat, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestedChat}
                    onPress={() => sendMessage(chat)}
                  >
                    <Typo size={13} color={colors.primary} style={styles.suggestedText}>
                      {chat}
                    </Typo>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Chat Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Sağlık hakkında bir soru sorun..."
              placeholderTextColor={colors.neutral500}
              multiline
              maxLength={500}
              onSubmitEditing={() => sendMessage()}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!inputText.trim() || chatLoading) && styles.sendButtonDisabled]}
              onPress={() => sendMessage()}
              disabled={!inputText.trim() || chatLoading}
            >
              <Icons.PaperPlaneTilt size={18} color={colors.white} weight="fill" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

export default AIHealthScreen;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral800,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.green,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  messageContainer: {
    marginVertical: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  aiMessage: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.neutral800,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 4,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 16,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 6,
    marginLeft: 'auto',
  },
  aiBubble: {
    backgroundColor: colors.neutral800,
    borderBottomLeftRadius: 6,
  },
  messageText: {
    lineHeight: 20,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.neutral400,
  },
  suggestedContainer: {
    marginTop: 20,
  },
  suggestedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestedChat: {
    backgroundColor: colors.neutral800,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary + '30',
    minWidth: '45%',
    flexGrow: 1,
  },
  suggestedText: {
    textAlign: 'center',
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.neutral900,
    borderTopWidth: 1,
    borderTopColor: colors.neutral800,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.neutral800,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  textInput: {
    flex: 1,
    color: colors.white,
    fontSize: 14,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    backgroundColor: colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
