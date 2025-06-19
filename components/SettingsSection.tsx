import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import Typo from './Typo';
import { colors, spacingX, spacingY, radius } from '@/constants/theme';
import { verticalScale } from '@/utils/styling';
import * as Icons from 'phosphor-react-native';

interface SettingItemProps {
  icon: JSX.Element;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showArrow?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  showArrow = true,
}) => {
  return (
    <TouchableOpacity style={styles.itemContainer} onPress={onPress}>
      <View style={styles.iconContainer}>{icon}</View>
      <View style={styles.textContainer}>
        <Typo size={14}>{title}</Typo>
        {subtitle && (
          <Typo size={12} color={colors.textLighter}>
            {subtitle}
          </Typo>
        )}
      </View>
      {showArrow && (
        <Icons.CaretRight size={verticalScale(16)} color={colors.textLighter} />
      )}
    </TouchableOpacity>
  );
};

interface SettingsSectionProps {
  title?: string;
  children: React.ReactNode;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ title, children }) => {
  return (
    <View style={styles.sectionContainer}>
      {title && (
        <Typo size={12} color={colors.primary} style={styles.sectionTitle}>
          {title}
        </Typo>
      )}
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginBottom: spacingY._20,
  },
  sectionTitle: {
    marginBottom: spacingY._5,
    marginLeft: spacingX._5,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  sectionContent: {
    backgroundColor: colors.neutral800,
    borderRadius: radius._12,
    overflow: 'hidden',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacingY._15,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral900,
  },
  iconContainer: {
    marginRight: spacingX._15,
  },
  textContainer: {
    flex: 1,
  },
});

export { SettingsSection, SettingItem }; 