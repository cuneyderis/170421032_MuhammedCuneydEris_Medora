import { useState, useEffect } from 'react';
import { View, ScrollView, Switch, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Typo from '@/components/Typo';
import ScreenWrapper from '@/components/ScreenWrapper';
import BackButton from '@/components/BackButton';
import { colors, spacingX, spacingY } from '@/constants/theme';
import { verticalScale } from '@/utils/styling';
import * as Icons from 'phosphor-react-native';
import { useAuth } from '@/contexts/authContext';
import { cardioAIService, CardioRiskInput, CardioRiskResult } from '@/services/ai/cardioAI';
import { getHealthData } from '@/utils/googleFitService';

const CardioRiskAssessmentScreen = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CardioRiskResult | null>(null);
  const [useGoogleFit, setUseGoogleFit] = useState(true);

  const [formData, setFormData] = useState<CardioRiskInput>({
    age: 30,
    gender: 2, // 1: Kadın, 2: Erkek
    height: 170,
    weight: 70,
    systolicBP: 120,
    diastolicBP: 80,
    cholesterol: 1, // 1: Normal, 2: Yüksek, 3: Çok yüksek
    glucose: 1, // 1: Normal, 2: Yüksek, 3: Çok yüksek
    smoking: false,
    alcohol: false,
    physicalActivity: true,
  });

  // Kullanıcı profilinden varsayılan değerleri yükle
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        age: user.age || 30,
        gender: user.gender === 'female' ? 1 : 2,
        height: user.height || 170,
        weight: user.weight || 70,
      }));
    }
  }, [user]);

  const handleAssessment = async () => {
    try {
      setLoading(true);
      setResult(null);

      let assessmentResult: CardioRiskResult;

      if (useGoogleFit) {
        // Google Fit verilerini kullan
        try {
          const healthData = await getHealthData();
          const userProfile = {
            age: formData.age,
            gender: formData.gender === 1 ? 'female' : 'male',
            height: formData.height,
            weight: formData.weight,
            smoking: formData.smoking,
            alcohol: formData.alcohol,
            cholesterol: formData.cholesterol,
            glucose: formData.glucose,
          };
          
          assessmentResult = await cardioAIService.analyzeFromHealthData(healthData, userProfile);
        } catch (error) {
          console.log('Google Fit verisi alınamadı, manuel veri kullanılıyor');
          assessmentResult = await cardioAIService.predictCardioRisk(formData);
        }
      } else {
        // Manuel veri kullan
        assessmentResult = await cardioAIService.predictCardioRisk(formData);
      }

      setResult(assessmentResult);
    } catch (error) {
      console.error('Risk değerlendirmesi hatası:', error);
      Alert.alert('Hata', 'Risk değerlendirmesi yapılamadı. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    const riskInfo = cardioAIService.getRiskLevelInfo(riskLevel as any);
    return riskInfo?.color || colors.neutral400;
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return <Icons.CheckCircle size={verticalScale(32)} color={colors.green} weight="fill" />;
      case 'medium':
        return <Icons.Warning size={verticalScale(32)} color={colors.yellow} weight="fill" />;
      case 'high':
        return <Icons.XCircle size={verticalScale(32)} color={colors.rose} weight="fill" />;
      default:
        return <Icons.Question size={verticalScale(32)} color={colors.neutral400} weight="fill" />;
    }
  };

  if (result) {
    return (
      <ScreenWrapper>
        <ScrollView contentContainerStyle={styles.container}>
          <BackButton />
          
          <View style={styles.header}>
            <Typo size={24} fontWeight="800" color={colors.white}>
              Kardiyovasküler Risk Değerlendirmesi
            </Typo>
            <Typo size={14} color={colors.textLighter}>
              AI destekli analiz sonuçlarınız
            </Typo>
          </View>

          {/* Risk Skoru */}
          <View style={[styles.resultCard, { borderColor: getRiskColor(result.riskLevel) }]}>
            <View style={styles.resultHeader}>
              {getRiskIcon(result.riskLevel)}
              <View style={styles.resultInfo}>
                <Typo size={20} fontWeight="700" color={colors.white}>
                  Risk Seviyesi: {cardioAIService.getRiskLevelInfo(result.riskLevel).label}
                </Typo>
                <Typo size={16} color={colors.textLighter}>
                  Risk Skoru: %{result.riskPercentage}
                </Typo>
                <Typo size={14} color={colors.textLighter}>
                  Güven: %{Math.round(result.confidence * 100)}
                </Typo>
              </View>
            </View>
            
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${result.riskPercentage}%`,
                    backgroundColor: getRiskColor(result.riskLevel)
                  }
                ]} 
              />
            </View>
          </View>

          {/* Risk Faktörleri */}
          {result.riskFactors.length > 0 && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Icons.Warning size={verticalScale(20)} color={colors.yellow} weight="fill" />
                <Typo size={18} fontWeight="700" color={colors.white}>
                  Risk Faktörleri
                </Typo>
              </View>
              {result.riskFactors.map((factor, index) => (
                <View key={index} style={styles.listItem}>
                  <Icons.Dot size={verticalScale(16)} color={colors.rose} weight="fill" />
                  <Typo size={14} color={colors.textLighter}>
                    {factor}
                  </Typo>
                </View>
              ))}
            </View>
          )}

          {/* Öneriler */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Icons.Lightbulb size={verticalScale(20)} color={colors.primary} weight="fill" />
              <Typo size={18} fontWeight="700" color={colors.white}>
                Öneriler
              </Typo>
            </View>
            {result.recommendations.map((recommendation, index) => (
              <View key={index} style={styles.listItem}>
                <Icons.CheckCircle size={verticalScale(16)} color={colors.green} weight="fill" />
                <Typo size={14} color={colors.textLighter} style={{ flex: 1 }}>
                  {recommendation}
                </Typo>
              </View>
            ))}
          </View>

          {/* Tekrar Test Et */}
          <View style={styles.actionButtons}>
            <Button 
              onPress={() => setResult(null)}
              style={[styles.button, { backgroundColor: colors.neutral700 }]}
            >
              <Typo fontWeight="700" color={colors.white} size={16}>
                Tekrar Test Et
              </Typo>
            </Button>
            
            <Button 
              onPress={() => router.push('/(tabs)/health-data')}
              style={styles.button}
            >
              <Typo fontWeight="700" color={colors.black} size={16}>
                Sağlık Verilerini Görüntüle
              </Typo>
            </Button>
          </View>
        </ScrollView>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.container}>
        <BackButton />
        
        <View style={styles.header}>
          <Typo size={24} fontWeight="800" color={colors.white}>
            Kardiyovasküler Risk Değerlendirmesi
          </Typo>
          <Typo size={14} color={colors.textLighter}>
            Sağlık verilerinizi girerek risk seviyenizi öğrenin
          </Typo>
        </View>

        {/* Google Fit Entegrasyonu */}
        <View style={styles.switchCard}>
          <View style={styles.switchContent}>
            <Icons.GoogleLogo size={verticalScale(24)} color={colors.primary} weight="fill" />
            <View style={styles.switchText}>
              <Typo size={16} fontWeight="600" color={colors.white}>
                Google Fit Verilerini Kullan
              </Typo>
              <Typo size={12} color={colors.textLighter}>
                Daha doğru sonuçlar için otomatik veri kullanımı
              </Typo>
            </View>
          </View>
          <Switch
            value={useGoogleFit}
            onValueChange={setUseGoogleFit}
            trackColor={{ false: colors.neutral600, true: colors.primary }}
            thumbColor={useGoogleFit ? colors.white : colors.neutral400}
          />
        </View>

        <View style={styles.form}>
          {/* Kişisel Bilgiler */}
          <View style={styles.sectionCard}>
            <Typo size={18} fontWeight="700" color={colors.white} style={styles.sectionTitle}>
              Kişisel Bilgiler
            </Typo>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Typo size={14} color={colors.textLighter} style={styles.inputLabel}>
                  Yaş
                </Typo>
                <Input
                  placeholder="30"
                  keyboardType="numeric"
                  value={formData.age.toString()}
                  onChangeText={v => setFormData({ ...formData, age: parseInt(v) || 0 })}
                  icon={<Icons.User size={verticalScale(20)} color={colors.neutral400} weight="fill" />}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Typo size={14} color={colors.textLighter} style={styles.inputLabel}>
                  Cinsiyet
                </Typo>
                <View style={styles.genderButtons}>
                  <TouchableOpacity
                    style={[styles.genderButton, formData.gender === 1 && styles.genderButtonActive]}
                    onPress={() => setFormData({ ...formData, gender: 1 })}
                  >
                    <Typo size={14} color={formData.gender === 1 ? colors.black : colors.textLighter}>
                      Kadın
                    </Typo>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.genderButton, formData.gender === 2 && styles.genderButtonActive]}
                    onPress={() => setFormData({ ...formData, gender: 2 })}
                  >
                    <Typo size={14} color={formData.gender === 2 ? colors.black : colors.textLighter}>
                      Erkek
                    </Typo>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Typo size={14} color={colors.textLighter} style={styles.inputLabel}>
                  Boy (cm)
                </Typo>
                <Input
                  placeholder="170"
                  keyboardType="numeric"
                  value={formData.height.toString()}
                  onChangeText={v => setFormData({ ...formData, height: parseInt(v) || 0 })}
                  icon={<Icons.Ruler size={verticalScale(20)} color={colors.neutral400} weight="fill" />}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Typo size={14} color={colors.textLighter} style={styles.inputLabel}>
                  Kilo (kg)
                </Typo>
                <Input
                  placeholder="70"
                  keyboardType="numeric"
                  value={formData.weight.toString()}
                  onChangeText={v => setFormData({ ...formData, weight: parseInt(v) || 0 })}
                  icon={<Icons.Scales size={verticalScale(20)} color={colors.neutral400} weight="fill" />}
                />
              </View>
            </View>
          </View>

          {/* Sağlık Verileri */}
          <View style={styles.sectionCard}>
            <Typo size={18} fontWeight="700" color={colors.white} style={styles.sectionTitle}>
              Sağlık Verileri
            </Typo>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Typo size={14} color={colors.textLighter} style={styles.inputLabel}>
                  Üst Tansiyon (Sistolik)
                </Typo>
                <Input
                  placeholder="120"
                  keyboardType="numeric"
                  value={formData.systolicBP?.toString() || ''}
                  onChangeText={v => setFormData({ ...formData, systolicBP: parseInt(v) || undefined })}
                  icon={<Icons.ArrowUp size={verticalScale(20)} color={colors.neutral400} weight="fill" />}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Typo size={14} color={colors.textLighter} style={styles.inputLabel}>
                  Alt Tansiyon (Diyastolik)
                </Typo>
                <Input
                  placeholder="80"
                  keyboardType="numeric"
                  value={formData.diastolicBP?.toString() || ''}
                  onChangeText={v => setFormData({ ...formData, diastolicBP: parseInt(v) || undefined })}
                  icon={<Icons.ArrowDown size={verticalScale(20)} color={colors.neutral400} weight="fill" />}
                />
              </View>
            </View>
          </View>

          {/* Yaşam Tarzı */}
          <View style={styles.sectionCard}>
            <Typo size={18} fontWeight="700" color={colors.white} style={styles.sectionTitle}>
              Yaşam Tarzı
            </Typo>

            <View style={styles.switchContainer}>
              <View style={styles.switchContent}>
                <Icons.Cigarette size={verticalScale(20)} color={colors.rose} weight="fill" />
                <Typo size={16} color={colors.white}>Sigara Kullanıyorum</Typo>
              </View>
              <Switch
                value={formData.smoking}
                onValueChange={v => setFormData({ ...formData, smoking: v })}
                trackColor={{ false: colors.neutral600, true: colors.rose }}
                thumbColor={formData.smoking ? colors.white : colors.neutral400}
              />
            </View>

            <View style={styles.switchContainer}>
              <View style={styles.switchContent}>
                <Icons.Wine size={verticalScale(20)} color={colors.purple} weight="fill" />
                <Typo size={16} color={colors.white}>Alkol Kullanıyorum</Typo>
              </View>
              <Switch
                value={formData.alcohol}
                onValueChange={v => setFormData({ ...formData, alcohol: v })}
                trackColor={{ false: colors.neutral600, true: colors.purple }}
                thumbColor={formData.alcohol ? colors.white : colors.neutral400}
              />
            </View>

            <View style={styles.switchContainer}>
              <View style={styles.switchContent}>
                <Icons.Barbell size={verticalScale(20)} color={colors.green} weight="fill" />
                <Typo size={16} color={colors.white}>Fiziksel Olarak Aktifim</Typo>
              </View>
              <Switch
                value={formData.physicalActivity}
                onValueChange={v => setFormData({ ...formData, physicalActivity: v })}
                trackColor={{ false: colors.neutral600, true: colors.green }}
                thumbColor={formData.physicalActivity ? colors.white : colors.neutral400}
              />
            </View>
          </View>

          <Button 
            onPress={handleAssessment} 
            style={styles.assessButton}
            loading={loading}
          >
            <Typo fontWeight="700" color={colors.black} size={18}>
              {loading ? 'Analiz Ediliyor...' : 'Risk Analizini Başlat'}
            </Typo>
          </Button>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

export default CardioRiskAssessmentScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: spacingX._20,
    paddingTop: spacingY._10,
    paddingBottom: spacingY._40,
  },
  header: {
    marginBottom: spacingY._25,
    paddingVertical: spacingY._15,
  },
  form: {
    gap: spacingY._20,
  },
  sectionCard: {
    backgroundColor: colors.neutral800,
    borderRadius: 16,
    padding: spacingX._20,
    borderWidth: 1,
    borderColor: colors.neutral600,
    gap: spacingY._15,
  },
  sectionTitle: {
    marginBottom: spacingY._10,
  },
  row: {
    flexDirection: 'row',
    gap: spacingX._15,
  },
  inputLabel: {
    marginBottom: spacingY._8,
  },
  genderButtons: {
    flexDirection: 'row',
    gap: spacingX._10,
  },
  genderButton: {
    flex: 1,
    paddingVertical: spacingY._12,
    paddingHorizontal: spacingX._15,
    borderRadius: 8,
    backgroundColor: colors.neutral700,
    borderWidth: 1,
    borderColor: colors.neutral600,
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  switchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.neutral800,
    borderRadius: 12,
    padding: spacingX._15,
    borderWidth: 1,
    borderColor: colors.neutral600,
    marginBottom: spacingY._20,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacingY._5,
  },
  switchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingX._10,
  },
  switchText: {
    flex: 1,
  },
  assessButton: {
    marginTop: spacingY._20,
    paddingVertical: spacingY._15,
  },
  resultCard: {
    backgroundColor: colors.neutral800,
    borderRadius: 16,
    padding: spacingX._20,
    borderWidth: 2,
    marginBottom: spacingY._20,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacingY._15,
  },
  resultInfo: {
    flex: 1,
    marginLeft: spacingX._15,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingX._10,
    marginBottom: spacingY._10,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacingX._10,
    marginBottom: spacingY._8,
  },
  actionButtons: {
    gap: spacingY._15,
    marginTop: spacingY._20,
  },
  button: {
    paddingVertical: spacingY._15,
  },
}); 