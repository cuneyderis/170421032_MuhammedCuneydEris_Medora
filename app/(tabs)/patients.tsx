import { StyleSheet, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import { colors, spacingX, spacingY, radius } from '@/constants/theme';
import * as Icons from 'phosphor-react-native';
import { verticalScale } from '@/utils/styling';
import { useAuth } from '@/contexts/authContext';
import { patientHealthService, PatientRecord } from '@/services/patientHealthService';
import { appointmentService } from '@/services/appointmentService';
import { router } from 'expo-router';

const PatientsScreen = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  // Fetch patients data
  useEffect(() => {
    const fetchPatients = async () => {
      if (!user?.uid) return;
      
      setLoading(true);
      try {
        // Önce hasta kayıtlarını al
        const patientsData = await patientHealthService.getDoctorPatients(user.uid);
        
        // Randevulardan hasta listesi oluştur
        const appointments = await appointmentService.getAppointments({ doctorId: user.uid });
        const appointmentPatients = new Map<string, PatientRecord>();
        
        appointments.forEach(appointment => {
          if (appointment.patientId && appointment.patientName && !appointmentPatients.has(appointment.patientId)) {
            // Mevcut hasta kaydında yoksa randevudan oluştur
            const existingPatient = patientsData.find(p => p.patientId === appointment.patientId);
            if (!existingPatient) {
              appointmentPatients.set(appointment.patientId, {
                id: `appointment_${appointment.patientId}`,
                patientId: appointment.patientId,
                doctorId: user.uid!,
                patientInfo: {
                  name: appointment.patientName,
                  email: appointment.patientEmail || '',
                  phone: appointment.patientPhone || '',
                },
                riskLevel: 'low', // Varsayılan risk seviyesi
                createdAt: appointment.createdAt || new Date(),
                updatedAt: appointment.updatedAt || new Date(),
                lastAnalysisDate: undefined // Henüz analiz yapılmamış
              });
            }
          }
        });
        
        // Mevcut hasta kayıtları + randevudan oluşturulan hastalar
        const allPatients = [...patientsData, ...Array.from(appointmentPatients.values())];
        
        // Duplicate'ları kaldır (patientId'ye göre)
        const uniquePatients = allPatients.filter((patient, index, self) => 
          index === self.findIndex(p => p.patientId === patient.patientId)
        );
        
        console.log(`📊 Toplam hasta sayısı: ${uniquePatients.length} (Kayıtlı: ${patientsData.length}, Randevulu: ${appointmentPatients.size})`);
        setPatients(uniquePatients);
      } catch (error) {
        console.error('Error fetching patients:', error);
        Alert.alert('Hata', 'Hasta bilgileri yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPatients();
  }, [user]);

  // Filter patients based on selected filter
  const filteredPatients = patients.filter(patient => {
    if (filter === 'all') return true;
    return patient.riskLevel === filter;
  });

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return colors.error;
      case 'medium': return colors.warning;
      case 'low': return colors.success;
      default: return colors.neutral500;
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return <Icons.Warning size={16} color={colors.error} weight="fill" />;
      case 'medium': return <Icons.Info size={16} color={colors.warning} weight="fill" />;
      case 'low': return <Icons.CheckCircle size={16} color={colors.success} weight="fill" />;
      default: return <Icons.Question size={16} color={colors.neutral500} weight="fill" />;
    }
  };

  const getRiskText = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'Yüksek Risk';
      case 'medium': return 'Orta Risk';
      case 'low': return 'Düşük Risk';
      default: return 'Belirsiz';
    }
  };

  const renderFilterButton = (filterType: typeof filter, title: string, count: number) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === filterType && styles.filterButtonActive
      ]}
      onPress={() => setFilter(filterType)}
    >
      <Typo 
        size={13} 
        fontWeight={filter === filterType ? '600' : '400'}
        color={filter === filterType ? colors.primary : colors.neutral400}
      >
        {title} ({count})
      </Typo>
    </TouchableOpacity>
  );

  const renderPatientItem = (patient: PatientRecord) => (
    <TouchableOpacity 
      key={patient.id}
      style={[
        styles.patientCard,
        patient.riskLevel === 'high' && styles.highRiskCard
      ]}
      onPress={() => {
        console.log('Patient clicked:', patient);
        
        // Hasta detay sayfasına yönlendir
        if (user?.uid) {
          router.push(`/patient-detail?patientId=${patient.patientId}&doctorId=${user.uid}`);
        } else {
          Alert.alert('Hata', 'Kullanıcı bilgisi bulunamadı.');
        }
      }}
    >
      <View style={styles.patientHeader}>
        <View style={styles.patientIcon}>
          <Icons.User size={24} color={colors.primary} weight="duotone" />
        </View>
        <View style={styles.patientInfo}>
          <Typo fontWeight="600">{patient.patientInfo.name}</Typo>
          {patient.patientInfo.email && (
            <Typo size={14} color={colors.neutral400}>{patient.patientInfo.email}</Typo>
          )}
        </View>
        <View style={styles.riskBadge}>
          {getRiskIcon(patient.riskLevel)}
        </View>
      </View>
      
      <View style={styles.patientDetails}>
        <View style={styles.detailRow}>
          <Typo size={12} color={colors.neutral500}>Risk Seviyesi:</Typo>
          <Typo 
            size={12} 
            color={getRiskColor(patient.riskLevel)}
            fontWeight="600"
          >
            {getRiskText(patient.riskLevel)}
          </Typo>
        </View>
        
        {patient.lastAnalysisDate && (
          <View style={styles.detailRow}>
            <Typo size={12} color={colors.neutral500}>Son Analiz:</Typo>
            <Typo size={12} color={colors.neutral400}>
              {new Date(patient.lastAnalysisDate).toLocaleDateString('tr-TR')}
            </Typo>
          </View>
        )}
        
        {patient.latestAssessment && (
          <View style={styles.detailRow}>
            <Typo size={12} color={colors.neutral500}>Risk Skoru:</Typo>
            <Typo size={12} color={colors.neutral400}>
              %{(patient.latestAssessment.overallRiskScore * 100).toFixed(0)}
            </Typo>
          </View>
        )}
        
                  {patient.latestAssessment?.priorityAlerts && patient.latestAssessment.priorityAlerts.length > 0 && (
            <View style={styles.alertsContainer}>
              <Typo size={11} color={colors.error} fontWeight="600">
                ⚠️ {patient.latestAssessment.priorityAlerts.length} aktif uyarı
              </Typo>
            </View>
          )}
      </View>
      
      <Icons.CaretRight size={20} color={colors.neutral400} />
    </TouchableOpacity>
  );

  const highRiskCount = patients.filter(p => p.riskLevel === 'high').length;
  const mediumRiskCount = patients.filter(p => p.riskLevel === 'medium').length;
  const lowRiskCount = patients.filter(p => p.riskLevel === 'low').length;

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <Typo size={24} fontWeight="700">Hastalarım</Typo>
        <View style={styles.headerStats}>
          <Typo size={14} color={colors.neutral400}>
            {patients.length} hasta
          </Typo>
          {highRiskCount > 0 && (
            <Typo size={12} color={colors.error} fontWeight="600">
              {highRiskCount} yüksek risk
            </Typo>
          )}
          {user?.role === 'doctor' && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/doctor-test')}
            >
              <Icons.Flask size={16} color={colors.primary} />
              <Typo size={12} color={colors.primary} fontWeight="600">Test</Typo>
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* Filter buttons */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {renderFilterButton('all', 'Tümü', patients.length)}
          {renderFilterButton('high', 'Yüksek Risk', highRiskCount)}
          {renderFilterButton('medium', 'Orta Risk', mediumRiskCount)}
          {renderFilterButton('low', 'Düşük Risk', lowRiskCount)}
        </ScrollView>
      </View>
      
      <ScrollView style={styles.container}>
        {loading ? (
          <View style={styles.centered}>
            <Typo>Yükleniyor...</Typo>
          </View>
        ) : filteredPatients.length > 0 ? (
          <View style={styles.patientsList}>
            {filteredPatients.map(renderPatientItem)}
          </View>
        ) : (
          <View style={styles.centered}>
            <Icons.UsersFour size={48} color={colors.neutral400} weight="duotone" />
            <Typo style={styles.emptyText}>
              {filter === 'all' 
                ? 'Henüz hasta kaydınız bulunmamaktadır.' 
                : `${getRiskText(filter)} seviyesinde hasta bulunmamaktadır.`
              }
            </Typo>
            <Typo size={14} color={colors.neutral500} style={styles.emptySubtext}>
              Hasta sağlık analizleri otomatik olarak kaydedilecektir.
            </Typo>
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};

export default PatientsScreen;

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
  headerStats: {
    alignItems: 'flex-end',
    gap: spacingY._2,
  },
  filtersContainer: {
    paddingHorizontal: spacingX._20,
    marginBottom: spacingY._15,
  },
  filterButton: {
    paddingHorizontal: spacingX._15,
    paddingVertical: spacingY._8,
    marginRight: spacingX._10,
    backgroundColor: colors.neutral800,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.neutral700,
  },
  filterButtonActive: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  patientsList: {
    paddingHorizontal: spacingX._20,
    paddingBottom: spacingY._20,
  },
  patientCard: {
    backgroundColor: colors.neutral900,
    padding: spacingY._15,
    borderRadius: 12,
    marginBottom: spacingY._10,
    borderLeftWidth: 4,
    borderLeftColor: colors.neutral700,
  },
  highRiskCard: {
    borderLeftColor: colors.error,
    backgroundColor: colors.error + '05',
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacingY._10,
  },
  patientIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral800,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacingX._15,
  },
  patientInfo: {
    flex: 1,
    gap: spacingY._2,
  },
  riskBadge: {
    padding: spacingY._5,
  },
  patientDetails: {
    gap: spacingY._5,
    marginBottom: spacingY._10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertsContainer: {
    marginTop: spacingY._5,
    padding: spacingY._8,
    backgroundColor: colors.error + '10',
    borderRadius: 6,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacingX._40,
    paddingTop: spacingY._40,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: spacingY._15,
    marginBottom: spacingY._10,
  },
  emptySubtext: {
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingX._5,
    padding: spacingY._5,
    backgroundColor: colors.primary + '20',
    borderRadius: 6,
  },
}); 