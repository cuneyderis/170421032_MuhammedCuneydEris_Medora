import { StyleSheet, View, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import Button from '@/components/Button';
import { colors, spacingX, spacingY } from '@/constants/theme';
import * as Icons from 'phosphor-react-native';
import { verticalScale } from '@/utils/styling';
import { Doctor, Appointment } from '@/types/appointment';
import { appointmentService } from '@/services/appointmentService';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/contexts/authContext';

const AppointmentsScreen = () => {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<'doctors' | 'appointments'>('doctors');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState('Tümü');

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      
      // Doktorları yükle
      const doctorsData = await appointmentService.getDoctors();
      console.log('Loaded doctors from Firebase:', doctorsData);
      console.log('Number of doctors:', doctorsData.length);
      
      // Her doktorun detaylarını logla
      doctorsData.forEach((doctor, index) => {
        console.log(`Doctor ${index + 1}:`, {
          id: doctor.id,
          name: doctor.name,
          specialty: doctor.specialty,
          title: doctor.title,
          hospital: doctor.hospital
        });
      });
      
      setDoctors(doctorsData);

      // Randevularımı yükle (user.uid'yi patient ID olarak kullan)
      const appointmentsData = await appointmentService.getAppointments({
        patientId: user.uid
      });
      setMyAppointments(appointmentsData);

    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Hata', 'Veriler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [user]);

  const handleTabChange = (tab: 'doctors' | 'appointments') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTab(tab);
  };

  const handleDoctorPress = (doctor: Doctor) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/doctor-detail',
      params: { doctorId: doctor.id }
    });
  };

  const handleAppointmentPress = (appointment: Appointment) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/appointment-detail',
      params: { appointmentId: appointment.id }
    });
  };

  const getStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case 'confirmed': return colors.green;
      case 'pending': return colors.yellow;
      case 'cancelled': return colors.rose;
      case 'completed': return colors.primary;
      default: return colors.textLighter;
    }
  };

  const getStatusText = (status: Appointment['status']) => {
    switch (status) {
      case 'confirmed': return 'Onaylandı';
      case 'pending': return 'Bekliyor';
      case 'cancelled': return 'İptal Edildi';
      case 'completed': return 'Tamamlandı';
      case 'no-show': return 'Gelmedi';
      default: return status;
    }
  };

  // Doktorları uzmanlık alanına göre filtrele
  const getFilteredDoctors = () => {
    if (selectedSpecialty === 'Tümü') {
      return doctors;
    }
    return doctors.filter(doctor => 
      (doctor.specialty === selectedSpecialty) || 
      (doctor.specialization === selectedSpecialty)
    );
  };

  // Benzersiz uzmanlık alanlarını al
  const getSpecialties = () => {
    const specialties = new Set<string>();
    doctors.forEach(doctor => {
      const specialty = doctor.specialty || doctor.specialization;
      if (specialty) {
        specialties.add(specialty);
      }
    });
    return ['Tümü', ...Array.from(specialties)];
  };

  const DoctorCard = ({ doctor }: { doctor: Doctor }) => (
    <TouchableOpacity 
      style={styles.doctorCard}
      onPress={() => handleDoctorPress(doctor)}
    >
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
        <View style={styles.doctorMeta}>
          <View style={styles.ratingContainer}>
            <Icons.Star size={verticalScale(14)} color={colors.yellow} weight="fill" />
            <Typo size={12} color={colors.textLighter}>{doctor.rating || 4.5}</Typo>
          </View>
          <Typo size={12} color={colors.textLighter}>{doctor.experience || 0} yıl deneyim</Typo>
        </View>
      </View>
      <View style={styles.doctorActions}>
        <TouchableOpacity 
          style={styles.quickBookButton}
          onPress={(e) => {
            e.stopPropagation();
            handleDoctorPress(doctor);
          }}
        >
          <Icons.Calendar size={verticalScale(16)} color={colors.white} weight="bold" />
          <Typo size={12} color={colors.white} fontWeight="600">Randevu Al</Typo>
        </TouchableOpacity>
        <Icons.CaretRight size={verticalScale(20)} color={colors.textLighter} />
      </View>
    </TouchableOpacity>
  );

  const AppointmentCard = ({ appointment }: { appointment: Appointment }) => (
    <TouchableOpacity 
      style={styles.appointmentCard}
      onPress={() => handleAppointmentPress(appointment)}
    >
      <View style={styles.appointmentHeader}>
        <View style={styles.appointmentDate}>
          <Icons.Calendar size={verticalScale(18)} color={colors.primary} />
          <Typo size={14} fontWeight="600">
            {appointment.date.toLocaleDateString('tr-TR')}
          </Typo>
          <Typo size={14} color={colors.textLighter}>
            {appointment.date.toLocaleTimeString('tr-TR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Typo>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) + '20' }]}>
          <Typo size={12} color={getStatusColor(appointment.status)} fontWeight="600">
            {getStatusText(appointment.status)}
          </Typo>
        </View>
      </View>
      <Typo size={16} fontWeight="600" style={styles.appointmentReason}>
        {appointment.reason}
      </Typo>
      <Typo size={14} color={colors.textLighter}>
        Randevu Tipi: {appointment.type === 'consultation' ? 'Konsültasyon' : 
                      appointment.type === 'follow-up' ? 'Kontrol' :
                      appointment.type === 'emergency' ? 'Acil' : 'Rutin Muayene'}
      </Typo>
      {appointment.notes && (
        <Typo size={12} color={colors.textLighter} style={styles.appointmentNotes}>
          Not: {appointment.notes}
        </Typo>
      )}
    </TouchableOpacity>
  );

  const SpecialtyFilter = () => {
    const specialties = getSpecialties();

    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.specialtyFilter}
        contentContainerStyle={styles.specialtyFilterContent}
      >
        {specialties.map((specialty) => (
          <TouchableOpacity
            key={specialty}
            style={[
              styles.specialtyChip,
              selectedSpecialty === specialty && styles.specialtyChipActive
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedSpecialty(specialty);
            }}
          >
            <Typo 
              size={14} 
              color={selectedSpecialty === specialty ? colors.white : colors.textLighter}
              fontWeight={selectedSpecialty === specialty ? '600' : '400'}
            >
              {specialty}
            </Typo>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingContainer}>
          <Typo size={16} color={colors.textLighter}>Yükleniyor...</Typo>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.header}>
          <Typo size={24} fontWeight="800">Randevularım</Typo>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'doctors' && styles.tabActive]}
            onPress={() => handleTabChange('doctors')}
          >
            <Icons.UserCircle 
              size={verticalScale(20)} 
              color={selectedTab === 'doctors' ? colors.primary : colors.textLighter} 
            />
            <Typo 
              size={14} 
              color={selectedTab === 'doctors' ? colors.primary : colors.textLighter}
              fontWeight={selectedTab === 'doctors' ? '600' : '400'}
            >
              Doktorlar
            </Typo>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'appointments' && styles.tabActive]}
            onPress={() => handleTabChange('appointments')}
          >
            <Icons.Calendar 
              size={verticalScale(20)} 
              color={selectedTab === 'appointments' ? colors.primary : colors.textLighter} 
            />
            <Typo 
              size={14} 
              color={selectedTab === 'appointments' ? colors.primary : colors.textLighter}
              fontWeight={selectedTab === 'appointments' ? '600' : '400'}
            >
              Randevularım
            </Typo>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {selectedTab === 'doctors' ? (
            <>
              <SpecialtyFilter />
              <View style={styles.doctorsContainer}>
                {getFilteredDoctors().length > 0 ? (
                  getFilteredDoctors().map((doctor) => (
                    <DoctorCard key={doctor.id} doctor={doctor} />
                  ))
                ) : (
                  <View style={styles.emptyContainer}>
                    <Icons.UserCircle size={verticalScale(60)} color={colors.textLighter} />
                    <Typo size={16} color={colors.textLighter} style={styles.emptyText}>
                      Henüz doktor bulunamadı
                    </Typo>
                    <Typo size={14} color={colors.textLighter} style={styles.emptySubtext}>
                      Doktorlar Firebase'den yükleniyor...
                    </Typo>
                  </View>
                )}
              </View>
            </>
          ) : (
            <View style={styles.appointmentsContainer}>
              {myAppointments.length > 0 ? (
                myAppointments.map((appointment) => (
                  <AppointmentCard key={appointment.id} appointment={appointment} />
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Icons.Calendar size={verticalScale(60)} color={colors.textLighter} />
                  <Typo size={16} color={colors.textLighter} style={styles.emptyText}>
                    Henüz randevunuz bulunmuyor
                  </Typo>
                  <Typo size={14} color={colors.textLighter} style={styles.emptySubtext}>
                    Doktorlar sekmesinden randevu alabilirsiniz
                  </Typo>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
};

export default AppointmentsScreen;

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
    marginBottom: spacingY._20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.neutral800,
    borderRadius: 12,
    padding: spacingY._5,
    marginBottom: spacingY._20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacingY._10,
    paddingHorizontal: spacingX._15,
    borderRadius: 8,
    gap: spacingX._8,
  },
  tabActive: {
    backgroundColor: colors.white + '10',
  },
  content: {
    flex: 1,
  },
  specialtyFilter: {
    marginBottom: spacingY._20,
  },
  specialtyFilterContent: {
    paddingHorizontal: spacingX._5,
    gap: spacingX._10,
  },
  specialtyChip: {
    paddingHorizontal: spacingX._15,
    paddingVertical: spacingY._8,
    borderRadius: 20,
    backgroundColor: colors.neutral800,
  },
  specialtyChipActive: {
    backgroundColor: colors.primary,
  },
  doctorsContainer: {
    gap: spacingY._15,
  },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral800,
    borderRadius: 12,
    padding: spacingY._15,
    gap: spacingX._15,
  },
  doctorAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorInfo: {
    flex: 1,
    gap: spacingY._2,
  },
  doctorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingX._15,
    marginTop: spacingY._5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingX._5,
  },
  doctorActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingX._10,
  },
  quickBookButton: {
    padding: spacingX._10,
    backgroundColor: colors.primary,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingX._5,
  },
  appointmentsContainer: {
    gap: spacingY._15,
  },
  appointmentCard: {
    backgroundColor: colors.neutral800,
    borderRadius: 12,
    padding: spacingY._15,
    gap: spacingY._10,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appointmentDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingX._8,
  },
  statusBadge: {
    paddingHorizontal: spacingX._10,
    paddingVertical: spacingY._5,
    borderRadius: 12,
  },
  appointmentReason: {
    marginTop: spacingY._5,
  },
  appointmentNotes: {
    marginTop: spacingY._5,
    fontStyle: 'italic',
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
  emptySubtext: {
    marginTop: spacingY._5,
    textAlign: 'center',
  },
}); 