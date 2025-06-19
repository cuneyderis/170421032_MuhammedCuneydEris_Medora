import { StyleSheet, View, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import BackButton from '@/components/BackButton';
import { colors, spacingX, spacingY } from '@/constants/theme';
import * as Icons from 'phosphor-react-native';
import { patientHealthService, PatientRecord, HealthAnalysisSession } from '@/services/patientHealthService';
import { appointmentService } from '@/services/appointmentService';
import { useAuth } from '@/contexts/authContext';

const PatientDetailScreen = () => {
  const { patientId, doctorId } = useLocalSearchParams<{
    patientId: string;
    doctorId: string;
  }>();
  
  const { user } = useAuth();
  const [patient, setPatient] = useState<PatientRecord | null>(null);
  const [healthHistory, setHealthHistory] = useState<HealthAnalysisSession[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'notes'>('overview');
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    console.log('Patient Detail - URL Params:', { patientId, doctorId });
    if (patientId && doctorId) {
      fetchPatientData();
    } else {
      console.log('Missing parameters for patient detail:', { patientId, doctorId });
    }
  }, [patientId, doctorId]);

  const fetchPatientData = async () => {
    if (!patientId || !doctorId) return;
    
    setLoading(true);
    try {
      console.log(`🔍 Searching for patient - ID: ${patientId}, Doctor: ${doctorId}`);
      
      // Önce hasta kayıtlarından dene
      let patientData = await patientHealthService.getPatientDetails(doctorId, patientId);
      console.log('📋 Patient from records:', patientData ? 'FOUND' : 'NOT FOUND');
      
      // Eğer hasta kaydı yoksa, randevulardan oluştur
      if (!patientData) {
        console.log('🔍 Patient not found in records, checking appointments...');
        const appointments = await appointmentService.getAppointments({ 
          doctorId, 
          patientId 
        });
        console.log(`📅 Found ${appointments.length} appointments for this patient`);
        
        if (appointments.length > 0) {
          const firstAppointment = appointments[0];
          console.log('📋 Creating patient from appointment data:', {
            name: firstAppointment.patientName,
            email: firstAppointment.patientEmail,
            id: firstAppointment.patientId
          });
          
          // Randevudan hasta bilgisi oluştur
          patientData = {
            id: `appointment_${patientId}`,
            patientId: patientId,
            doctorId: doctorId,
            patientInfo: {
              name: firstAppointment.patientName || 'Hasta',
              email: firstAppointment.patientEmail || '',
              phone: firstAppointment.patientPhone || '',
              dateOfBirth: '',
              gender: 'other' as const,
              bloodType: '',
              allergies: [],
              chronicConditions: [],
            },
            riskLevel: 'low' as const,
            createdAt: firstAppointment.createdAt || new Date(),
            updatedAt: firstAppointment.updatedAt || new Date(),
            lastAnalysisDate: undefined
          };
          console.log('✅ Patient data created from appointment');
        } else {
          console.log('❌ No appointments found for this patient');
        }
      } else {
        console.log('✅ Patient data found in records');
      }
      
      console.log('🏥 Final patient data:', patientData ? 'SET' : 'NULL');
      setPatient(patientData);
      
      // Sağlık geçmişini getir
      const history = await patientHealthService.getPatientHealthHistory(patientId, doctorId, 20);
      setHealthHistory(history);
      
      // Notları getir
      const patientNotes = await patientHealthService.getPatientNotes(doctorId, patientId);
      setNotes(patientNotes);
      
    } catch (error) {
      console.error('Error fetching patient data:', error);
      Alert.alert('Hata', 'Hasta bilgileri yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !patientId || !doctorId) return;
    
    setAddingNote(true);
    try {
      const result = await patientHealthService.addPatientNote(doctorId, patientId, newNote.trim());
      
      if (result.success) {
        setNewNote('');
        // Notları yeniden yükle
        const patientNotes = await patientHealthService.getPatientNotes(doctorId, patientId);
        setNotes(patientNotes);
      } else {
        Alert.alert('Hata', result.msg || 'Not eklenemedi');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      Alert.alert('Hata', 'Not eklenirken bir hata oluştu.');
    } finally {
      setAddingNote(false);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return colors.error;
      case 'medium': return colors.warning;
      case 'low': return colors.success;
      default: return colors.neutral500;
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

  const renderTab = (tabKey: typeof activeTab, title: string, icon: React.ReactNode) => (
    <TouchableOpacity
      style={[styles.tab, activeTab === tabKey && styles.activeTab]}
      onPress={() => setActiveTab(tabKey)}
    >
      {icon}
      <Typo 
        size={12} 
        fontWeight={activeTab === tabKey ? '600' : '400'}
        color={activeTab === tabKey ? colors.primary : colors.neutral400}
      >
        {title}
      </Typo>
    </TouchableOpacity>
  );

  const renderOverview = () => (
    <View style={styles.tabContent}>
      {/* Risk Durumu */}
      <View style={styles.riskCard}>
        <View style={styles.riskHeader}>
          <Icons.Heart size={24} color={getRiskColor(patient?.riskLevel || 'low')} weight="fill" />
          <View style={styles.riskInfo}>
            <Typo fontWeight="600">Risk Durumu</Typo>
            <Typo 
              size={18} 
              fontWeight="700" 
              color={getRiskColor(patient?.riskLevel || 'low')}
            >
              {getRiskText(patient?.riskLevel || 'low')}
            </Typo>
          </View>
          {patient?.latestAssessment && (
            <View style={styles.riskScore}>
              <Typo size={12} color={colors.neutral500}>Skor</Typo>
              <Typo size={16} fontWeight="600">
                %{(patient.latestAssessment.overallRiskScore * 100).toFixed(0)}
              </Typo>
            </View>
          )}
        </View>
        
        {patient?.latestAssessment?.priorityAlerts && patient.latestAssessment.priorityAlerts.length > 0 && (
          <View style={styles.alertsSection}>
            <Typo size={14} fontWeight="600" color={colors.error}>
              ⚠️ Aktif Uyarılar
            </Typo>
            {patient.latestAssessment.priorityAlerts.map((alert, index) => (
              <Typo key={index} size={13} color={colors.neutral300} style={styles.alertItem}>
                • {alert}
              </Typo>
            ))}
          </View>
        )}
      </View>

      {/* Hasta Bilgileri */}
      <View style={styles.section}>
        <Typo size={16} fontWeight="600" style={styles.sectionTitle}>
          Hasta Bilgileri
        </Typo>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Icons.Envelope size={16} color={colors.neutral400} />
            <Typo size={14} color={colors.neutral300}>
              {patient?.patientInfo.email || 'Belirtilmemiş'}
            </Typo>
          </View>
          
          {patient?.patientInfo.phone && (
            <View style={styles.infoItem}>
              <Icons.Phone size={16} color={colors.neutral400} />
              <Typo size={14} color={colors.neutral300}>
                {patient.patientInfo.phone}
              </Typo>
            </View>
          )}
          
          {patient?.patientInfo.dateOfBirth && (
            <View style={styles.infoItem}>
              <Icons.Calendar size={16} color={colors.neutral400} />
              <Typo size={14} color={colors.neutral300}>
                {new Date(patient.patientInfo.dateOfBirth).toLocaleDateString('tr-TR')}
              </Typo>
            </View>
          )}
          
          {patient?.patientInfo.gender && (
            <View style={styles.infoItem}>
              <Icons.Person size={16} color={colors.neutral400} />
              <Typo size={14} color={colors.neutral300}>
                {patient.patientInfo.gender === 'male' ? 'Erkek' : 
                 patient.patientInfo.gender === 'female' ? 'Kadın' : 'Diğer'}
              </Typo>
            </View>
          )}
          
          {patient?.patientInfo.bloodType && (
            <View style={styles.infoItem}>
              <Icons.Drop size={16} color={colors.neutral400} />
              <Typo size={14} color={colors.neutral300}>
                {patient.patientInfo.bloodType}
              </Typo>
            </View>
          )}
        </View>
      </View>

      {/* Son Analiz */}
      {patient?.latestHealthData && (
        <View style={styles.section}>
          <Typo size={16} fontWeight="600" style={styles.sectionTitle}>
            Son Sağlık Analizi
          </Typo>
          <View style={styles.healthDataGrid}>
            {patient.latestHealthData.heartRate && (
              <View style={styles.healthDataItem}>
                <Icons.Heart size={20} color={colors.primary} />
                <Typo size={12} color={colors.neutral400}>Kalp Atışı</Typo>
                <Typo size={16} fontWeight="600">
                  {patient.latestHealthData.heartRate} bpm
                </Typo>
              </View>
            )}
            
            {patient.latestHealthData.bloodPressure && (
              <View style={styles.healthDataItem}>
                <Icons.Pulse size={20} color={colors.primary} />
                <Typo size={12} color={colors.neutral400}>Tansiyon</Typo>
                <Typo size={16} fontWeight="600">
                  {patient.latestHealthData.bloodPressure.systolic}/
                  {patient.latestHealthData.bloodPressure.diastolic}
                </Typo>
              </View>
            )}
            
            {patient.latestHealthData.weight && (
              <View style={styles.healthDataItem}>
                <Icons.Scales size={20} color={colors.primary} />
                <Typo size={12} color={colors.neutral400}>Kilo</Typo>
                <Typo size={16} fontWeight="600">
                  {patient.latestHealthData.weight} kg
                </Typo>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );

  const renderHistory = () => (
    <View style={styles.tabContent}>
      <Typo size={16} fontWeight="600" style={styles.sectionTitle}>
        Sağlık Analizi Geçmişi
      </Typo>
      
      {healthHistory.length > 0 ? (
        <View style={styles.historyList}>
          {healthHistory.map((session, index) => (
            <View key={session.id || index} style={styles.historyItem}>
              <View style={styles.historyHeader}>
                <View style={styles.historyDate}>
                  <Icons.Calendar size={16} color={colors.neutral400} />
                  <Typo size={14} fontWeight="600">
                    {new Date(session.createdAt).toLocaleDateString('tr-TR')}
                  </Typo>
                </View>
                <View style={[
                  styles.sessionType,
                  session.sessionType === 'emergency' && styles.emergencyType
                ]}>
                  <Typo size={12} color={
                    session.sessionType === 'emergency' ? colors.error : colors.neutral400
                  }>
                    {session.sessionType === 'routine' ? 'Rutin' :
                     session.sessionType === 'emergency' ? 'Acil' : 'Takip'}
                  </Typo>
                </View>
              </View>
              
              <View style={styles.historyContent}>
                <Typo size={13} color={colors.neutral300}>
                  Risk Skoru: %{(session.aiAssessment.overallRiskScore * 100).toFixed(0)}
                </Typo>
                
                {session.aiAssessment.priorityAlerts.length > 0 && (
                  <Typo size={12} color={colors.error}>
                    {session.aiAssessment.priorityAlerts.length} uyarı
                  </Typo>
                )}
                
                {session.notes && (
                  <Typo size={12} color={colors.neutral400} style={styles.sessionNote}>
                    "{session.notes}"
                  </Typo>
                )}
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Icons.ChartLine size={48} color={colors.neutral400} weight="duotone" />
          <Typo color={colors.neutral400}>Henüz analiz geçmişi bulunmamaktadır.</Typo>
        </View>
      )}
    </View>
  );

  const renderNotes = () => (
    <View style={styles.tabContent}>
      <View style={styles.notesHeader}>
        <Typo size={16} fontWeight="600">Doktor Notları</Typo>
        
        <View style={styles.addNoteSection}>
          <TextInput
            style={styles.noteInput}
            placeholder="Yeni not ekle..."
            placeholderTextColor={colors.neutral400}
            value={newNote}
            onChangeText={setNewNote}
            multiline
            numberOfLines={3}
          />
          <TouchableOpacity
            style={[styles.addButton, !newNote.trim() && styles.addButtonDisabled]}
            onPress={handleAddNote}
            disabled={!newNote.trim() || addingNote}
          >
            <Icons.Plus size={20} color={colors.white} />
            <Typo size={14} color={colors.white} fontWeight="600">
              {addingNote ? 'Ekleniyor...' : 'Ekle'}
            </Typo>
          </TouchableOpacity>
        </View>
      </View>
      
      {notes.length > 0 ? (
        <View style={styles.notesList}>
          {notes.map((note, index) => (
            <View key={note.id || index} style={styles.noteItem}>
              <View style={styles.noteHeader}>
                <Typo size={14} fontWeight="600">
                  {new Date(note.createdAt?.toDate?.() || note.createdAt).toLocaleDateString('tr-TR')}
                </Typo>
                <View style={styles.noteType}>
                  <Typo size={11} color={colors.neutral400}>
                    {note.noteType === 'treatment' ? 'Tedavi' :
                     note.noteType === 'follow_up' ? 'Takip' : 'Genel'}
                  </Typo>
                </View>
              </View>
              <Typo size={14} color={colors.neutral300} style={styles.noteContent}>
                {note.note}
              </Typo>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Icons.NotePencil size={48} color={colors.neutral400} weight="duotone" />
          <Typo color={colors.neutral400}>Henüz not bulunmamaktadır.</Typo>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.header}>
          <BackButton />
          <Typo size={18} fontWeight="600">Yükleniyor...</Typo>
        </View>
        <View style={styles.centered}>
          <Typo>Hasta bilgileri yükleniyor...</Typo>
        </View>
      </ScreenWrapper>
    );
  }

  if (!patient && !loading) {
    return (
      <ScreenWrapper>
        <View style={styles.header}>
          <BackButton />
          <Typo size={18} fontWeight="600">Hasta Bulunamadı</Typo>
        </View>
        <View style={styles.centered}>
          <Icons.Warning size={48} color={colors.neutral400} />
          <Typo color={colors.neutral400} style={{ textAlign: 'center', paddingHorizontal: 20 }}>
            Bu hasta için bilgi bulunamadı.{'\n'}
            Hasta ID: {patientId}{'\n'}
            Doktor ID: {doctorId}
          </Typo>
          <TouchableOpacity 
            style={{ 
              backgroundColor: colors.primary, 
              paddingHorizontal: 20, 
              paddingVertical: 10, 
              borderRadius: 8,
              marginTop: 20 
            }}
            onPress={() => {
              console.log('Retrying fetch patient data...');
              fetchPatientData();
            }}
          >
            <Typo color={colors.white}>Tekrar Dene</Typo>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <BackButton />
        <View style={styles.headerInfo}>
          <Typo size={18} fontWeight="600">{patient?.patientInfo.name}</Typo>
          <Typo size={14} color={colors.neutral400}>
            {patient?.lastAnalysisDate 
              ? `Son analiz: ${new Date(patient.lastAnalysisDate).toLocaleDateString('tr-TR')}`
              : 'Henüz analiz yapılmamış'
            }
          </Typo>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {renderTab('overview', 'Genel Bakış', 
          <Icons.User size={16} color={activeTab === 'overview' ? colors.primary : colors.neutral400} />
        )}
        {renderTab('history', 'Geçmiş', 
          <Icons.ClockCounterClockwise size={16} color={activeTab === 'history' ? colors.primary : colors.neutral400} />
        )}
        {renderTab('notes', 'Notlar', 
          <Icons.NotePencil size={16} color={activeTab === 'notes' ? colors.primary : colors.neutral400} />
        )}
      </View>

      <ScrollView style={styles.container}>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'history' && renderHistory()}
        {activeTab === 'notes' && renderNotes()}
      </ScrollView>
    </ScreenWrapper>
  );
};

export default PatientDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._15,
    gap: spacingX._15,
  },
  headerInfo: {
    flex: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacingX._20,
    marginBottom: spacingY._15,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacingY._12,
    gap: spacingX._8,
    backgroundColor: colors.neutral800,
    borderRadius: 8,
    marginHorizontal: spacingX._3,
  },
  activeTab: {
    backgroundColor: colors.primary + '20',
  },
  tabContent: {
    paddingHorizontal: spacingX._20,
    paddingBottom: spacingY._30,
  },
  section: {
    marginBottom: spacingY._20,
  },
  sectionTitle: {
    marginBottom: spacingY._12,
  },
  riskCard: {
    backgroundColor: colors.neutral900,
    padding: spacingY._20,
    borderRadius: 12,
    marginBottom: spacingY._20,
  },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingX._15,
  },
  riskInfo: {
    flex: 1,
  },
  riskScore: {
    alignItems: 'center',
  },
  alertsSection: {
    marginTop: spacingY._15,
    padding: spacingY._12,
    backgroundColor: colors.error + '10',
    borderRadius: 8,
  },
  alertItem: {
    marginTop: spacingY._5,
  },
  infoGrid: {
    gap: spacingY._10,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingX._10,
  },
  healthDataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacingX._10,
  },
  healthDataItem: {
    flex: 1,
    minWidth: 100,
    backgroundColor: colors.neutral900,
    padding: spacingY._15,
    borderRadius: 8,
    alignItems: 'center',
    gap: spacingY._5,
  },
  historyList: {
    gap: spacingY._10,
  },
  historyItem: {
    backgroundColor: colors.neutral900,
    padding: spacingY._15,
    borderRadius: 8,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacingY._8,
  },
  historyDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingX._8,
  },
  sessionType: {
    paddingHorizontal: spacingX._8,
    paddingVertical: spacingY._4,
    backgroundColor: colors.neutral800,
    borderRadius: 4,
  },
  emergencyType: {
    backgroundColor: colors.error + '20',
  },
  historyContent: {
    gap: spacingY._5,
  },
  sessionNote: {
    fontStyle: 'italic',
  },
  notesHeader: {
    marginBottom: spacingY._20,
  },
  addNoteSection: {
    marginTop: spacingY._15,
  },
  noteInput: {
    backgroundColor: colors.neutral900,
    padding: spacingY._15,
    borderRadius: 8,
    color: colors.text,
    fontSize: 14,
    textAlignVertical: 'top',
    marginBottom: spacingY._10,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: spacingY._12,
    borderRadius: 8,
    gap: spacingX._8,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  notesList: {
    gap: spacingY._10,
  },
  noteItem: {
    backgroundColor: colors.neutral900,
    padding: spacingY._15,
    borderRadius: 8,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacingY._8,
  },
  noteType: {
    paddingHorizontal: spacingX._8,
    paddingVertical: spacingY._4,
    backgroundColor: colors.neutral800,
    borderRadius: 4,
  },
  noteContent: {
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacingY._40,
    gap: spacingY._15,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 