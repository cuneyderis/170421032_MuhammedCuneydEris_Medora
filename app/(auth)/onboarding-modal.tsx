import { StyleSheet, View, ScrollView, Alert, ActivityIndicator } from 'react-native';
import React, { useState } from 'react';
import { Stack, router } from 'expo-router';
import { colors, spacingX, spacingY } from '@/constants/theme';
import Typo from '@/components/Typo';
import Button from '@/components/Button';
import { useAuth } from '@/contexts/authContext';
import { UserHealthProfile } from '@/types';
import ProfileInputField from '@/components/ProfileInputField';
import SelectField from '@/components/SelectField';
import DatePickerField from '@/components/DatePickerField';
import * as Icons from 'phosphor-react-native';
import { verticalScale } from '@/utils/styling';

export default function OnboardingModal() {
  const { user, updateHealthProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Basic health profile form state with null values for Firebase compatibility
  const [formData, setFormData] = useState<UserHealthProfile>({
    age: null,
    weight: null,
    height: null,
    gender: null,
    birthDate: '',
    bloodType: '',
    allergies: [],
    chronicConditions: [],
    emergencyContact: {
      name: '',
      phone: '',
      relationship: '',
    },
    lastUpdated: new Date().toISOString(),
  });

  const genderOptions = [
    { label: 'Erkek', value: 'male' },
    { label: 'Kadın', value: 'female' },
    { label: 'Diğer', value: 'other' },
  ];

  // Helper function to prepare data for Firebase by ensuring no undefined values
  const prepareDataForFirebase = (data: UserHealthProfile): UserHealthProfile => {
    const preparedData = { ...data };
    
    // Replace undefined values with null for Firebase compatibility
    if (preparedData.age === undefined) preparedData.age = null;
    if (preparedData.weight === undefined) preparedData.weight = null;
    if (preparedData.height === undefined) preparedData.height = null;
    if (preparedData.gender === undefined) preparedData.gender = null;
    
    // Ensure birthDate is a string
    if (!preparedData.birthDate) preparedData.birthDate = '';
    if (!preparedData.bloodType) preparedData.bloodType = '';
    
    return preparedData;
  };

  const handleSave = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    
    try {
      // Calculate age from birthDate if available
      if (formData.birthDate && (formData.age === undefined || formData.age === null)) {
        const birthDate = new Date(formData.birthDate);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        formData.age = age;
      }
      
      // Ensure lastUpdated is always the current date
      formData.lastUpdated = new Date().toISOString();
      
      // Prepare data for Firebase by replacing undefined with null
      const preparedData = prepareDataForFirebase(formData);
      
      const result = await updateHealthProfile(user.uid, preparedData);
      
      if (result.success) {
        router.push('/(tabs)');
      } else {
        Alert.alert('Hata', result.msg || 'Profil oluşturulurken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Hata', 'Profil oluşturulurken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    
    try {
      // Create an empty health profile with just the timestamp
      const emptyProfile: UserHealthProfile = {
        age: null,
        weight: null,
        height: null,
        gender: null,
        birthDate: '',
        bloodType: '',
        allergies: [],
        chronicConditions: [],
        emergencyContact: {
          name: '',
          phone: '',
          relationship: '',
        },
        lastUpdated: new Date().toISOString(),
      };
      
      // Save the empty profile to mark onboarding as complete
      const result = await updateHealthProfile(user.uid, emptyProfile);
      
      if (result.success) {
        router.push('/(tabs)');
      } else {
        Alert.alert('Hata', result.msg || 'İşlem sırasında bir hata oluştu.');
      }
    } catch (error) {
      console.error('Skip error:', error);
      Alert.alert('Hata', 'İşlem sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Sağlık Profiliniz',
          headerStyle: {
            backgroundColor: colors.neutral900,
          },
          headerTintColor: colors.white,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Icons.Heartbeat size={verticalScale(60)} color={colors.primary} weight="fill" />
          <Typo size={22} fontWeight="600" style={styles.title}>
            Sağlık Profilinizi Tamamlayın
          </Typo>
          <Typo size={16} color={colors.textLighter} style={styles.subtitle}>
            Size daha iyi hizmet verebilmemiz için lütfen sağlık bilgilerinizi girin.
            Bu bilgiler doktorunuzla paylaşılacak ve ileride yapılacak analizlerde kullanılacaktır.
          </Typo>
        </View>
        
        <View style={styles.formContainer}>
          <SelectField
            label="Cinsiyet"
            value={formData.gender || ''}
            options={genderOptions}
            onChange={(value) => setFormData({ ...formData, gender: value as 'male' | 'female' | 'other' })}
          />
          
          <DatePickerField
            label="Doğum Tarihi"
            value={formData.birthDate ? new Date(formData.birthDate) : undefined}
            onChange={(date) => 
              setFormData({ 
                ...formData, 
                birthDate: date ? date.toISOString() : '' 
              })
            }
            maximumDate={new Date()}
          />
          
          <ProfileInputField
            label="Boy (cm)"
            value={formData.height?.toString() || ''}
            onChangeText={(text) => 
              setFormData({ ...formData, height: text ? Number(text) : null })
            }
            keyboardType="numeric"
            placeholder="175"
          />
          
          <ProfileInputField
            label="Kilo (kg)"
            value={formData.weight?.toString() || ''}
            onChangeText={(text) => 
              setFormData({ ...formData, weight: text ? Number(text) : null })
            }
            keyboardType="numeric"
            placeholder="70"
          />
        </View>
        
        <View style={styles.buttonContainer}>
          <Button 
            style={styles.skipButton as any} 
            onPress={handleSkip}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.textLighter} size="small" />
            ) : (
              <Typo color={colors.textLighter}>Atla</Typo>
            )}
          </Button>
          
          <Button 
            style={styles.saveButton} 
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Typo color={colors.white}>Devam Et</Typo>
            )}
          </Button>
        </View>

        <Typo size={12} color={colors.textLighter} style={styles.privacyNote}>
          Sağlık bilgileriniz gizli tutulacak ve sadece sağlık hizmetlerinizi iyileştirmek için kullanılacaktır.
          Dilediğiniz zaman bu bilgileri profil sayfanızdan güncelleyebilir veya silebilirsiniz.
        </Typo>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral900,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacingX._20,
    paddingBottom: spacingY._30,
  },
  header: {
    alignItems: 'center',
    marginVertical: spacingY._30,
  },
  title: {
    marginTop: spacingY._15,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: spacingY._10,
    textAlign: 'center',
  },
  formContainer: {
    marginTop: spacingY._20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacingY._30,
  },
  skipButton: {
    flex: 1,
    marginRight: spacingX._10,
    backgroundColor: colors.neutral800,
  },
  saveButton: {
    flex: 2,
  },
  privacyNote: {
    marginTop: spacingY._20,
    textAlign: 'center',
  },
}); 