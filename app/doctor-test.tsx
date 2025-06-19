import { StyleSheet, View, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import React, { useState, useEffect } from 'react';
import { router } from 'expo-router';
import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import BackButton from '@/components/BackButton';
import { colors, spacingX, spacingY } from '@/constants/theme';
import * as Icons from 'phosphor-react-native';
import { useAuth } from '@/contexts/authContext';
import { patientHealthService, PatientRecord } from '@/services/patientHealthService';
import { ComprehensiveHealthData, AIHealthAssessment } from '@/types/health';
import { realEkgAIService } from '@/services/ai/realEcgAI';

const DoctorTestScreen = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [analysisResult, setAnalysisResult] = useState<string>('');

  useEffect(() => {
    fetchPatients();
    initializeAI();
  }, []);

  const initializeAI = async () => {
    try {
      await realEkgAIService.initialize();
      console.log('✅ AI servisler başlatıldı');
    } catch (error) {
      console.error('❌ AI servis hatası:', error);
    }
  };

  const fetchPatients = async () => {
    if (!user?.uid) return;
    
    try {
      const patientsData = await patientHealthService.getDoctorPatients(user.uid);
      setPatients(patientsData);
      console.log('📋 Hastalar yüklendi:', patientsData.length);
    } catch (error) {
      console.error('Hasta listesi hatası:', error);
    }
  };

  const generateMockHealthData = (): ComprehensiveHealthData => {
    const mockEkgSignal = realEkgAIService.generateMockEKGSignal('normal', 180);
    
    return {
      id: `test_${Date.now()}`,
      userId: user?.uid || 'test_user',
      timestamp: Date.now(),
      date: new Date().toISOString().split('T')[0],
      heartRate: 70 + Math.floor(Math.random() * 30),
      bloodPressure: {
        systolic: 120 + Math.floor(Math.random() * 20),
        diastolic: 80 + Math.floor(Math.random() * 10)
      },
      weight: 70 + Math.floor(Math.random() * 30),
      height: 170 + Math.floor(Math.random() * 20),
      ecgData: {
        rawSignal: mockEkgSignal
      },
      syncedAt: Date.now()
    };
  };

  const createTestPatient = async () => {
    if (!patientName.trim() || !user?.uid) {
      Alert.alert('Hata', 'Hasta adı ve doktor bilgisi gerekli');
      return;
    }

    setLoading(true);
    try {
      const patientId = `test_patient_${Date.now()}`;
      
      // Hasta kaydı oluştur
      const result = await patientHealthService.savePatientRecord(
        patientId,
        user.uid,
        {
          name: patientName.trim(),
          email: patientEmail.trim() || `${patientId}@test.com`,
          phone: '+90 555 000 0001',
          gender: 'male',
          dateOfBirth: '1990-01-01'
        }
      );

      if (result.success) {
        setPatientName('');
        setPatientEmail('');
        await fetchPatients();
        Alert.alert('Başarılı', 'Test hastası oluşturuldu');
      } else {
        Alert.alert('Hata', result.msg || 'Hasta oluşturulamadı');
      }
    } catch (error) {
      console.error('Hasta oluşturma hatası:', error);
      Alert.alert('Hata', 'Hasta oluşturulurken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const runPatientAnalysis = async (patient: PatientRecord) => {
    if (!user?.uid) return;

    setLoading(true);
    setAnalysisResult('Analiz başlıyor...');
    
    try {
      // Mock sağlık verisi oluştur
      const healthData = generateMockHealthData();
      
      // EKG analizi yap
      const ekgResult = await realEkgAIService.analyzeEKG(healthData.ecgData?.rawSignal || []);
      
      // AI değerlendirmesi oluştur
      const assessment: AIHealthAssessment = {
        userId: patient.patientId,
        timestamp: Date.now(),
        date: new Date().toISOString().split('T')[0],
        ecgAnalysis: {
          classification: ekgResult.className as any,
          confidence: ekgResult.confidence,
          anomalyScore: ekgResult.riskLevel === 'high' ? 0.8 : 
                        ekgResult.riskLevel === 'medium' ? 0.5 : 0.2,
          features: {
            heartRate: healthData.heartRate || 75,
            rhythm: 'regular',
            morphology: 'normal'
          },
          recommendations: ekgResult.recommendations,
          timestamp: Date.now()
        },
        overallRiskScore: ekgResult.riskLevel === 'high' ? 0.8 : 
                          ekgResult.riskLevel === 'medium' ? 0.5 : 0.3,
        priorityAlerts: ekgResult.riskLevel === 'high' ? [`EKG: ${ekgResult.className} tespit edildi`] : [],
        actionItems: ekgResult.recommendations,
        nextAssessmentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };

      // Analizi kaydet
      const saveResult = await patientHealthService.saveHealthAnalysis(
        patient.patientId,
        user.uid,
        healthData,
        assessment,
        'routine',
        'Test analizi yapıldı'
      );

      if (saveResult.success) {
        await fetchPatients(); // Hasta listesini yenile
        
        const resultText = `✅ Analiz Tamamlandı!\n\n` +
          `👤 Hasta: ${patient.patientInfo.name}\n` +
          `💓 Kalp Atışı: ${healthData.heartRate} bpm\n` +
          `🩺 Tansiyon: ${healthData.bloodPressure?.systolic}/${healthData.bloodPressure?.diastolic}\n` +
          `📊 EKG Sınıfı: ${ekgResult.className}\n` +
          `🎯 Güvenilirlik: %${(ekgResult.confidence * 100).toFixed(1)}\n` +
          `⚠️ Risk Seviyesi: ${ekgResult.riskLevel === 'high' ? 'Yüksek' : 
                               ekgResult.riskLevel === 'medium' ? 'Orta' : 'Düşük'}\n` +
          `📈 Risk Skoru: %${(assessment.overallRiskScore * 100).toFixed(0)}`;
        
        setAnalysisResult(resultText);
        
        Alert.alert(
          'Analiz Tamamlandı', 
          'Hasta verisi ve analiz sonuçları başarıyla kaydedildi!',
          [{ text: 'Tamam' }]
        );
      } else {
        setAnalysisResult('❌ Kaydetme hatası: ' + (saveResult.msg || 'Bilinmeyen hata'));
      }
         } catch (error: any) {
       console.error('Analiz hatası:', error);
       setAnalysisResult('❌ Analiz hatası: ' + (error?.message || 'Bilinmeyen hata'));
       Alert.alert('Hata', 'Analiz sırasında hata oluştu');
     } finally {
      setLoading(false);
    }
  };

  const deleteAllTestData = async () => {
    Alert.alert(
      'Uyarı',
      'Bu işlem tüm test verilerini silecektir. Emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Sil', 
          style: 'destructive',
          onPress: async () => {
            // Gerçek uygulamada silme fonksiyonu olacak
            console.log('Test verileri silindi (mock)');
            Alert.alert('Bilgi', 'Test verileri silindi (simülasyon)');
          }
        }
      ]
    );
  };

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <BackButton />
        <Typo size={18} fontWeight="600">Doktor Test Ekranı</Typo>
        <TouchableOpacity onPress={fetchPatients} style={styles.refreshButton}>
          <Icons.ArrowClockwise size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container}>
        {/* Yeni Hasta Oluştur */}
        <View style={styles.section}>
          <Typo size={16} fontWeight="600" style={styles.sectionTitle}>
            🧪 Test Hastası Oluştur
          </Typo>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Hasta adı..."
              placeholderTextColor={colors.neutral400}
              value={patientName}
              onChangeText={setPatientName}
            />
            <TextInput
              style={styles.input}
              placeholder="Email (opsiyonel)..."
              placeholderTextColor={colors.neutral400}
              value={patientEmail}
              onChangeText={setPatientEmail}
              keyboardType="email-address"
            />
            <TouchableOpacity
              style={[styles.button, !patientName.trim() && styles.buttonDisabled]}
              onPress={createTestPatient}
              disabled={!patientName.trim() || loading}
            >
              <Icons.UserPlus size={20} color={colors.white} />
              <Typo size={14} color={colors.white} fontWeight="600">
                {loading ? 'Oluşturuluyor...' : 'Hasta Oluştur'}
              </Typo>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hasta Listesi */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Typo size={16} fontWeight="600">
              👥 Hastalar ({patients.length})
            </Typo>
            <TouchableOpacity onPress={deleteAllTestData} style={styles.dangerButton}>
              <Icons.Trash size={16} color={colors.error} />
              <Typo size={12} color={colors.error}>Tümünü Sil</Typo>
            </TouchableOpacity>
          </View>
          
          {patients.length > 0 ? (
            <View style={styles.patientsList}>
              {patients.map((patient, index) => (
                <View key={patient.id || index} style={styles.patientCard}>
                  <View style={styles.patientInfo}>
                    <View style={styles.patientHeader}>
                      <Typo fontWeight="600">{patient.patientInfo.name}</Typo>
                      <View style={[
                        styles.riskBadge,
                        { backgroundColor: patient.riskLevel === 'high' ? colors.error + '20' :
                                          patient.riskLevel === 'medium' ? colors.warning + '20' :
                                          colors.success + '20' }
                      ]}>
                        <Typo size={10} color={
                          patient.riskLevel === 'high' ? colors.error :
                          patient.riskLevel === 'medium' ? colors.warning :
                          colors.success
                        }>
                          {patient.riskLevel === 'high' ? 'YÜKSEK' :
                           patient.riskLevel === 'medium' ? 'ORTA' : 'DÜŞÜK'}
                        </Typo>
                      </View>
                    </View>
                    
                    <Typo size={12} color={colors.neutral400}>
                      {patient.patientInfo.email}
                    </Typo>
                    
                    {patient.latestAssessment && (
                      <Typo size={11} color={colors.neutral500}>
                        Risk Skoru: %{(patient.latestAssessment.overallRiskScore * 100).toFixed(0)}
                      </Typo>
                    )}
                  </View>
                  
                  <TouchableOpacity
                    style={styles.analyzeButton}
                    onPress={() => runPatientAnalysis(patient)}
                    disabled={loading}
                  >
                    <Icons.Brain size={16} color={colors.primary} />
                    <Typo size={12} color={colors.primary} fontWeight="600">
                      Analiz Et
                    </Typo>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Icons.UsersFour size={48} color={colors.neutral400} weight="duotone" />
              <Typo color={colors.neutral400}>Henüz hasta yok</Typo>
              <Typo size={12} color={colors.neutral500}>
                Yukarıdaki formdan test hastası oluşturun
              </Typo>
            </View>
          )}
        </View>

        {/* Analiz Sonuçları */}
        {analysisResult && (
          <View style={styles.section}>
            <Typo size={16} fontWeight="600" style={styles.sectionTitle}>
              📊 Son Analiz Sonucu
            </Typo>
            <View style={styles.resultContainer}>
              <Typo size={13} color={colors.neutral300} style={styles.resultText}>
                {analysisResult}
              </Typo>
            </View>
          </View>
        )}

        {/* Info */}
        <View style={styles.infoSection}>
          <Icons.Info size={20} color={colors.info} />
          <View style={styles.infoContent}>
            <Typo size={14} fontWeight="600" color={colors.info}>
              Test Ortamı
            </Typo>
            <Typo size={12} color={colors.neutral400}>
              Bu ekran doktor özelliklerini test etmek içindir. Oluşturulan hastalar ve analizler gerçek verilerdir.
            </Typo>
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

export default DoctorTestScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._15,
  },
  refreshButton: {
    padding: spacingY._8,
  },
  section: {
    paddingHorizontal: spacingX._20,
    marginBottom: spacingY._25,
  },
  sectionTitle: {
    marginBottom: spacingY._15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacingY._15,
  },
  inputContainer: {
    gap: spacingY._10,
  },
  input: {
    backgroundColor: colors.neutral900,
    padding: spacingY._12,
    borderRadius: 8,
    color: colors.text,
    fontSize: 14,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: spacingY._12,
    borderRadius: 8,
    gap: spacingX._8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingX._5,
    padding: spacingY._5,
  },
  patientsList: {
    gap: spacingY._10,
  },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral900,
    padding: spacingY._15,
    borderRadius: 8,
  },
  patientInfo: {
    flex: 1,
    gap: spacingY._5,
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  riskBadge: {
    paddingHorizontal: spacingX._8,
    paddingVertical: spacingY._2,
    borderRadius: 4,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingX._5,
    padding: spacingY._8,
    backgroundColor: colors.primary + '20',
    borderRadius: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacingY._30,
    gap: spacingY._10,
  },
  resultContainer: {
    backgroundColor: colors.neutral900,
    padding: spacingY._15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  resultText: {
    lineHeight: 18,
    fontFamily: 'monospace',
  },
  infoSection: {
    flexDirection: 'row',
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._15,
    marginBottom: spacingY._30,
    gap: spacingX._10,
    backgroundColor: colors.info + '10',
    marginHorizontal: spacingX._20,
    borderRadius: 8,
  },
  infoContent: {
    flex: 1,
    gap: spacingY._5,
  },
}); 