import { StyleSheet, Text, TouchableOpacity, View, Image, } from 'react-native'
import React from 'react'
import ScreenWrapper from '@/components/ScreenWrapper'
import Typo from '@/components/Typo'
import { colors, spacingX, spacingY } from '@/constants/theme'
import { verticalScale } from '@/utils/styling'
import Button from '@/components/Button'
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated'
import { useRouter } from 'expo-router'

const Welcome = () => {

  const router = useRouter();
  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.loginButton}>
            <Typo fontWeight={"500"}>Giriş Yap</Typo>
          </TouchableOpacity>

          <Animated.Image
            entering={FadeIn.duration(500)}
            source={require("../../assets/images/welcome.png")}
            style={styles.welcomeImage}
            resizeMode="contain"
          />


        </View>

        <View style={styles.footer}>
          <Animated.View entering={FadeInDown.duration(1000).springify().damping(12)} style={{ alignItems: "center" }}>
            <Typo size={30} fontWeight={"800"}>
              Medora ile sağlığınız
            </Typo>
            <Typo size={30} fontWeight={"800"}>
              hakkında aydınlanın
            </Typo>
          </Animated.View>
          <Animated.View entering={FadeInDown.duration(1000)
          .delay(200)
          .springify()
          .damping(12)} 
          style={styles.buttonContainer}
          
          >

            <Button onPress={() => router.push('/(auth)/register')}>
              <Typo size={22} color={colors.neutral900} fontWeight={"600"}>
                Hemen Kaydol
              </Typo>
            </Button>

          </Animated.View>

        </View>

      </View>
    </ScreenWrapper>
  )
}

export default Welcome

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingTop: spacingY._7,
  },
  welcomeImage: {
    width: "100%",
    height: verticalScale(350),
    alignSelf: "center",
  },
  loginButton: {
    alignSelf: "flex-end",
    marginRight: spacingX._20,
  },
  footer: {
    backgroundColor: colors.neutral900,

    alignItems: "center",
    paddingTop: verticalScale(30),
    paddingBottom: verticalScale(45),
    gap: spacingY._20,
    shadowColor: "white",
    shadowOffset: { width: 0, height: -10 },
    elevation: 10,
    shadowRadius: 25,
    shadowOpacity: 0.15,
  },
  buttonContainer: {
    width: "100%",
    paddingHorizontal: spacingX._25,
  }


})