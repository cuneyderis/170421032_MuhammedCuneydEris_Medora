// app/(tabs)/predict.tsx
import { useState, useEffect } from 'react';
import { View, ScrollView, Switch, StyleSheet, TouchableOpacity } from 'react-native';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Typo from '@/components/Typo';
import { colors, spacingX, spacingY } from '@/constants/theme';
import { verticalScale } from '@/utils/styling';
import * as Icons from 'phosphor-react-native'
import ScreenWrapper from '@/components/ScreenWrapper';
import { useAuth } from '@/contexts/authContext';
import { useRouter } from 'expo-router';
import { cardioAIService, CardioRiskResult } from '@/services/ai/cardioAI';
import { dataManager, UserHealthProfile } from '@/utils/dataManager';
import { APP_CONFIG } from '@/constants/config';


const HomeScreen = () => {
  const { user } = useAuth();
  const router = useRouter();
  const isDoctor = user?.role === 'doctor';

  if (isDoctor) {
    return <DoctorHomeScreen />;
  } else {
    return <PatientHomeScreen />;
  }
};

const DoctorHomeScreen = () => {
  const { user, refreshUserData } = useAuth();
  const router = useRouter();

  // Refresh user data when component mounts
  useEffect(() => {
    refreshUserData();
  }, []);

  const doctorMenuItems = [
    {
      title: 'Hastalarım',
      subtitle: 'Hasta listemi ve bilgilerini görüntüle',
      icon: <Icons.Users size={verticalScale(32)} color={colors.primary} weight="fill" />,
      onPress: () => router.push('/(tabs)/patients'),
      bgColor: colors.neutral800,
    },
    {
      title: 'Randevular',
      subtitle: 'Günlük randevularımı ve programımı görüntüle',
      icon: <Icons.Calendar size={verticalScale(32)} color={colors.green} weight="fill" />,
      onPress: () => router.push('/(tabs)/appointment'),
      bgColor: colors.neutral800,
    },
    {
      title: 'Mesajlar',
      subtitle: 'Hasta mesajlarını ve iletişimimi yönet',
      icon: <Icons.ChatCircleText size={verticalScale(32)} color={colors.primaryLight} weight="fill" />,
      onPress: () => router.push('/(tabs)/messages'),
      bgColor: colors.neutral800,
    },
    {
      title: 'Profil Ayarları',
      subtitle: 'Doktor profilimi ve ayarlarımı düzenle',
      icon: <Icons.UserGear size={verticalScale(32)} color={colors.rose} weight="fill" />,
      onPress: () => router.push('/(tabs)/profile'),
      bgColor: colors.neutral800,
    },
  ];

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Typo size={28} fontWeight="800" color={colors.white}>
            Hoş Geldiniz,
          </Typo>
          <Typo size={22} fontWeight="600" color={colors.primary}>
            {user?.firstName && user?.lastName 
              ? `Dr. ${user.firstName} ${user.lastName}`
              : user?.firstName 
                ? `Dr. ${user.firstName}`
                : 'Dr.'
            }
          </Typo>
          {user?.doctorProfile?.specialization && (
            <Typo size={14} color={colors.textLighter}>
              {user.doctorProfile.specialization} • {user?.doctorProfile?.hospital || 'Hastane'}
            </Typo>
          )}
        </View>

        <View style={styles.menuGrid}>
          {doctorMenuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, { backgroundColor: item.bgColor }]}
              onPress={item.onPress}
            >
              <View style={styles.menuIcon}>
                {item.icon}
              </View>
              <View style={styles.menuContent}>
                <Typo size={16} fontWeight="700" color={colors.text}>
                  {item.title}
                </Typo>
                <Typo size={12} color={colors.textLighter} textProps={{ numberOfLines: 2 }}>
                  {item.subtitle}
                </Typo>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const PatientHomeScreen = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [cardioRisk, setCardioRisk] = useState<CardioRiskResult | null>(null);
  const [isLoadingRisk, setIsLoadingRisk] = useState(false);

  // Kardiyovasküler risk analizi yap
  useEffect(() => {
    const performRiskAnalysis = async () => {
      if (!user?.uid) return;
      
      try {
        setIsLoadingRisk(true);
        
        // Kullanıcı profili hazırla
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

        // Mock/Google Fit verilerini al (şimdilik boş array)
        const healthData: any[] = [];
        
        console.log('🔄 Ana sayfa risk analizi başlıyor...', {
          useMockData: APP_CONFIG.USE_MOCK_DATA,
          userProfile: Object.keys(userProfile).length
        });
        
        const result = await cardioAIService.analyzeFromHealthData(healthData, userProfile);
        setCardioRisk(result);
      } catch (error) {
        console.error('Risk analizi hatası:', error);
      } finally {
        setIsLoadingRisk(false);
      }
    };

    performRiskAnalysis();
  }, [user]);

  const aiHealthMenuItems = [
    {
      title: 'Kardiyovasküler Risk',
      subtitle: 'Kalp hastalığı risk analizinizi yapın',
      icon: <Icons.Heart size={verticalScale(32)} color={colors.rose} weight="fill" />,
      onPress: () => router.push('/ai-health-assessment'),
      bgColor: 'rgba(239, 68, 68, 0.1)',
      borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    {
      title: 'EKG Analizi',
      subtitle: 'Elektrokardiyogram verilerinizi analiz edin',
      icon: <Icons.Pulse size={verticalScale(32)} color={colors.green} weight="fill" />,
      onPress: () => router.push('/ai-health-assessment'),
      bgColor: 'rgba(34, 197, 94, 0.1)',
      borderColor: 'rgba(34, 197, 94, 0.3)',
    },
    {
      title: 'Sağlık Verileri',
      subtitle: 'Google Fit verilerinizi görüntüleyin',
      icon: <Icons.ChartLine size={verticalScale(32)} color={colors.primary} weight="fill" />,
      onPress: () => router.push('/(tabs)/health-data'),
      bgColor: 'rgba(59, 130, 246, 0.1)',
      borderColor: 'rgba(59, 130, 246, 0.3)',
    },
    {
      title: 'AI Sağlık Asistanı',
      subtitle: 'Kişiselleştirilmiş sağlık önerileri alın',
      icon: <Icons.Robot size={verticalScale(32)} color={colors.purple} weight="fill" />,
      onPress: () => router.push('/(tabs)/ai-health'),
      bgColor: 'rgba(147, 51, 234, 0.1)',
      borderColor: 'rgba(147, 51, 234, 0.3)',
    },
  ];

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.patientHeader}>
          <Typo size={28} fontWeight="800" color={colors.white}>
            Merhaba, {user?.firstName}
          </Typo>
          <Typo size={16} color={colors.textLighter}>
            AI destekli sağlık analizlerinizi yapın
          </Typo>
        </View>

        {/* Kardiyovasküler Risk Kartı */}
        {cardioRisk && (
          <View style={styles.riskCard}>
            <View style={styles.riskHeader}>
              <Icons.Heart size={verticalScale(24)} color={colors.rose} weight="fill" />
              <Typo size={18} fontWeight="700" color={colors.white} style={{ marginLeft: spacingX._10 }}>
                Kardiyovasküler Risk Durumunuz
              </Typo>
            </View>
            <View style={styles.riskContent}>
              <View style={styles.riskScore}>
                <Typo size={32} fontWeight="800" color={cardioAIService.getRiskLevelInfo(cardioRisk.riskLevel).color}>
                  %{cardioRisk.riskPercentage}
                </Typo>
                <Typo size={16} fontWeight="600" color={cardioAIService.getRiskLevelInfo(cardioRisk.riskLevel).color}>
                  {cardioAIService.getRiskLevelInfo(cardioRisk.riskLevel).label}
                </Typo>
              </View>
              <TouchableOpacity 
                style={styles.riskButton}
                onPress={() => router.push('/ai-health-assessment')}
              >
                <Typo size={14} fontWeight="600" color={colors.primary}>
                  Detayları Gör
                </Typo>
                <Icons.ArrowRight size={verticalScale(16)} color={colors.primary} weight="bold" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Icons.Brain size={verticalScale(24)} color={colors.primary} weight="fill" />
          <Typo size={20} fontWeight="700" color={colors.white} style={{ marginLeft: spacingX._10 }}>
            AI Sağlık Analizi
          </Typo>
        </View>

        <View style={styles.menuGrid}>
          {aiHealthMenuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.aiMenuItem, { 
                backgroundColor: item.bgColor,
                borderColor: item.borderColor,
              }]}
              onPress={item.onPress}
            >
              <View style={styles.aiMenuIcon}>
                {item.icon}
              </View>
              <View style={styles.menuContent}>
                <Typo size={18} fontWeight="700" color={colors.white}>
                  {item.title}
                </Typo>
                <Typo size={14} color={colors.textLighter} textProps={{ numberOfLines: 2 }}>
                  {item.subtitle}
                </Typo>
              </View>
              <Icons.CaretRight size={verticalScale(20)} color={colors.textLighter} weight="bold" />
            </TouchableOpacity>
          ))}
        </View>

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
              onPress={() => router.push('/(tabs)/appointments')}
            >
              <Icons.Calendar size={verticalScale(24)} color={colors.primary} weight="fill" />
              <Typo size={12} color={colors.textLighter} style={{ textAlign: 'center' }}>
                Randevular
              </Typo>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickStatItem}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <Icons.User size={verticalScale(24)} color={colors.purple} weight="fill" />
              <Typo size={12} color={colors.textLighter} style={{ textAlign: 'center' }}>
                Profil
              </Typo>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </ScreenWrapper>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: spacingX._20,
    paddingTop: spacingY._20,
    paddingBottom: spacingY._40,
  },
  header: {
    marginBottom: spacingY._30,
    paddingVertical: spacingY._20,
  },
  patientHeader: {
    marginBottom: spacingY._20,
    paddingVertical: spacingY._15,
  },
  menuGrid: {
    gap: spacingY._15,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacingX._15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral600,
  },
  menuIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.neutral700,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacingX._15,
  },
  menuContent: {
    flex: 1,
    gap: 4,
  },
  form: {
    gap: spacingY._20,
  },
  title: {
    marginBottom: spacingY._10,
  },
  subtitle: {
    marginBottom: spacingY._20,
  },
  row: {
    flexDirection: 'row',
    gap: spacingX._10,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacingY._10,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral200,
  },
  button: {
    marginTop: spacingY._20,
  },
  inputLabel: {
    marginBottom: spacingY._5,
  },
  riskCard: {
    backgroundColor: colors.neutral900,
    padding: spacingX._20,
    borderRadius: 16,
    marginBottom: spacingY._20,
    borderWidth: 1,
    borderColor: colors.neutral700,
  },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacingY._15,
  },
  riskContent: {
    gap: spacingY._10,
  },
  riskScore: {
    alignItems: 'center',
    gap: spacingY._5,
  },
  riskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary + '20',
    paddingVertical: spacingY._10,
    paddingHorizontal: spacingX._15,
    borderRadius: 8,
    gap: spacingX._8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacingY._20,
  },
  aiMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacingX._15,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacingY._10,
  },
  aiMenuIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacingX._15,
  },
  quickStatsContainer: {
    marginTop: spacingY._20,
  },
  quickStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacingY._10,
  },
  quickStatItem: {
    width: '48%',
    backgroundColor: colors.neutral900,
    padding: spacingX._15,
    borderRadius: 12,
    alignItems: 'center',
    gap: spacingY._8,
    borderWidth: 1,
    borderColor: colors.neutral700,
  },

});