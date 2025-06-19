import { Dimensions, Platform, StatusBar, StyleSheet, View } from 'react-native'
import React, { memo, useMemo } from 'react'
import { ScreenWrapperProps } from '@/types'
import { colors } from '@/constants/theme'

const {height} = Dimensions.get("window")

const ScreenWrapper = memo(({style, children}: ScreenWrapperProps) => {
    const paddingTop = Platform.OS === 'ios' ? height * 0.06 : 25;
    
    const containerStyle = useMemo(() => ([
      {
        paddingTop,
        flex: 1,
        backgroundColor: colors.neutral900
      },
      style
    ]), [style, paddingTop]);
    
    return (
      <View style={containerStyle}>
        <StatusBar barStyle="light-content" />
        {children}
      </View>
    )
})

export default ScreenWrapper

const styles = StyleSheet.create({})