import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { BackButtonProps } from '@/types'
import { router } from 'expo-router'
import { CaretLeft } from 'phosphor-react-native'
import { verticalScale } from '@/utils/styling'
import { colors, radius } from '@/constants/theme'

const BackButton = ({
    style,
    iconSize=26,
}:BackButtonProps) => {
  return (
    <TouchableOpacity onPress={() => router.back()} style={[styles.button,style]}>
      <CaretLeft
      size={verticalScale(iconSize)}
      color={colors.white}
      weight='bold'
      >


      </CaretLeft>
    </TouchableOpacity>
  )
}

export default BackButton

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.neutral900,
    alignSelf: 'flex-start',
    borderRadius: radius._12,
    borderCurve: "continuous",
    padding: 5,


  }
})