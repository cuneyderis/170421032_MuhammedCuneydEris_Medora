import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Modal, FlatList } from 'react-native';
import Typo from './Typo';
import { colors, spacingX, spacingY, radius } from '@/constants/theme';
import { verticalScale } from '@/utils/styling';
import * as Icons from 'phosphor-react-native';

interface SelectOption {
  label: string;
  value: string;
}

interface SelectFieldProps {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
}

const SelectField: React.FC<SelectFieldProps> = ({
  label,
  value,
  options,
  onChange,
  placeholder = 'Seçiniz',
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedOption = options.find(option => option.value === value);

  const handleSelect = (option: SelectOption) => {
    onChange(option.value);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Typo size={12} color={colors.textLighter} style={styles.label}>
        {label}
      </Typo>
      
      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => setModalVisible(true)}
      >
        <Typo color={selectedOption ? colors.white : colors.neutral400}>
          {selectedOption ? selectedOption.label : placeholder}
        </Typo>
        <Icons.CaretDown size={verticalScale(16)} color={colors.textLighter} />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Typo size={16} fontWeight="600">{label}</Typo>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icons.X size={verticalScale(24)} color={colors.white} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => handleSelect(item)}
                >
                  <Typo>{item.label}</Typo>
                  {item.value === value && (
                    <Icons.Check size={verticalScale(20)} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.optionsList}
            />
          </View>
        </View>
      </Modal>
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
  selectButton: {
    height: verticalScale(48),
    backgroundColor: colors.neutral800,
    borderRadius: radius._10,
    paddingHorizontal: spacingX._15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.neutral900,
    borderTopLeftRadius: radius._20,
    borderTopRightRadius: radius._20,
    padding: spacingY._20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacingY._15,
    paddingHorizontal: spacingX._5,
  },
  optionsList: {
    paddingBottom: spacingY._20,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacingY._12,
    paddingHorizontal: spacingX._5,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral800,
  },
});

export default SelectField; 