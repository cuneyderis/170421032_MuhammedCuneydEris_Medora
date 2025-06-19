import { StyleSheet, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import Button from '@/components/Button';
import { colors, spacingX, spacingY } from '@/constants/theme';
import * as Icons from 'phosphor-react-native';
import { verticalScale } from '@/utils/styling';
import { Appointment, Doctor, APPOINTMENT_STATUS_COLORS } from '@/types/appointment';
import { appointmentService } from '@/services/appointmentService';
import { useAuth } from '@/contexts/authContext';

const AppointmentDetailScreen = () => {
  const { user } = useAuth();
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (appointmentId) {
      loadAppointmentData();
    }
  }, [appointmentId]);

  const loadAppointmentData = async () => {
    try {
      setLoading(true);
      const appointmentData = await appointmentService.getAppointmentById(appointmentId);
      setAppointment(appointmentData);

      if (appointmentData) {
        const doctorData = await appointmentService.getDoctorById(appointmentData.doctorId);
        setDoctor(doctorData);
      }
    } catch (error) {
      console.error('Error loading appointment:', error);
      Alert.alert('Hata', 'Randevu bilgileri yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = () => {
    Alert.alert(
      'Randevuyu İptal Et',
      'Bu randevuyu iptal etmek istediğinizden emin misiniz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'İptal Et',
          style: 'destructive',
          onPress: async () => {
            try {
              await appointmentService.cancelAppointment(appointmentId);
              Alert.alert('Başarılı', 'Randevunuz iptal edildi.', [
                { text: 'Tamam', onPress: () => router.back() }
              ]);
            } catch (error) {
              Alert.alert('Hata', 'Randevu iptal edilirken bir hata oluştu.');
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status: Appointment['status']) => {
    return APPOINTMENT_STATUS_COLORS[status] || colors.textLighter;
  };

  const getStatusText = (status: Appointment['status']) => {
    switch (status) {
      case 'pending': return 'Bekliyor';
      case 'confirmed': return 'Onaylandı';
      case 'cancelled': return 'İptal Edildi';
      case 'completed': return 'Tamamlandı';
      case 'no-show': return 'Gelmedi';
      default: return status;
    }
  };

  const getTypeText = (type: Appointment['type']) => {
    switch (type) {
      case 'consultation': return 'Konsültasyon';
      case 'follow-up': return 'Kontrol';
      case 'emergency': return 'Acil';
      case 'routine-check': return 'Rutin Muayene';
      default: return type;
    }
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
            <Typo size={18} fontWeight="700">Randevu Detayı</Typo>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.loadingContainer}>
            <Typo size={16} color={colors.textLighter}>Yükleniyor...</Typo>
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  if (!appointment) {
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
            <Typo size={18} fontWeight="700">Randevu Detayı</Typo>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.errorContainer}>
            <Icons.Warning size={verticalScale(60)} color={colors.textLighter} />
            <Typo size={16} color={colors.textLighter}>Randevu bulunamadı</Typo>
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
          <Typo size={18} fontWeight="700">Randevu Detayı</Typo>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Status Card */}
          <View style={styles.statusCard}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) + '20' }]}>
              <Typo size={14} color={getStatusColor(appointment.status)} fontWeight="700">
                {getStatusText(appointment.status)}
              </Typo>
            </View>
            <Typo size={20} fontWeight="800" style={styles.appointmentTitle}>
              {appointment.reason}
            </Typo>
          </View>

          {/* Doctor Info */}
          {doctor && (
            <View style={styles.doctorCard}>
              <View style={styles.doctorAvatar}>
                <Icons.UserCircle size={verticalScale(50)} color={colors.primary} weight="fill" />
              </View>
              <View style={styles.doctorInfo}>
                <Typo size={16} fontWeight="700">
                  {doctor.title || 'Dr.'} {doctor.name || `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() || 'Doktor'}
                </Typo>
                <Typo size={14} color={colors.textLighter}>
                  {doctor.specialty || doctor.specialization || 'Uzmanlık Belirtilmemiş'}
                </Typo>
                <Typo size={12} color={colors.textLighter}>
                  {doctor.hospital || 'Hastane Belirtilmemiş'}
                </Typo>
              </View>
            </View>
          )}

          {/* Appointment Details */}
          <View style={styles.detailsCard}>
            <Typo size={16} fontWeight="700" style={styles.sectionTitle}>Randevu Bilgileri</Typo>
            
            <View style={styles.detailRow}>
              <Icons.Calendar size={verticalScale(20)} color={colors.primary} />
              <View style={styles.detailContent}>
                <Typo size={14} fontWeight="600">Tarih ve Saat</Typo>
                <Typo size={14} color={colors.textLighter}>
                  {appointment.date.toLocaleDateString('tr-TR', { 
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Typo>
                <Typo size={14} color={colors.textLighter}>
                  {appointment.date.toLocaleTimeString('tr-TR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Typo>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Icons.ClipboardText size={verticalScale(20)} color={colors.secondary} />
              <View style={styles.detailContent}>
                <Typo size={14} fontWeight="600">Randevu Tipi</Typo>
                <Typo size={14} color={colors.textLighter}>
                  {getTypeText(appointment.type)}
                </Typo>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Icons.Clock size={verticalScale(20)} color={colors.green} />
              <View style={styles.detailContent}>
                <Typo size={14} fontWeight="600">Süre</Typo>
                <Typo size={14} color={colors.textLighter}>
                  {appointment.duration || 30} dakika
                </Typo>
              </View>
            </View>

            {appointment.notes && (
              <View style={styles.detailRow}>
                <Icons.Note size={verticalScale(20)} color={colors.yellow} />
                <View style={styles.detailContent}>
                  <Typo size={14} fontWeight="600">Notlar</Typo>
                  <Typo size={14} color={colors.textLighter}>
                    {appointment.notes}
                  </Typo>
                </View>
              </View>
            )}

            {appointment.doctorNotes && (
              <View style={styles.detailRow}>
                <Icons.Stethoscope size={verticalScale(20)} color={colors.primary} />
                <View style={styles.detailContent}>
                  <Typo size={14} fontWeight="600">Doktor Notları</Typo>
                  <Typo size={14} color={colors.textLighter}>
                    {appointment.doctorNotes}
                  </Typo>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Action Buttons */}
        {appointment.status === 'pending' && (
          <View style={styles.actionButtons}>
            <Button 
              onPress={handleCancelAppointment}
              style={styles.cancelButton}
            >
              <Typo fontWeight="700" color={colors.white} size={16}>
                Randevuyu İptal Et
              </Typo>
            </Button>
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
};

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
    paddingHorizontal: spacingX._20,
  },
  statusCard: {
    backgroundColor: colors.neutral800,
    borderRadius: 16,
    padding: spacingX._20,
    marginBottom: spacingY._20,
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: spacingX._12,
    paddingVertical: spacingY._6,
    borderRadius: 20,
    marginBottom: spacingY._10,
  },
  appointmentTitle: {
    textAlign: 'center',
  },
  doctorCard: {
    flexDirection: 'row',
    backgroundColor: colors.neutral800,
    borderRadius: 16,
    padding: spacingX._20,
    marginBottom: spacingY._20,
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
  detailsCard: {
    backgroundColor: colors.neutral800,
    borderRadius: 16,
    padding: spacingX._20,
    marginBottom: spacingY._20,
  },
  sectionTitle: {
    marginBottom: spacingY._15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacingX._15,
    marginBottom: spacingY._15,
  },
  detailContent: {
    flex: 1,
    gap: spacingY._2,
  },
  actionButtons: {
    padding: spacingX._20,
    paddingBottom: spacingY._30,
  },
  cancelButton: {
    backgroundColor: colors.rose,
  },
});

export default AppointmentDetailScreen; 