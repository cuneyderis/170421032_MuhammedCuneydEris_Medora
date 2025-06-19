import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import ScreenWrapper from '@/components/ScreenWrapper'
import Typo from '@/components/Typo'
import { colors } from '@/constants/theme'

const graphs = () => {
  return (
    <ScreenWrapper>
      <Typo color={colors.white}>Grafikler</Typo>
    </ScreenWrapper>
  )
}

export default graphs

const styles = StyleSheet.create({})