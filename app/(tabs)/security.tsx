import { StyleSheet, View, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native'
import React, { useState, useEffect } from 'react';
import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import { colors, spacingX, spacingY, radius } from '@/constants/theme';
import * as Icons from 'phosphor-react-native';
import { verticalScale } from '@/utils/styling';
import { useAuth } from '@/contexts/authContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { firestore } from '@/config/firebase';

// Kullanıcı veri ayarları için tip tanımı
interface SecuritySettings {
  dataSharing: {
    shareWithDoctor: boolean;
    shareWithFamilyDoctor: boolean;
    shareWithHospital: boolean;
    shareWithEmergencyContacts: boolean;
    shareAnonymouslyForResearch: boolean;
  };
  privacyOptions: {
    hideProfileFromSearch: boolean;
    hideHealthMetrics: boolean;
    enableTwoFactorAuth: boolean;
    receiveSecurityAlerts: boolean;
  };
}

const defaultSettings: SecuritySettings = {
  dataSharing: {
    shareWithDoctor: true,
    shareWithFamilyDoctor: true,
    shareWithHospital: true,
    shareWithEmergencyContacts: true,
    shareAnonymouslyForResearch: false,
  },
  privacyOptions: {
    hideProfileFromSearch: false,
    hideHealthMetrics: false,
    enableTwoFactorAuth: false,
    receiveSecurityAlerts: true,
  }
};

const SecurityScreen = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<SecuritySettings>(defaultSettings);
  const [saveInProgress, setSaveInProgress] = useState(false);

  // Kullanıcı gizlilik ayarlarını yükle
  useEffect(() => {
    const loadSettings = async () => {
      if (!user?.uid) return;
      
      try {
        const docRef = doc(firestore, "patients", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists() && docSnap.data().securitySettings) {
          setSettings(docSnap.data().securitySettings);
        }
      } catch (error) {
        console.error('Error loading security settings:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, [user]);

  // Ayarları kaydet
  const saveSettings = async () => {
    if (!user?.uid) return;
    
    setSaveInProgress(true);
    
    try {
      const docRef = doc(firestore, "patients", user.uid);
      await updateDoc(docRef, {
        securitySettings: settings
      });
      Alert.alert('Başarılı', 'Gizlilik ayarlarınız kaydedildi.');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Hata', 'Ayarlar kaydedilirken bir hata oluştu.');
    } finally {
      setSaveInProgress(false);
    }
  };

  // Veri paylaşım ayarlarını güncelle
  const toggleDataSharingOption = (option: keyof SecuritySettings['dataSharing']) => {
    setSettings({
      ...settings,
      dataSharing: {
        ...settings.dataSharing,
        [option]: !settings.dataSharing[option]
      }
    });
  };

  // Gizlilik seçeneğini güncelle
  const togglePrivacyOption = (option: keyof SecuritySettings['privacyOptions']) => {
    setSettings({
      ...settings,
      privacyOptions: {
        ...settings.privacyOptions,
        [option]: !settings.privacyOptions[option]
      }
    });
  };

  // Ayar bölümü bileşeni
  const SettingsSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <View style={styles.section}>
      <Typo size={14} color={colors.primary} style={styles.sectionTitle}>
        {title}
      </Typo>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );

  // Ayar öğesi bileşeni
  const SettingItem = ({ 
    title, 
    description, 
    value, 
    onToggle,
    icon
  }: { 
    title: string, 
    description: string, 
    value: boolean, 
    onToggle: () => void,
    icon: JSX.Element
  }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingIconContainer}>
        {icon}
      </View>
      <View style={styles.settingTextContainer}>
        <Typo size={14} fontWeight="600">{title}</Typo>
        <Typo size={12} color={colors.textLighter}>{description}</Typo>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.neutral700, true: colors.primary }}
        thumbColor={colors.white}
      />
    </View>
  );

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingContainer}>
          <Icons.CircleNotch size={40} color={colors.primary} weight="thin" />
          <Typo style={styles.loadingText}>Ayarlar yükleniyor</Typo>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <View style={styles.header}>
          <Icons.Shield size={verticalScale(40)} color={colors.primary} weight="duotone" />
          <Typo size={24} fontWeight="600" style={styles.title}>
            Gizlilik ve Güvenlik
          </Typo>
          <Typo size={14} color={colors.textLighter} style={styles.subtitle}>
            Kişisel sağlık verilerinizin kiminle paylaşılacağını ve uygulamada nasıl gösterileceğini kontrol edin
          </Typo>
        </View>

        <SettingsSection title="VERİ PAYLAŞIMI">
          <SettingItem
            title="Doktorumla Paylaş"
            description="Sağlık verileriniz seçtiğiniz doktorla paylaşılır"
            value={settings.dataSharing.shareWithDoctor}
            onToggle={() => toggleDataSharingOption('shareWithDoctor')}
            icon={<Icons.UserCircle size={24} color={colors.primary} weight="duotone" />}
          />
          <SettingItem
            title="Aile Hekimimle Paylaş"
            description="Sağlık verileriniz aile hekiminizle paylaşılır"
            value={settings.dataSharing.shareWithFamilyDoctor}
            onToggle={() => toggleDataSharingOption('shareWithFamilyDoctor')}
            icon={<Icons.FirstAid size={24} color={colors.primary} weight="duotone" />}
          />
          <SettingItem
            title="Hastanelerle Paylaş"
            description="Acil durumda hastanelerin verilerinize erişmesine izin verir"
            value={settings.dataSharing.shareWithHospital}
            onToggle={() => toggleDataSharingOption('shareWithHospital')}
            icon={<Icons.Hospital size={24} color={colors.primary} weight="duotone" />}
          />
          <SettingItem
            title="Acil Durum Kişileriyle Paylaş"
            description="Acil durumda belirlediğiniz kişilere bilgi verilir"
            value={settings.dataSharing.shareWithEmergencyContacts}
            onToggle={() => toggleDataSharingOption('shareWithEmergencyContacts')}
            icon={<Icons.Bell size={24} color={colors.primary} weight="duotone" />}
          />
          <SettingItem
            title="Araştırma Amaçlı Anonim Paylaşım"
            description="Verileriniz kimliğiniz gizlenerek bilimsel araştırmalarda kullanılabilir"
            value={settings.dataSharing.shareAnonymouslyForResearch}
            onToggle={() => toggleDataSharingOption('shareAnonymouslyForResearch')}
            icon={<Icons.MagnifyingGlass size={24} color={colors.primary} weight="duotone" />}
          />
        </SettingsSection>

        <SettingsSection title="GİZLİLİK AYARLARI">
          <SettingItem
            title="Profili Aramalardan Gizle"
            description="Diğer kullanıcılar sizi aramalarında bulamaz"
            value={settings.privacyOptions.hideProfileFromSearch}
            onToggle={() => togglePrivacyOption('hideProfileFromSearch')}
            icon={<Icons.MagnifyingGlass size={24} color={colors.primary} weight="duotone" />}
          />
          <SettingItem
            title="Sağlık Metriklerini Gizle"
            description="Sağlık verileriniz profil sayfanızda görünmez"
            value={settings.privacyOptions.hideHealthMetrics}
            onToggle={() => togglePrivacyOption('hideHealthMetrics')}
            icon={<Icons.EyeSlash size={24} color={colors.primary} weight="duotone" />}
          />
          <SettingItem
            title="İki Faktörlü Doğrulama"
            description="Giriş yaparken ek güvenlik doğrulaması gerektirir"
            value={settings.privacyOptions.enableTwoFactorAuth}
            onToggle={() => togglePrivacyOption('enableTwoFactorAuth')}
            icon={<Icons.Key size={24} color={colors.primary} weight="duotone" />}
          />
          <SettingItem
            title="Güvenlik Uyarıları"
            description="Hesabınızla ilgili güvenlik uyarıları alın"
            value={settings.privacyOptions.receiveSecurityAlerts}
            onToggle={() => togglePrivacyOption('receiveSecurityAlerts')}
            icon={<Icons.Warning size={24} color={colors.primary} weight="duotone" />}
          />
        </SettingsSection>

        <TouchableOpacity 
          style={styles.saveButton}
          onPress={saveSettings}
          disabled={saveInProgress}
        >
          <Typo color={colors.white} size={16} fontWeight="600">
            {saveInProgress ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
          </Typo>
        </TouchableOpacity>

        <TouchableOpacity style={styles.privacyPolicyButton}>
          <Icons.FileText size={16} color={colors.textLighter} style={styles.policyIcon} />
          <Typo color={colors.textLighter} size={12}>
            Gizlilik Politikası ve Kullanım Koşullarını Görüntüle
          </Typo>
        </TouchableOpacity>
      </ScrollView>
    </ScreenWrapper>
  );
};

export default SecurityScreen;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacingX._15,
    paddingBottom: spacingY._30,
  },
  header: {
    alignItems: 'center',
    marginVertical: spacingY._20,
  },
  title: {
    marginTop: spacingY._10,
  },
  subtitle: {
    marginTop: spacingY._5,
    textAlign: 'center',
    paddingHorizontal: spacingX._10,
  },
  section: {
    marginBottom: spacingY._20,
  },
  sectionTitle: {
    marginBottom: spacingY._10,
    paddingLeft: spacingX._5,
    fontWeight: '600',
  },
  sectionContent: {
    backgroundColor: colors.neutral800,
    borderRadius: radius._12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    padding: spacingY._15,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral900,
    alignItems: 'center',
  },
  settingIconContainer: {
    marginRight: spacingX._12,
  },
  settingTextContainer: {
    flex: 1,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: radius._10,
    paddingVertical: spacingY._15,
    alignItems: 'center',
    marginTop: spacingY._20,
    marginBottom: spacingY._10,
  },
  privacyPolicyButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacingY._10,
  },
  policyIcon: {
    marginRight: spacingX._5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacingY._10,
  }
});