import { StyleSheet, View, ScrollView, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import Button from '@/components/Button';
import { colors, spacingX, spacingY } from '@/constants/theme';
import * as Icons from 'phosphor-react-native';
import { verticalScale } from '@/utils/styling';
import { Doctor, TimeSlot, AppointmentRequest } from '@/types/appointment';
import { appointmentService } from '@/services/appointmentService';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/contexts/authContext';

const DoctorDetailScreen = () => {
  const { user } = useAuth();
  const { doctorId } = useLocalSearchParams<{ doctorId: string }>();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingData, setBookingData] = useState({
    reason: '',
    type: 'consultation' as const,
    notes: '',
    symptoms: [] as string[]
  });

  useEffect(() => {
    if (doctorId) {
      loadDoctorData();
    }
  }, [doctorId]);

  useEffect(() => {
    if (doctor) {
      loadAvailableSlots();
    }
  }, [doctor, selectedDate]);

  const loadDoctorData = async () => {
    try {
      setLoading(true);
      const doctorData = await appointmentService.getDoctorById(doctorId);
      setDoctor(doctorData);
    } catch (error) {
      console.error('Error loading doctor:', error);
      Alert.alert('Hata', 'Doktor bilgileri yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSlots = async () => {
    if (!doctor) return;
    
    try {
      const slots = await appointmentService.getDoctorAvailableSlots(doctor.id, selectedDate);
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error loading slots:', error);
      setAvailableSlots([]);
    }
  };

  const handleDateSelect = (date: Date) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    if (!slot.isAvailable) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedSlot(slot);
  };

  const handleBookAppointment = () => {
    if (!selectedSlot || !doctor) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setShowBookingModal(true);
  };

  const confirmBooking = async () => {
    if (!selectedSlot || !doctor || !bookingData.reason.trim() || !user?.uid) {
      Alert.alert('Hata', 'Lütfen tüm gerekli alanları doldurun.');
      return;
    }

    try {
      const [hours, minutes] = selectedSlot.time.split(':').map(Number);
      const appointmentDate = new Date(selectedDate);
      appointmentDate.setHours(hours, minutes, 0, 0);

      const appointmentRequest: AppointmentRequest = {
        doctorId: doctor.id,
        patientId: user.uid,
        date: appointmentDate,
        reason: bookingData.reason,
        type: bookingData.type,
        patientName: user.displayName || user.email || 'Hasta',
        ...(bookingData.notes && bookingData.notes.trim() && { notes: bookingData.notes }),
        ...(bookingData.symptoms.length > 0 && { symptoms: bookingData.symptoms }),
        ...(user.email && { patientEmail: user.email }),
        ...(user.phoneNumber && { patientPhone: user.phoneNumber })
      };

      await appointmentService.createAppointment(appointmentRequest);
      
      setShowBookingModal(false);
      Alert.alert(
        'Başarılı!', 
        'Randevunuz başarıyla oluşturuldu. Doktor onayından sonra size bilgi verilecektir.',
        [
          {
            text: 'Tamam',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      console.error('Error booking appointment:', error);
      Alert.alert('Hata', 'Randevu oluşturulurken bir hata oluştu.');
    }
  };

  const getNextWeekDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR', { 
      day: 'numeric',
      month: 'short'
    });
  };

  const getDayName = (date: Date) => {
    return date.toLocaleDateString('tr-TR', { weekday: 'short' });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSameDate = (date1: Date, date2: Date) => {
    return date1.toDateString() === date2.toDateString();
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Icons.ArrowLeft size={verticalScale(24)} color={colors.white} />
            </TouchableOpacity>
            <Typo size={18} fontWeight="700">Doktor Detayı</Typo>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.loadingContainer}>
            <Typo size={16} color={colors.textLighter}>Yükleniyor...</Typo>
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  if (!doctor) {
    return (
      <ScreenWrapper>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Icons.ArrowLeft size={verticalScale(24)} color={colors.white} />
            </TouchableOpacity>
            <Typo size={18} fontWeight="700">Doktor Detayı</Typo>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.errorContainer}>
            <Icons.Warning size={verticalScale(60)} color={colors.textLighter} />
            <Typo size={16} color={colors.textLighter}>Doktor bulunamadı</Typo>
            <Button onPress={() => router.back()} style={styles.errorButton}>
              <Typo fontWeight="600" color={colors.black}>Geri Dön</Typo>
            </Button>
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Icons.ArrowLeft size={verticalScale(24)} color={colors.white} />
          </TouchableOpacity>
          <Typo size={18} fontWeight="700">Randevu Al</Typo>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Doctor Info Card */}
          <View style={styles.doctorCard}>
            <View style={styles.doctorAvatar}>
              <Icons.UserCircle size={verticalScale(60)} color={colors.primary} weight="fill" />
            </View>
            <View style={styles.doctorInfo}>
              <Typo size={18} fontWeight="800">
                {doctor.title || 'Dr.'} {doctor.name || `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() || 'Doktor'}
              </Typo>
              <Typo size={14} color={colors.textLighter}>
                {doctor.specialty || doctor.specialization || 'Uzmanlık Belirtilmemiş'}
              </Typo>
              <Typo size={12} color={colors.textLighter}>
                {doctor.hospital || 'Hastane Belirtilmemiş'}
              </Typo>
              
              <View style={styles.doctorMeta}>
                <View style={styles.metaItem}>
                  <Icons.Star size={verticalScale(14)} color={colors.yellow} weight="fill" />
                  <Typo size={12} fontWeight="600">{doctor.rating || 4.5}</Typo>
                </View>
                <View style={styles.metaItem}>
                  <Icons.Clock size={verticalScale(14)} color={colors.primary} />
                  <Typo size={12}>{doctor.experience || 0} yıl</Typo>
                </View>
              </View>
            </View>
          </View>

          {/* Date Selection */}
          <View style={styles.section}>
            <Typo size={16} fontWeight="700" style={styles.sectionTitle}>
              Tarih Seçin
            </Typo>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.dateScroll}
              contentContainerStyle={styles.dateScrollContent}
            >
              {getNextWeekDates().map((date, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dateCard,
                    isSameDate(date, selectedDate) && styles.dateCardActive
                  ]}
                  onPress={() => handleDateSelect(date)}
                >
                  <Typo 
                    size={10} 
                    color={isSameDate(date, selectedDate) ? colors.white : colors.textLighter}
                    fontWeight="600"
                  >
                    {getDayName(date).toUpperCase()}
                  </Typo>
                  <Typo 
                    size={18} 
                    fontWeight="800"
                    color={isSameDate(date, selectedDate) ? colors.white : colors.white}
                  >
                    {date.getDate()}
                  </Typo>
                  <Typo 
                    size={10} 
                    color={isSameDate(date, selectedDate) ? colors.white : colors.textLighter}
                  >
                    {formatDate(date).split(' ')[1].toUpperCase()}
                  </Typo>
                  {isToday(date) && (
                    <View style={styles.todayDot} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Time Slots */}
          <View style={styles.section}>
            <Typo size={16} fontWeight="700" style={styles.sectionTitle}>
              Müsait Saatler
            </Typo>
            {availableSlots.length > 0 ? (
              <View style={styles.slotsGrid}>
                {availableSlots.map((slot, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.slotCard,
                      !slot.isAvailable && styles.slotCardDisabled,
                      selectedSlot?.time === slot.time && styles.slotCardSelected
                    ]}
                    onPress={() => handleSlotSelect(slot)}
                    disabled={!slot.isAvailable}
                  >
                    <Typo 
                      size={14} 
                      fontWeight="600"
                      color={
                        !slot.isAvailable ? colors.textLighter :
                        selectedSlot?.time === slot.time ? colors.white :
                        colors.white
                      }
                    >
                      {slot.time}
                    </Typo>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.noSlotsContainer}>
                <Icons.CalendarX size={verticalScale(40)} color={colors.textLighter} />
                <Typo size={14} color={colors.textLighter} style={styles.noSlotsText}>
                  Bu tarihte müsait saat bulunmuyor
                </Typo>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Fixed Bottom Button */}
        {selectedSlot && (
          <View style={styles.bottomSection}>
            <View style={styles.selectedInfo}>
              <Typo size={14} color={colors.textLighter}>Seçilen Randevu</Typo>
              <Typo size={16} fontWeight="700">
                {formatDate(selectedDate)} - {selectedSlot.time}
              </Typo>
            </View>
            <Button 
              onPress={handleBookAppointment}
              style={styles.bookButton}
            >
              <Typo fontWeight="700" color={colors.black} size={16}>
                Randevu Al
              </Typo>
            </Button>
          </View>
        )}
      </View>

      {/* Booking Modal */}
      <Modal
        visible={showBookingModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <ScreenWrapper>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowBookingModal(false)}
              >
                <Icons.X size={verticalScale(24)} color={colors.white} />
              </TouchableOpacity>
              <Typo size={18} fontWeight="700">Randevu Detayları</Typo>
              <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Appointment Summary */}
              <View style={styles.summaryCard}>
                <Typo size={16} fontWeight="700" style={styles.summaryTitle}>Randevu Özeti</Typo>
                <View style={styles.summaryRow}>
                  <Typo size={14} color={colors.textLighter}>Doktor:</Typo>
                  <Typo size={14} fontWeight="600">
                    {doctor?.title || 'Dr.'} {doctor?.name || `${doctor?.firstName || ''} ${doctor?.lastName || ''}`.trim() || 'Doktor'}
                  </Typo>
                </View>
                <View style={styles.summaryRow}>
                  <Typo size={14} color={colors.textLighter}>Tarih:</Typo>
                  <Typo size={14} fontWeight="600">{formatDate(selectedDate)}</Typo>
                </View>
                <View style={styles.summaryRow}>
                  <Typo size={14} color={colors.textLighter}>Saat:</Typo>
                  <Typo size={14} fontWeight="600">{selectedSlot?.time}</Typo>
                </View>
              </View>

              {/* Reason Input */}
              <View style={styles.inputSection}>
                <Typo size={14} fontWeight="600" style={styles.inputLabel}>
                  Randevu Sebebi *
                </Typo>
                <TextInput
                  style={styles.textInput}
                  placeholder="Randevu sebebinizi yazın..."
                  placeholderTextColor={colors.textLighter}
                  value={bookingData.reason}
                  onChangeText={(text) => setBookingData(prev => ({ ...prev, reason: text }))}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Appointment Type */}
              <View style={styles.inputSection}>
                <Typo size={14} fontWeight="600" style={styles.inputLabel}>
                  Randevu Tipi
                </Typo>
                <View style={styles.typeButtons}>
                  {[
                    { key: 'consultation', label: 'Konsültasyon' },
                    { key: 'follow-up', label: 'Kontrol' },
                    { key: 'routine-check', label: 'Rutin Muayene' }
                  ].map((type) => (
                    <TouchableOpacity
                      key={type.key}
                      style={[
                        styles.typeButton,
                        bookingData.type === type.key && styles.typeButtonActive
                      ]}
                      onPress={() => setBookingData(prev => ({ ...prev, type: type.key as any }))}
                    >
                      <Typo 
                        size={12} 
                        fontWeight="600"
                        color={bookingData.type === type.key ? colors.white : colors.textLighter}
                      >
                        {type.label}
                      </Typo>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Notes Input */}
              <View style={styles.inputSection}>
                <Typo size={14} fontWeight="600" style={styles.inputLabel}>
                  Ek Notlar (Opsiyonel)
                </Typo>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ek bilgiler varsa yazabilirsiniz..."
                  placeholderTextColor={colors.textLighter}
                  value={bookingData.notes}
                  onChangeText={(text) => setBookingData(prev => ({ ...prev, notes: text }))}
                  multiline
                  numberOfLines={2}
                />
              </View>
            </ScrollView>

            {/* Modal Bottom Buttons */}
            <View style={styles.modalBottom}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowBookingModal(false)}
              >
                <Typo size={14} fontWeight="600" color={colors.textLighter}>İptal</Typo>
              </TouchableOpacity>
              <Button 
                onPress={confirmBooking}
                style={styles.confirmButton}
              >
                <Typo fontWeight="700" color={colors.black} size={14}>
                  Randevuyu Onayla
                </Typo>
              </Button>
            </View>
          </View>
        </ScreenWrapper>
      </Modal>
    </ScreenWrapper>
  );
};

export default DoctorDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._20,
  },
  backButton: {
    width: verticalScale(40),
    height: verticalScale(40),
    borderRadius: verticalScale(20),
    backgroundColor: colors.neutral800,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: verticalScale(40),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacingY._20,
    paddingHorizontal: spacingX._20,
  },
  errorButton: {
    backgroundColor: colors.green,
  },
  content: {
    flex: 1,
  },
  doctorCard: {
    flexDirection: 'row',
    backgroundColor: colors.neutral800,
    margin: spacingX._20,
    padding: spacingX._20,
    borderRadius: 16,
    gap: spacingX._15,
  },
  doctorAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorInfo: {
    flex: 1,
    gap: spacingY._4,
  },
  doctorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingX._15,
    marginTop: spacingY._8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingX._5,
  },
  section: {
    paddingHorizontal: spacingX._20,
    marginBottom: spacingY._25,
  },
  sectionTitle: {
    marginBottom: spacingY._15,
  },
  dateScroll: {
    marginHorizontal: -spacingX._20,
  },
  dateScrollContent: {
    paddingHorizontal: spacingX._20,
    gap: spacingX._12,
  },
  dateCard: {
    backgroundColor: colors.neutral800,
    borderRadius: 12,
    padding: spacingY._12,
    alignItems: 'center',
    gap: spacingY._4,
    minWidth: verticalScale(60),
    position: 'relative',
  },
  dateCardActive: {
    backgroundColor: colors.primary,
  },
  todayDot: {
    position: 'absolute',
    top: spacingY._4,
    right: spacingX._4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.green,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacingX._10,
  },
  slotCard: {
    backgroundColor: colors.neutral800,
    borderRadius: 8,
    paddingVertical: spacingY._12,
    paddingHorizontal: spacingX._16,
    minWidth: '30%',
    alignItems: 'center',
  },
  slotCardDisabled: {
    backgroundColor: colors.neutral900,
    opacity: 0.5,
  },
  slotCardSelected: {
    backgroundColor: colors.primary,
  },
  noSlotsContainer: {
    alignItems: 'center',
    paddingVertical: spacingY._40,
    gap: spacingY._15,
  },
  noSlotsText: {
    textAlign: 'center',
  },
  bottomSection: {
    backgroundColor: colors.neutral900,
    padding: spacingX._20,
    paddingBottom: spacingY._30,
    borderTopWidth: 1,
    borderTopColor: colors.neutral700,
  },
  selectedInfo: {
    marginBottom: spacingY._15,
    alignItems: 'center',
  },
  bookButton: {
    backgroundColor: colors.green,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._20,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral700,
  },
  modalCloseButton: {
    width: verticalScale(40),
    height: verticalScale(40),
    borderRadius: verticalScale(20),
    backgroundColor: colors.neutral800,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: spacingX._20,
    paddingTop: spacingY._20,
  },
  summaryCard: {
    backgroundColor: colors.neutral800,
    borderRadius: 12,
    padding: spacingX._20,
    marginBottom: spacingY._25,
  },
  summaryTitle: {
    marginBottom: spacingY._15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacingY._8,
  },
  inputSection: {
    marginBottom: spacingY._20,
  },
  inputLabel: {
    marginBottom: spacingY._8,
  },
  textInput: {
    backgroundColor: colors.neutral800,
    borderRadius: 8,
    padding: spacingX._15,
    color: colors.white,
    fontSize: 14,
    minHeight: verticalScale(50),
    textAlignVertical: 'top',
  },
  typeButtons: {
    flexDirection: 'row',
    gap: spacingX._10,
  },
  typeButton: {
    flex: 1,
    backgroundColor: colors.neutral800,
    borderRadius: 8,
    paddingVertical: spacingY._12,
    paddingHorizontal: spacingX._12,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: colors.primary,
  },
  modalBottom: {
    flexDirection: 'row',
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._20,
    gap: spacingX._15,
    borderTopWidth: 1,
    borderTopColor: colors.neutral700,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacingY._15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButton: {
    flex: 2,
    backgroundColor: colors.green,
  },
}); 