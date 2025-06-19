import { StyleSheet, View, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import Button from '@/components/Button';
import { colors, spacingX, spacingY } from '@/constants/theme';
import * as Icons from 'phosphor-react-native';
import { verticalScale } from '@/utils/styling';
import { Appointment, Patient, APPOINTMENT_STATUS_COLORS } from '@/types/appointment';
import { appointmentService } from '@/services/appointmentService';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/contexts/authContext';

const DoctorAppointmentScreen = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<{ [key: string]: Patient }>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'today' | 'pending' | 'confirmed'>('all');

  // Gerçek doktor ID'sini auth'dan al
  const currentDoctorId = user?.uid;

  useEffect(() => {
    loadAppointments();
  }, [selectedFilter]);

  const loadAppointments = async () => {
    if (!currentDoctorId) {
      console.log('No doctor ID available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      let filter: any = { doctorId: currentDoctorId };
      
      if (selectedFilter === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        filter.dateFrom = today;
        filter.dateTo = tomorrow;
      } else if (selectedFilter === 'pending') {
        filter.status = 'pending';
      } else if (selectedFilter === 'confirmed') {
        filter.status = 'confirmed';
      }

      const appointmentsData = await appointmentService.getAppointments(filter);
      setAppointments(appointmentsData);

      // Hasta bilgilerini yükle - önce Patient tablosundan, yoksa randevu bilgilerinden
      const patientIds = [...new Set(appointmentsData.map(apt => apt.patientId))];
      const patientsData: { [key: string]: Patient } = {};
      
      for (const patientId of patientIds) {
        const patient = await appointmentService.getPatientById(patientId);
        if (patient) {
          patientsData[patientId] = patient;
        } else {
          // Patient tablosunda yoksa, randevu bilgilerinden oluştur
          const appointment = appointmentsData.find(apt => apt.patientId === patientId);
          if (appointment && appointment.patientName) {
            patientsData[patientId] = {
              id: patientId,
              name: appointment.patientName,
              email: appointment.patientEmail || '',
              phone: appointment.patientPhone || '',
              dateOfBirth: new Date(), // Varsayılan değer
              gender: 'other' as const,
              createdAt: new Date(),
              updatedAt: new Date()
            };
          }
        }
      }
      
      setPatients(patientsData);

    } catch (error) {
      console.error('Error loading appointments:', error);
      Alert.alert('Hata', 'Randevular yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAppointments();
  }, [selectedFilter]);

  const handleFilterChange = (filter: typeof selectedFilter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedFilter(filter);
  };

  const handleAppointmentAction = async (appointmentId: string, action: 'confirm' | 'cancel' | 'complete') => {
    try {
      let status: Appointment['status'];
      let message: string;
      
      switch (action) {
        case 'confirm':
          status = 'confirmed';
          message = 'Randevu onaylandı';
          break;
        case 'cancel':
          status = 'cancelled';
          message = 'Randevu iptal edildi';
          break;
        case 'complete':
          status = 'completed';
          message = 'Randevu tamamlandı';
          break;
      }

      await appointmentService.updateAppointmentStatus(appointmentId, status);
      Alert.alert('Başarılı', message);
      loadAppointments();
      
    } catch (error) {
      console.error('Error updating appointment:', error);
      Alert.alert('Hata', 'Randevu güncellenirken bir hata oluştu.');
    }
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

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const AppointmentCard = ({ appointment }: { appointment: Appointment }) => {
    const patient = patients[appointment.patientId];
    
    return (
      <TouchableOpacity 
        style={styles.appointmentCard}
        onPress={() => router.push(`/appointment-detail?appointmentId=${appointment.id}`)}
      >
        <View style={styles.appointmentHeader}>
          <View style={styles.patientInfo}>
            <View style={styles.patientAvatar}>
              <Icons.User size={verticalScale(24)} color={colors.primary} weight="fill" />
            </View>
            <View style={styles.patientDetails}>
              <Typo size={16} fontWeight="700">
                {patient?.name || appointment.patientName || 'Hasta Bilgisi Yükleniyor...'}
              </Typo>
              <Typo size={12} color={colors.textLighter}>
                {patient?.phone || appointment.patientPhone || ''}
              </Typo>
              {patient?.email || appointment.patientEmail ? (
                <Typo size={10} color={colors.textLighter}>
                  {patient?.email || appointment.patientEmail}
                </Typo>
              ) : null}
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) + '20' }]}>
            <Typo size={12} color={getStatusColor(appointment.status)} fontWeight="600">
              {getStatusText(appointment.status)}
            </Typo>
          </View>
        </View>

        <View style={styles.appointmentDetails}>
          <View style={styles.detailRow}>
            <Icons.Calendar size={verticalScale(16)} color={colors.primary} />
            <Typo size={14}>
              {appointment.date.toLocaleDateString('tr-TR')} - {appointment.date.toLocaleTimeString('tr-TR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Typo>
            {isToday(appointment.date) && (
              <View style={styles.todayBadge}>
                <Typo size={10} color={colors.yellow} fontWeight="600">BUGÜN</Typo>
              </View>
            )}
          </View>
          
          <View style={styles.detailRow}>
            <Icons.ClipboardText size={verticalScale(16)} color={colors.secondary} />
            <Typo size={14} color={colors.textLighter}>
              {getTypeText(appointment.type)} - {appointment.duration} dk
            </Typo>
          </View>

          <View style={styles.detailRow}>
            <Icons.ChatCircle size={verticalScale(16)} color={colors.green} />
            <Typo size={14} color={colors.textLighter}>
              {appointment.reason}
            </Typo>
          </View>

          {appointment.notes && (
            <View style={styles.detailRow}>
              <Icons.Note size={verticalScale(16)} color={colors.yellow} />
              <Typo size={12} color={colors.textLighter} style={styles.notesText}>
                {appointment.notes}
              </Typo>
            </View>
          )}
        </View>

        {appointment.status === 'pending' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.confirmButton]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                handleAppointmentAction(appointment.id, 'confirm');
              }}
            >
              <Icons.Check size={verticalScale(16)} color={colors.white} weight="bold" />
              <Typo size={12} color={colors.white} fontWeight="600">Onayla</Typo>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                Alert.alert(
                  'Randevuyu İptal Et',
                  'Bu randevuyu iptal etmek istediğinizden emin misiniz?',
                  [
                    { text: 'Vazgeç', style: 'cancel' },
                    { 
                      text: 'İptal Et', 
                      style: 'destructive',
                      onPress: () => handleAppointmentAction(appointment.id, 'cancel')
                    }
                  ]
                );
              }}
            >
              <Icons.X size={verticalScale(16)} color={colors.white} weight="bold" />
              <Typo size={12} color={colors.white} fontWeight="600">İptal Et</Typo>
            </TouchableOpacity>
          </View>
        )}

        {appointment.status === 'confirmed' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.completeButton]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                handleAppointmentAction(appointment.id, 'complete');
              }}
            >
              <Icons.CheckCircle size={verticalScale(16)} color={colors.white} weight="bold" />
              <Typo size={12} color={colors.white} fontWeight="600">Tamamla</Typo>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const FilterTabs = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.filterTabs}
      contentContainerStyle={styles.filterTabsContent}
    >
      {[
        { key: 'all', label: 'Tümü', icon: Icons.List },
        { key: 'today', label: 'Bugün', icon: Icons.CalendarCheck },
        { key: 'pending', label: 'Bekleyen', icon: Icons.Clock },
        { key: 'confirmed', label: 'Onaylı', icon: Icons.CheckCircle }
      ].map((filter) => (
        <TouchableOpacity
          key={filter.key}
          style={[
            styles.filterTab,
            selectedFilter === filter.key && styles.filterTabActive
          ]}
          onPress={() => handleFilterChange(filter.key as any)}
        >
          <filter.icon 
            size={verticalScale(16)} 
            color={selectedFilter === filter.key ? colors.white : colors.textLighter}
            weight={selectedFilter === filter.key ? 'fill' : 'regular'}
          />
          <Typo 
            size={14} 
            color={selectedFilter === filter.key ? colors.white : colors.textLighter}
            fontWeight={selectedFilter === filter.key ? '600' : '400'}
          >
            {filter.label}
          </Typo>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingContainer}>
          <Typo size={16} color={colors.textLighter}>Randevular yükleniyor...</Typo>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.header}>
          <Typo size={24} fontWeight="800">Randevularım</Typo>
          <View style={styles.headerStats}>
            <View style={styles.statItem}>
              <Typo size={12} color={colors.textLighter}>Bugün</Typo>
              <Typo size={16} fontWeight="700" color={colors.primary}>
                {appointments.filter(apt => isToday(apt.date)).length}
              </Typo>
            </View>
            <View style={styles.statItem}>
              <Typo size={12} color={colors.textLighter}>Bekleyen</Typo>
              <Typo size={16} fontWeight="700" color={colors.yellow}>
                {appointments.filter(apt => apt.status === 'pending').length}
              </Typo>
            </View>
          </View>
        </View>

        <FilterTabs />

        <ScrollView 
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {appointments.length > 0 ? (
            <View style={styles.appointmentsContainer}>
              {appointments.map((appointment) => (
                <AppointmentCard key={appointment.id} appointment={appointment} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Icons.Calendar size={verticalScale(60)} color={colors.textLighter} />
              <Typo size={16} color={colors.textLighter} style={styles.emptyText}>
                {selectedFilter === 'all' ? 'Henüz randevunuz bulunmuyor' :
                 selectedFilter === 'today' ? 'Bugün randevunuz bulunmuyor' :
                 selectedFilter === 'pending' ? 'Bekleyen randevunuz bulunmuyor' :
                 'Onaylı randevunuz bulunmuyor'}
              </Typo>
            </View>
          )}
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
};

export default DoctorAppointmentScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacingX._20,
    paddingTop: spacingY._20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacingY._20,
  },
  headerStats: {
    flexDirection: 'row',
    gap: spacingX._15,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: colors.neutral800,
    paddingHorizontal: spacingX._12,
    paddingVertical: spacingY._8,
    borderRadius: 8,
  },
  filterTabs: {
    marginBottom: spacingY._20,
  },
  filterTabsContent: {
    paddingHorizontal: spacingX._5,
    gap: spacingX._10,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingX._6,
    paddingHorizontal: spacingX._15,
    paddingVertical: spacingY._8,
    borderRadius: 20,
    backgroundColor: colors.neutral800,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  content: {
    flex: 1,
  },
  appointmentsContainer: {
    gap: spacingY._15,
    paddingBottom: spacingY._20,
  },
  appointmentCard: {
    backgroundColor: colors.neutral800,
    borderRadius: 12,
    padding: spacingY._15,
    gap: spacingY._12,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingX._12,
    flex: 1,
  },
  patientAvatar: {
    width: verticalScale(40),
    height: verticalScale(40),
    borderRadius: verticalScale(20),
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  patientDetails: {
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: spacingX._10,
    paddingVertical: spacingY._5,
    borderRadius: 12,
  },
  appointmentDetails: {
    gap: spacingY._8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingX._8,
  },
  todayBadge: {
    backgroundColor: colors.yellow + '20',
    paddingHorizontal: spacingX._6,
    paddingVertical: spacingY._2,
    borderRadius: 4,
    marginLeft: spacingX._8,
  },
  notesText: {
    fontStyle: 'italic',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacingX._10,
    marginTop: spacingY._5,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacingX._6,
    paddingVertical: spacingY._10,
    borderRadius: 8,
  },
  confirmButton: {
    backgroundColor: colors.green,
  },
  cancelButton: {
    backgroundColor: colors.rose,
  },
  completeButton: {
    backgroundColor: colors.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacingY._40,
    gap: spacingY._15,
  },
  emptyText: {
    textAlign: 'center',
  },
});