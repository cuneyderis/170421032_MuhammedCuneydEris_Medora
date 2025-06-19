import { ActivityIndicator as RNActivityIndicator, ActivityIndicatorProps, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { colors } from '@/constants/theme'

const Loading = ({
    size = "large",
    color = colors.primary
}: ActivityIndicatorProps) => {
  return (
    <View style= {{flex:1, justifyContent: 'center', alignItems:'center'}}>
        <RNActivityIndicator size={size} color={color} />
    </View>
  )
}

export default Loading

const styles = StyleSheet.create({})