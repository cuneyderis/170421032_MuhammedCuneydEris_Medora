import { Alert, Pressable, StyleSheet, View } from 'react-native'
import React, { useCallback, useRef, useState } from 'react'
import ScreenWrapper from '@/components/ScreenWrapper'
import Typo from '@/components/Typo'
import { colors, spacingX, spacingY } from '@/constants/theme'
import { verticalScale } from '@/utils/styling'
import BackButton from '@/components/BackButton'
import Input from '@/components/Input'
import * as Icons from 'phosphor-react-native'
import Button from '@/components/Button'
import { useRouter } from 'expo-router'
import { useAuth } from '@/contexts/authContext'

const Register = () => {
  const emailRef = useRef("");
  const passwordRef = useRef("");
  const firstNameRef = useRef("");
  const lastNameRef = useRef("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { register: registerUser } = useAuth();

  const handleSubmit = useCallback(async () => {
    if (!emailRef.current || !passwordRef.current || !firstNameRef.current || !lastNameRef.current) {
      Alert.alert('Kayıt Ol', "Lütfen tüm alanları doldurun");
      return;
    }

    setIsLoading(true);
    try {
      const res = await registerUser(
        emailRef.current, 
        passwordRef.current, 
        firstNameRef.current, 
        lastNameRef.current
      );
      
      if(!res.success){
        Alert.alert('Kayıt Ol', res.msg);
      }
    } catch (error) {
      Alert.alert('Kayıt Hatası', 'Kayıt olurken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  }, [registerUser]);

  const handleNavigateToLogin = useCallback(() => {
    router.navigate("/(auth)/login");
  }, [router]);

  const handleFirstNameChange = useCallback((value: string) => {
    firstNameRef.current = value;
  }, []);

  const handleLastNameChange = useCallback((value: string) => {
    lastNameRef.current = value;
  }, []);

  const handleEmailChange = useCallback((value: string) => {
    emailRef.current = value;
  }, []);

  const handlePasswordChange = useCallback((value: string) => {
    passwordRef.current = value;
  }, []);

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <BackButton iconSize={28} />

        <View style={styles.titleContainer}>
          <Typo size={30} fontWeight={"800"}>
            Hemen,
          </Typo>
          <Typo size={30} fontWeight={"800"}>
            Şimdi Kaydolun
          </Typo>
        </View>

        <View style={styles.form}>
          <Typo size={14} color={colors.textLighter}>
            Sağlık verilerinizi takip edebilmek için kayıt olunuz
          </Typo>
          <Input
            placeholder='Adınızı giriniz'
            onChangeText={handleFirstNameChange}
            icon={<Icons.User size={verticalScale(26)} color={colors.neutral350} weight='fill' />}
          />
          <Input
            placeholder='Soyadınızı giriniz'
            onChangeText={handleLastNameChange}
            icon={<Icons.IdentificationCard size={verticalScale(26)} color={colors.neutral350} weight='fill' />}
          />
          <Input
            placeholder='Mailinizi giriniz'
            onChangeText={handleEmailChange}
            icon={<Icons.At size={verticalScale(26)} color={colors.neutral350} weight='fill' />}
          />
          <Input
            placeholder='Şifrenizi giriniz'
            secureTextEntry
            onChangeText={handlePasswordChange}
            icon={<Icons.Lock size={verticalScale(26)} color={colors.neutral350} weight='fill' />}
          />

          <Button loading={isLoading} onPress={handleSubmit}>
            <Typo fontWeight={"700"} color={colors.black} size={21}>
              Kayıt Ol
            </Typo>
          </Button>
        </View>

        <View style={styles.footer}>
          <Typo size={15}>Zaten bir hesabınız var mı?</Typo>
          <Pressable onPress={handleNavigateToLogin}>
            <Typo size={15} fontWeight={'700'} color={colors.primary}>
              Giriş Yapın
            </Typo>
          </Pressable>
        </View>
      </View>
    </ScreenWrapper>
  )
}

export default Register

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacingY._30,
    paddingHorizontal: spacingX._20,
  },
  titleContainer: {
    gap: 5, 
    marginTop: spacingY._20
  },
  form: {
    gap: spacingY._20,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
  },
})