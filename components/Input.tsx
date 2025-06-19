import { StyleSheet, TextInput, View } from 'react-native'
import React, { memo } from 'react'
import { InputProps } from '@/types'
import { colors, radius, spacingX } from '@/constants/theme'
import { verticalScale } from '@/utils/styling'

const Input = memo((props: InputProps) => {
  const { 
    icon, 
    containerStyle, 
    inputStyle, 
    inputRef,
    ...restProps 
  } = props;
  
  return (
    <View style={[styles.container, containerStyle]}>
      {icon && icon}
      <TextInput
        style={[styles.input, inputStyle]}
        placeholderTextColor={colors.neutral400}
        ref={inputRef}
        {...restProps}
      />
    </View>
  )
})

export default Input

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        height: verticalScale(54),
        alignItems: 'center',
        justifyContent: "center",
        borderWidth: 1,
        borderColor: colors.neutral300,
        borderRadius: radius._17,
        borderCurve: "continuous",
        paddingHorizontal: spacingX._15,
        gap: spacingX._10,
    },
    input: {
        flex: 1,
        color: colors.white,
        fontSize: verticalScale(14),
    },
})