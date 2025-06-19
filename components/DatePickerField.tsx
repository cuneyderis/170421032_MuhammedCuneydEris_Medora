import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Modal, Platform, Text } from 'react-native';
import Typo from './Typo';
import { colors, spacingX, spacingY, radius } from '@/constants/theme';
import { verticalScale } from '@/utils/styling';
import * as Icons from 'phosphor-react-native';

interface DatePickerFieldProps {
  label: string;
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  maximumDate?: Date;
}

const DatePickerField: React.FC<DatePickerFieldProps> = ({
  label,
  value,
  onChange,
  maximumDate,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [tempDate, setTempDate] = useState<Date | undefined>(value);
  
  // Simple date picker helpers
  const currentDate = new Date();
  const maxYear = maximumDate?.getFullYear() || currentDate.getFullYear();
  const minYear = 1900;
  
  const [year, setYear] = useState(value?.getFullYear() || currentDate.getFullYear());
  const [month, setMonth] = useState(value?.getMonth() || currentDate.getMonth());
  const [day, setDay] = useState(value?.getDate() || currentDate.getDate());

  const monthNames = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ];

  const toggleModal = () => {
    if (!showModal) {
      // When opening, initialize with current value or current date
      const dateToUse = value || new Date();
      setYear(dateToUse.getFullYear());
      setMonth(dateToUse.getMonth());
      setDay(dateToUse.getDate());
      setTempDate(dateToUse);
    }
    setShowModal(!showModal);
  };

  const handleConfirm = () => {
    const newDate = new Date(year, month, day);
    onChange(newDate);
    setShowModal(false);
  };

  const handleCancel = () => {
    setShowModal(false);
  };

  const handleDayChange = (increment: number) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let newDay = day + increment;
    
    if (newDay < 1) {
      newDay = daysInMonth;
    } else if (newDay > daysInMonth) {
      newDay = 1;
    }
    
    setDay(newDay);
    setTempDate(new Date(year, month, newDay));
  };

  const handleMonthChange = (increment: number) => {
    let newMonth = month + increment;
    let newYear = year;
    
    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }
    
    // Ensure we're within min/max year range
    if (newYear < minYear || newYear > maxYear) {
      return;
    }
    
    setMonth(newMonth);
    setYear(newYear);
    
    // Adjust day if needed (e.g., going from Jan 31 to Feb)
    const daysInNewMonth = new Date(newYear, newMonth + 1, 0).getDate();
    const newDay = day > daysInNewMonth ? daysInNewMonth : day;
    setDay(newDay);
    
    setTempDate(new Date(newYear, newMonth, newDay));
  };

  const handleYearChange = (increment: number) => {
    let newYear = year + increment;
    
    // Ensure we're within min/max year range
    if (newYear < minYear || newYear > maxYear) {
      return;
    }
    
    setYear(newYear);
    
    // Adjust day if needed (e.g., leap year Feb 29)
    const daysInMonth = new Date(newYear, month + 1, 0).getDate();
    const newDay = day > daysInMonth ? daysInMonth : day;
    setDay(newDay);
    
    setTempDate(new Date(newYear, month, newDay));
  };

  return (
    <View style={styles.container}>
      <Typo size={12} color={colors.textLighter} style={styles.label}>
        {label}
      </Typo>
      
      <TouchableOpacity
        style={styles.pickerButton}
        onPress={toggleModal}
      >
        <Typo color={value ? colors.white : colors.neutral400}>
          {value ? value.toLocaleDateString('tr-TR') : 'Seçiniz'}
        </Typo>
        <Icons.CalendarBlank size={verticalScale(20)} color={colors.textLighter} />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={showModal}
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Typo size={16} fontWeight="600">{label}</Typo>
              <TouchableOpacity onPress={handleCancel}>
                <Icons.X size={verticalScale(24)} color={colors.white} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.datePickerContainer}>
              {/* Year Picker */}
              <View style={styles.pickerColumn}>
                <TouchableOpacity onPress={() => handleYearChange(1)}>
                  <Icons.CaretUp size={verticalScale(20)} color={colors.primary} />
                </TouchableOpacity>
                <Typo size={18} fontWeight="600">{year}</Typo>
                <TouchableOpacity onPress={() => handleYearChange(-1)}>
                  <Icons.CaretDown size={verticalScale(20)} color={colors.primary} />
                </TouchableOpacity>
              </View>
              
              {/* Month Picker */}
              <View style={styles.pickerColumn}>
                <TouchableOpacity onPress={() => handleMonthChange(1)}>
                  <Icons.CaretUp size={verticalScale(20)} color={colors.primary} />
                </TouchableOpacity>
                <Typo size={18} fontWeight="600">{monthNames[month]}</Typo>
                <TouchableOpacity onPress={() => handleMonthChange(-1)}>
                  <Icons.CaretDown size={verticalScale(20)} color={colors.primary} />
                </TouchableOpacity>
              </View>
              
              {/* Day Picker */}
              <View style={styles.pickerColumn}>
                <TouchableOpacity onPress={() => handleDayChange(1)}>
                  <Icons.CaretUp size={verticalScale(20)} color={colors.primary} />
                </TouchableOpacity>
                <Typo size={18} fontWeight="600">{day}</Typo>
                <TouchableOpacity onPress={() => handleDayChange(-1)}>
                  <Icons.CaretDown size={verticalScale(20)} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]} 
                onPress={handleCancel}
              >
                <Typo>İptal</Typo>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.confirmButton]} 
                onPress={handleConfirm}
              >
                <Typo>Tamam</Typo>
              </TouchableOpacity>
            </View>
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
  pickerButton: {
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
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacingY._20,
  },
  datePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: spacingY._25,
  },
  pickerColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacingY._10,
    width: verticalScale(90),
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacingY._20,
  },
  button: {
    paddingVertical: spacingY._12,
    paddingHorizontal: spacingX._20,
    borderRadius: radius._10,
    flex: 1,
    alignItems: 'center',
    marginHorizontal: spacingX._5,
  },
  cancelButton: {
    backgroundColor: colors.neutral800,
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
});

export default DatePickerField; 