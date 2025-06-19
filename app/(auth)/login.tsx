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

const Login = () => {
  const emailRef = useRef("");
  const passwordRef = useRef("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const {login: loginUser} = useAuth();

  const handleSubmit = useCallback(async () => {
    if(!emailRef.current || !passwordRef.current){
      Alert.alert('Giriş Yap', "Lütfen tüm alanları doldurun");
      return;
    }

    setIsLoading(true);
    try {
      const res = await loginUser(emailRef.current, passwordRef.current);
      if(!res.success){
        Alert.alert("Giriş", res.msg);
      }
    } catch (error) {
      Alert.alert("Giriş Hatası", "Giriş yapılırken bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  }, [loginUser]);

  const handleNavigateToRegister = useCallback(() => {
    router.navigate("/(auth)/register");
  }, [router]);

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
            Merhaba,
          </Typo>
          <Typo size={30} fontWeight={"800"}>
            Tekrar Hoş Geldin
          </Typo>
        </View>

        <View style={styles.form}>
          <Typo size={14} color={colors.textLighter}>
            Sağlık verilerinizi takip etmek için giriş yapınız
          </Typo>
          <Typo size={12} color={colors.textLighter} style={styles.roleInfo}>
            Not: Doktor hesabı ile giriş yaparsanız doktor paneline, hasta hesabı ile giriş yaparsanız hasta paneline yönlendirileceksiniz.
          </Typo>
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

          <Typo size={14} color={colors.text} style={styles.forgotPassword}>
            Şifremi Unuttum
          </Typo>

          <Button loading={isLoading} onPress={handleSubmit}>
            <Typo fontWeight={"700"} color={colors.black} size={21}>
              Giriş Yap
            </Typo>
          </Button>
        </View>

        <View style={styles.footer}>
          <Typo size={15}>Hesabınız yok mu?</Typo>
          <Pressable onPress={handleNavigateToRegister}>
            <Typo size={15} fontWeight={'700'} color={colors.primary}>
              Kayıt Olun
            </Typo>
          </Pressable>
        </View>
      </View>
    </ScreenWrapper>
  )
}

export default Login

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
  forgotPassword: {
    alignSelf: 'flex-end',
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
  },
  roleInfo: {
    marginBottom: spacingY._10,
  },
})