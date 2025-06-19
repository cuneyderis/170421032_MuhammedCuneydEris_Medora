import React from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity } from 'react-native';
import Typo from './Typo';
import { colors, spacingX, spacingY, radius } from '@/constants/theme';
import { verticalScale } from '@/utils/styling';

interface ProfileInputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad' | 'numeric' | 'email-address' | 'phone-pad';
  secureTextEntry?: boolean;
  editable?: boolean;
  icon?: JSX.Element;
  onIconPress?: () => void;
}

const ProfileInputField: React.FC<ProfileInputFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  secureTextEntry = false,
  editable = true,
  icon,
  onIconPress,
}) => {
  return (
    <View style={styles.container}>
      <Typo size={12} color={colors.textLighter} style={styles.label}>
        {label}
      </Typo>
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            !editable && styles.disabledInput,
            icon && styles.inputWithIcon,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.neutral400}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          editable={editable}
          selectionColor={colors.primary}
        />
        {icon && (
          <TouchableOpacity
            style={styles.iconContainer}
            onPress={onIconPress}
            disabled={!onIconPress}
          >
            {icon}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacingY._15,
  },
  label: {
    marginBottom: spacingY._5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: verticalScale(48),
    backgroundColor: colors.neutral800,
    borderRadius: radius._10,
    paddingHorizontal: spacingX._15,
    color: colors.white,
    fontFamily: 'Inter-Regular',
    fontSize: verticalScale(14),
  },
  inputWithIcon: {
    paddingRight: spacingX._40,
  },
  disabledInput: {
    opacity: 0.7,
  },
  iconContainer: {
    position: 'absolute',
    right: spacingX._15,
  },
});

export default ProfileInputField; 