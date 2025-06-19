import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Icons from 'phosphor-react-native';
import { useAuth } from '../contexts/authContext';
import { cardioAIService, CardioRiskResult } from '../services/ai/cardioAI';
import { realEkgAIService, EKGAnalysisResult } from '../services/ai/realEcgAI';
import { dataManager, UserHealthProfile } from '../utils/dataManager';
import { APP_CONFIG } from '../constants/config';

import ScreenWrapper from '../components/ScreenWrapper';
import BackButton from '../components/BackButton';
import Typo from '../components/Typo';
import Button from '../components/Button';
import { colors, spacingX, spacingY } from '../constants/theme';
import { verticalScale } from '../utils/styling';

export default function AIHealthAssessmentScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [isAssessing, setIsAssessing] = useState(false);
  const [cardioResult, setCardioResult] = useState<CardioRiskResult | null>(null);
  const [ekgResult, setEkgResult] = useState<EKGAnalysisResult | null>(null);

  const assessmentOptions = [
    {
      id: 'cardio',
      title: 'Kardiyovasküler Risk Analizi',
      subtitle: 'Kalp hastalığı risk faktörlerinizi değerlendirin',
      icon: <Icons.Heart size={verticalScale(32)} color={colors.rose} weight="fill" />,
      bgColor: 'rgba(239, 68, 68, 0.1)',
      borderColor: 'rgba(239, 68, 68, 0.3)',
      onPress: () => performCardioAssessment(),
    },
    {
      id: 'ekg',
      title: 'EKG Aritmia Analizi',
      subtitle: 'Elektrokardiyogram sinyallerinizi analiz edin',
      icon: <Icons.Waveform size={verticalScale(32)} color={colors.orange} weight="bold" />,
      bgColor: 'rgba(249, 115, 22, 0.1)',
      borderColor: 'rgba(249, 115, 22, 0.3)',
      onPress: () => performEKGAssessment(),
    },
    {
      id: 'comprehensive',
      title: 'Kapsamlı Sağlık Analizi',
      subtitle: 'Tüm sağlık verilerinizin AI analizi',
      icon: <Icons.Brain size={verticalScale(32)} color={colors.primary} weight="fill" />,
      bgColor: 'rgba(59, 130, 246, 0.1)',
      borderColor: 'rgba(59, 130, 246, 0.3)',
      onPress: () => performComprehensiveAssessment(),
    },
    {
      id: 'personalized',
      title: 'Kişiselleştirilmiş Öneriler',
      subtitle: 'Size özel sağlık tavsiyeleri alın',
      icon: <Icons.UserGear size={verticalScale(32)} color={colors.green} weight="fill" />,
      bgColor: 'rgba(34, 197, 94, 0.1)',
      borderColor: 'rgba(34, 197, 94, 0.3)',
      onPress: () => getPersonalizedRecommendations(),
    },
  ];

  const performCardioAssessment = async () => {
    if (!user?.uid) return;

    try {
      setIsAssessing(true);
      
      // Kullanıcı profilinden temel bilgileri al
      const userProfile: UserHealthProfile = {
        age: user.healthProfile?.age || 30,
        gender: user.healthProfile?.gender || 'male',
        height: user.healthProfile?.height || 170,
        weight: user.healthProfile?.weight || 70,
        bloodPressure: user.healthProfile?.bloodPressure,
        cholesterol: user.healthProfile?.cholesterol || 1,
        glucose: user.healthProfile?.glucose || 1,
        smoking: user.healthProfile?.smoking || false,
        alcohol: user.healthProfile?.alcohol || false,
        physicalActivity: user.healthProfile?.physicalActivity || false,
        manualEntries: user.healthProfile?.manualEntries || {}
      };

      console.log('🔄 AI Sağlık Değerlendirmesi başlıyor...', {
        useMockData: APP_CONFIG.USE_MOCK_DATA,
        userProfile: Object.keys(userProfile).length
      });

      // Mock sağlık verisi ile analiz yap
      const mockHealthData: any[] = [];
      const result = await cardioAIService.analyzeFromHealthData(mockHealthData, userProfile);
      
      setCardioResult(result);
      
      Alert.alert(
        'Kardiyovasküler Risk Analizi Tamamlandı',
        `Risk Seviyesi: ${cardioAIService.getRiskLevelInfo(result.riskLevel).label}\n` +
        `Risk Skoru: %${result.riskPercentage}\n\n` +
        'Detayları aşağıda görebilirsiniz.',
        [{ text: 'Tamam' }]
      );
      
    } catch (error) {
      console.error('❌ Kardiyovasküler risk analizi hatası:', error);
      Alert.alert('Hata', 'Risk analizi yapılırken bir hata oluştu.');
    } finally {
      setIsAssessing(false);
    }
  };

  const performEKGAssessment = async () => {
    if (!user?.uid) return;

    try {
      setIsAssessing(true);
      
      // EKG AI servisini başlat
      await realEkgAIService.initialize();
      
      // Mock EKG sinyali oluştur (gerçek uygulamada Samsung Watch'dan gelecek)
      const mockSignal = realEkgAIService.generateMockEKGSignal(
        Math.random() > 0.7 ? 'arrhythmia' : 'normal', 
        180
      );
      
      // EKG analizi yap
      const result = await realEkgAIService.analyzeEKG(mockSignal);
      
      setEkgResult(result);
      
      Alert.alert(
        'EKG Analizi Tamamlandı',
        `Sonuç: ${result.className}\n` +
        `Güven Oranı: %${(result.confidence * 100).toFixed(1)}\n` +
        `Risk Seviyesi: ${result.riskLevel.toUpperCase()}\n\n` +
        'Detayları aşağıda görebilirsiniz.',
        [{ text: 'Tamam' }]
      );
      
    } catch (error) {
      console.error('❌ EKG analizi hatası:', error);
      
      // Fallback: Mock analiz
      try {
        const mockResult = await realEkgAIService.analyzeMockEKG(
          Math.random() > 0.7 ? 'arrhythmia' : 'normal'
        );
        setEkgResult(mockResult);
        
        Alert.alert(
          'EKG Analizi Tamamlandı (Demo)',
          `Sonuç: ${mockResult.className}\n` +
          `Güven Oranı: %${(mockResult.confidence * 100).toFixed(1)}\n` +
          `Risk Seviyesi: ${mockResult.riskLevel.toUpperCase()}\n\n` +
          'Bu demo sonucudur. Gerçek EKG verisi için Samsung Watch gereklidir.',
          [{ text: 'Tamam' }]
        );
      } catch (fallbackError) {
        Alert.alert('Hata', 'EKG analizi yapılırken bir hata oluştu.');
      }
    } finally {
      setIsAssessing(false);
    }
  };

  const performComprehensiveAssessment = async () => {
    Alert.alert(
      'Yakında Gelecek',
      'Kapsamlı sağlık analizi özelliği yakında eklenecek.',
      [{ text: 'Tamam' }]
    );
  };

  const getPersonalizedRecommendations = async () => {
    Alert.alert(
      'Yakında Gelecek', 
      'Kişiselleştirilmiş öneriler özelliği yakında eklenecek.',
      [{ text: 'Tamam' }]
    );
  };

  const getRiskColor = (riskLevel: string) => {
    const riskInfo = cardioAIService.getRiskLevelInfo(riskLevel as any);
    return riskInfo?.color || colors.neutral400;
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return <Icons.CheckCircle size={verticalScale(24)} color={colors.green} weight="fill" />;
      case 'medium':
        return <Icons.Warning size={verticalScale(24)} color={colors.yellow} weight="fill" />;
      case 'high':
        return <Icons.XCircle size={verticalScale(24)} color={colors.rose} weight="fill" />;
      default:
        return <Icons.Question size={verticalScale(24)} color={colors.neutral400} weight="fill" />;
    }
  };

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.container}>
        <BackButton />
        
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Icons.Brain size={verticalScale(32)} color={colors.primary} weight="fill" />
          </View>
          <Typo size={28} fontWeight="800" color={colors.white}>
            AI Sağlık Değerlendirmesi
          </Typo>
          <Typo size={16} color={colors.textLighter}>
            Yapay zeka destekli kapsamlı sağlık analizi
          </Typo>
        </View>

        {/* Değerlendirme Seçenekleri */}
        <View style={styles.optionsContainer}>
          <Typo size={20} fontWeight="700" color={colors.white} style={styles.sectionTitle}>
            Analiz Türünü Seçin
          </Typo>
          
          {assessmentOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[styles.optionCard, { 
                backgroundColor: option.bgColor,
                borderColor: option.borderColor,
              }]}
              onPress={option.onPress}
              disabled={isAssessing}
            >
              <View style={styles.optionIcon}>
                {option.icon}
              </View>
              <View style={styles.optionContent}>
                <Typo size={18} fontWeight="700" color={colors.white}>
                  {option.title}
                </Typo>
                <Typo size={14} color={colors.textLighter}>
                  {option.subtitle}
                </Typo>
              </View>
              <Icons.CaretRight size={verticalScale(20)} color={colors.textLighter} weight="bold" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Loading State */}
        {isAssessing && (
          <View style={styles.loadingCard}>
            <Icons.CircleNotch size={verticalScale(32)} color={colors.primary} weight="bold" />
            <Typo size={18} fontWeight="600" color={colors.white} style={{ marginTop: spacingY._10 }}>
              Analiz Yapılıyor...
            </Typo>
            <Typo size={14} color={colors.textLighter}>
              Sağlık verileriniz AI tarafından değerlendiriliyor
            </Typo>
          </View>
        )}

        {/* Kardiyovasküler Risk Sonuçları */}
        {cardioResult && (
          <View style={styles.resultsContainer}>
            <Typo size={20} fontWeight="700" color={colors.white} style={styles.sectionTitle}>
              Kardiyovasküler Risk Analizi
            </Typo>

            {/* Risk Skoru Kartı */}
            <View style={[styles.riskCard, { borderColor: getRiskColor(cardioResult.riskLevel) }]}>
              <View style={styles.riskHeader}>
                {getRiskIcon(cardioResult.riskLevel)}
                <View style={styles.riskInfo}>
                  <Typo size={18} fontWeight="700" color={colors.white}>
                    {cardioAIService.getRiskLevelInfo(cardioResult.riskLevel).label}
                  </Typo>
                  <Typo size={16} color={colors.textLighter}>
                    Risk Skoru: %{cardioResult.riskPercentage}
                  </Typo>
                </View>
                <View style={styles.confidenceScore}>
                  <Typo size={12} color={colors.textLighter}>Güven</Typo>
                  <Typo size={16} fontWeight="700" color={colors.primary}>
                    %{Math.round(cardioResult.confidence * 100)}
                  </Typo>
                </View>
              </View>
              
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${cardioResult.riskPercentage}%`,
                      backgroundColor: getRiskColor(cardioResult.riskLevel)
                    }
                  ]} 
                />
              </View>
            </View>

            {/* Risk Faktörleri */}
            {cardioResult.riskFactors.length > 0 && (
              <View style={styles.factorsCard}>
                <View style={styles.cardHeader}>
                  <Icons.Warning size={verticalScale(20)} color={colors.yellow} weight="fill" />
                  <Typo size={16} fontWeight="700" color={colors.white}>
                    Tespit Edilen Risk Faktörleri
                  </Typo>
                </View>
                {cardioResult.riskFactors.map((factor, index) => (
                  <View key={index} style={styles.listItem}>
                    <Icons.Dot size={verticalScale(12)} color={colors.rose} weight="fill" />
                    <Typo size={14} color={colors.textLighter}>
                      {factor}
                    </Typo>
                  </View>
                ))}
              </View>
            )}

            {/* Öneriler */}
            <View style={styles.recommendationsCard}>
              <View style={styles.cardHeader}>
                <Icons.Lightbulb size={verticalScale(20)} color={colors.primary} weight="fill" />
                <Typo size={16} fontWeight="700" color={colors.white}>
                  AI Önerileri
                </Typo>
              </View>
              {cardioResult.recommendations.slice(0, 4).map((recommendation, index) => (
                <View key={index} style={styles.listItem}>
                  <Icons.CheckCircle size={verticalScale(12)} color={colors.green} weight="fill" />
                  <Typo size={14} color={colors.textLighter} style={{ flex: 1 }}>
                    {recommendation}
                  </Typo>
                </View>
              ))}
            </View>

            {/* Aksiyon Butonları */}
            <View style={styles.actionButtons}>
              <Button 
                onPress={() => router.push('/(tabs)/health-data')}
                style={styles.actionButton}
              >
                <Typo fontWeight="700" color={colors.black} size={16}>
                  Sağlık Verilerini Görüntüle
                </Typo>
              </Button>
              
                             <Button 
                 onPress={() => setCardioResult(null)}
                 style={{ ...styles.actionButton, backgroundColor: colors.neutral700 }}
               >
                <Typo fontWeight="700" color={colors.white} size={16}>
                  Yeni Analiz Yap
                </Typo>
              </Button>
            </View>
          </View>
        )}

        {/* EKG Analiz Sonuçları */}
        {ekgResult && (
          <View style={styles.resultsContainer}>
            <Typo size={20} fontWeight="700" color={colors.white} style={styles.sectionTitle}>
              EKG Aritmia Analizi
            </Typo>

            {/* EKG Sonuç Kartı */}
            <View style={[styles.riskCard, { 
              borderColor: ekgResult.riskLevel === 'low' ? colors.green : 
                          ekgResult.riskLevel === 'medium' ? colors.yellow : colors.rose 
            }]}>
              <View style={styles.riskHeader}>
                <Icons.Waveform size={verticalScale(24)} color={colors.orange} weight="bold" />
                <View style={styles.riskInfo}>
                  <Typo size={18} fontWeight="700" color={colors.white}>
                    {ekgResult.className}
                  </Typo>
                  <Typo size={16} color={colors.textLighter}>
                    Güven: %{(ekgResult.confidence * 100).toFixed(1)}
                  </Typo>
                </View>
                <View style={styles.confidenceScore}>
                  <Typo size={14} color={colors.textLighter}>Risk</Typo>
                  <Typo size={18} fontWeight="700" color={
                    ekgResult.riskLevel === 'low' ? colors.green : 
                    ekgResult.riskLevel === 'medium' ? colors.yellow : colors.rose
                  }>
                    {ekgResult.riskLevel.toUpperCase()}
                  </Typo>
                </View>
              </View>

              {/* Güven Çubuğu */}
              <View style={styles.progressBar}>
                <View 
                  style={[styles.progressFill, { 
                    width: `${ekgResult.confidence * 100}%`,
                    backgroundColor: ekgResult.confidence > 0.8 ? colors.green : 
                                   ekgResult.confidence > 0.6 ? colors.yellow : colors.rose
                  }]} 
                />
              </View>
            </View>

            {/* Sınıf Olasılıkları */}
            <View style={styles.factorsCard}>
              <View style={styles.cardHeader}>
                <Icons.ChartBar size={verticalScale(20)} color={colors.primary} weight="bold" />
                <Typo size={16} fontWeight="600" color={colors.white}>
                  Sınıf Olasılıkları
                </Typo>
              </View>
              {Object.entries(ekgResult.probabilities).map(([className, probability]) => (
                <View key={className} style={styles.listItem}>
                  <View style={[styles.progressBar, { flex: 1, marginRight: spacingX._10 }]}>
                    <View 
                      style={[styles.progressFill, { 
                        width: `${probability * 100}%`,
                        backgroundColor: className === ekgResult.className ? colors.primary : colors.neutral500
                      }]} 
                    />
                  </View>
                  <Typo size={14} color={colors.textLighter} style={{ minWidth: 80 }}>
                    {className}
                  </Typo>
                  <Typo size={14} fontWeight="600" color={colors.white} style={{ minWidth: 50, textAlign: 'right' }}>
                    %{(probability * 100).toFixed(1)}
                  </Typo>
                </View>
              ))}
            </View>

            {/* EKG Önerileri */}
            <View style={styles.recommendationsCard}>
              <View style={styles.cardHeader}>
                <Icons.Lightbulb size={verticalScale(20)} color={colors.yellow} weight="fill" />
                <Typo size={16} fontWeight="600" color={colors.white}>
                  AI Önerileri
                </Typo>
              </View>
              {ekgResult.recommendations.map((recommendation, index) => (
                <View key={index} style={styles.listItem}>
                  <Typo size={14} color={colors.primary} style={{ marginTop: 2 }}>•</Typo>
                  <Typo size={14} color={colors.textLighter} style={{ flex: 1 }}>
                    {recommendation}
                  </Typo>
                </View>
              ))}
            </View>

            {/* EKG Aksiyon Butonları */}
            <View style={styles.actionButtons}>
              <Button 
                onPress={() => router.push('/cardio-risk-assessment')}
                style={{ ...styles.actionButton, backgroundColor: colors.primary }}
              >
                <Typo fontWeight="700" color={colors.white} size={16}>
                  Detaylı Kardiyoloji Raporu
                </Typo>
              </Button>
              
              <Button 
                onPress={() => setEkgResult(null)}
                style={{ ...styles.actionButton, backgroundColor: colors.neutral700 }}
              >
                <Typo fontWeight="700" color={colors.white} size={16}>
                  Yeni EKG Analizi
                </Typo>
              </Button>
            </View>
          </View>
        )}

        {/* Quick Stats */}
        <View style={styles.quickStatsContainer}>
          <Typo size={18} fontWeight="700" color={colors.white} style={{ marginBottom: spacingY._15 }}>
            Hızlı Erişim
          </Typo>
          
          <View style={styles.quickStatsGrid}>
            <TouchableOpacity 
              style={styles.quickStatItem}
              onPress={() => router.push('/(tabs)/health-metrics')}
            >
              <Icons.Heartbeat size={verticalScale(24)} color={colors.rose} weight="fill" />
              <Typo size={12} color={colors.textLighter} style={{ textAlign: 'center' }}>
                Sağlık Metrikleri
              </Typo>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickStatItem}
              onPress={() => router.push('/(tabs)/graphs')}
            >
              <Icons.ChartBar size={verticalScale(24)} color={colors.green} weight="fill" />
              <Typo size={12} color={colors.textLighter} style={{ textAlign: 'center' }}>
                Grafikler
              </Typo>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickStatItem}
              onPress={() => router.push('/(tabs)/ai-health')}
            >
              <Icons.Robot size={verticalScale(24)} color={colors.primary} weight="fill" />
              <Typo size={12} color={colors.textLighter} style={{ textAlign: 'center' }}>
                AI Asistan
              </Typo>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: spacingX._20,
    paddingTop: spacingY._10,
    paddingBottom: spacingY._40,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacingY._30,
    paddingVertical: spacingY._20,
  },
  headerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacingY._15,
  },
  optionsContainer: {
    marginBottom: spacingY._30,
  },
  sectionTitle: {
    marginBottom: spacingY._15,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacingX._20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: spacingY._15,
  },
  optionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacingX._15,
  },
  optionContent: {
    flex: 1,
    gap: 4,
  },
  loadingCard: {
    alignItems: 'center',
    padding: spacingX._30,
    backgroundColor: colors.neutral800,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.neutral600,
    marginBottom: spacingY._20,
  },
  resultsContainer: {
    marginBottom: spacingY._30,
  },
  riskCard: {
    backgroundColor: colors.neutral800,
    borderRadius: 16,
    padding: spacingX._20,
    borderWidth: 2,
    marginBottom: spacingY._20,
  },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacingY._15,
  },
  riskInfo: {
    flex: 1,
    marginLeft: spacingX._12,
  },
  confidenceScore: {
    alignItems: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.neutral600,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  factorsCard: {
    backgroundColor: colors.neutral800,
    borderRadius: 12,
    padding: spacingX._15,
    borderWidth: 1,
    borderColor: colors.neutral600,
    marginBottom: spacingY._15,
  },
  recommendationsCard: {
    backgroundColor: colors.neutral800,
    borderRadius: 12,
    padding: spacingX._15,
    borderWidth: 1,
    borderColor: colors.neutral600,
    marginBottom: spacingY._20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingX._8,
    marginBottom: spacingY._12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacingX._8,
    marginBottom: spacingY._6,
  },
  actionButtons: {
    gap: spacingY._12,
  },
  actionButton: {
    paddingVertical: spacingY._15,
  },
  quickStatsContainer: {
    padding: spacingX._20,
    backgroundColor: colors.neutral800,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.neutral600,
  },
  quickStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacingX._10,
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center',
    padding: spacingY._15,
    backgroundColor: colors.neutral700,
    borderRadius: 12,
    gap: spacingY._8,
  },
}); 