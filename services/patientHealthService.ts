import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  Timestamp,
  addDoc
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { 
  ComprehensiveHealthData, 
  AIHealthAssessment, 
  CardiovascularRiskPrediction,
  ECGAnalysisPrediction
} from '@/types/health';
import { UserType } from '@/types';

export interface PatientRecord {
  id?: string;
  patientId: string;
  doctorId: string;
  patientInfo: {
    name: string;
    email: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: 'male' | 'female' | 'other';
    bloodType?: string;
    allergies?: string[];
    chronicConditions?: string[];
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
  };
  latestHealthData?: ComprehensiveHealthData;
  latestAssessment?: AIHealthAssessment;
  riskLevel: 'low' | 'medium' | 'high';
  lastAnalysisDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface HealthAnalysisSession {
  id?: string;
  patientId: string;
  doctorId?: string;
  healthData: ComprehensiveHealthData;
  aiAssessment: AIHealthAssessment;
  sessionType: 'routine' | 'emergency' | 'follow_up';
  notes?: string;
  createdAt: Date;
}

class PatientHealthService {
  // Hasta kaydı oluştur veya güncelle
  async savePatientRecord(
    patientId: string, 
    doctorId: string, 
    patientInfo: PatientRecord['patientInfo']
  ): Promise<{ success: boolean; msg?: string }> {
    try {
      const patientRef = doc(db, 'patient_records', `${doctorId}_${patientId}`);
      
      const existingDoc = await getDoc(patientRef);
      
      if (existingDoc.exists()) {
        // Güncelle
        await updateDoc(patientRef, {
          patientInfo,
          updatedAt: new Date()
        });
      } else {
        // Yeni kayıt oluştur
        const newRecord: PatientRecord = {
          patientId,
          doctorId,
          patientInfo,
          riskLevel: 'low',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await setDoc(patientRef, newRecord);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error saving patient record:', error);
      return { success: false, msg: 'Hasta kaydı kaydedilemedi' };
    }
  }

  // Sağlık verisi ve AI analizi kaydet
  async saveHealthAnalysis(
    patientId: string,
    doctorId: string,
    healthData: ComprehensiveHealthData,
    aiAssessment: AIHealthAssessment,
    sessionType: HealthAnalysisSession['sessionType'] = 'routine',
    notes?: string
  ): Promise<{ success: boolean; msg?: string }> {
    try {
      // 1. Analiz oturumu kaydet
      const sessionData: HealthAnalysisSession = {
        patientId,
        doctorId,
        healthData,
        aiAssessment,
        sessionType,
        notes,
        createdAt: new Date()
      };
      
      const sessionRef = await addDoc(collection(db, 'health_sessions'), sessionData);
      
      // 2. Hasta kaydını güncelle
      const patientRecordRef = doc(db, 'patient_records', `${doctorId}_${patientId}`);
      const patientRecord = await getDoc(patientRecordRef);
      
      if (patientRecord.exists()) {
        await updateDoc(patientRecordRef, {
          latestHealthData: healthData,
          latestAssessment: aiAssessment,
          riskLevel: aiAssessment.overallRiskScore > 0.7 ? 'high' : 
                     aiAssessment.overallRiskScore > 0.4 ? 'medium' : 'low',
          lastAnalysisDate: new Date(),
          updatedAt: new Date()
        });
      }
      
      // 3. Hasta için sağlık verisi geçmişi kaydet
      const healthDataRef = doc(db, 'health_data', `${patientId}_${Date.now()}`);
      await setDoc(healthDataRef, {
        ...healthData,
        sessionId: sessionRef.id,
        doctorId,
        createdAt: new Date()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error saving health analysis:', error);
      return { success: false, msg: 'Sağlık analizi kaydedilemedi' };
    }
  }

  // Doktorun hastalarını getir
  async getDoctorPatients(doctorId: string): Promise<PatientRecord[]> {
    try {
      // Index gerektirmeyen basit query kullan
      const q = query(
        collection(db, 'patient_records'),
        where('doctorId', '==', doctorId)
      );
      
      const querySnapshot = await getDocs(q);
      const patients: PatientRecord[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        patients.push({
          id: doc.id,
          ...data,
          // Timestamp'leri Date'e çevir
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
          lastAnalysisDate: data.lastAnalysisDate?.toDate?.() || data.lastAnalysisDate
        } as PatientRecord);
      });
      
      // Client tarafında sırala (updatedAt'e göre desc)
      patients.sort((a, b) => {
        const dateA = a.updatedAt instanceof Date ? a.updatedAt : new Date(a.updatedAt);
        const dateB = b.updatedAt instanceof Date ? b.updatedAt : new Date(b.updatedAt);
        return dateB.getTime() - dateA.getTime();
      });
      
      return patients;
    } catch (error) {
      console.error('Error fetching doctor patients:', error);
      return [];
    }
  }

  // Belirli bir hastanın detaylarını getir
  async getPatientDetails(
    doctorId: string, 
    patientId: string
  ): Promise<PatientRecord | null> {
    try {
      const patientRef = doc(db, 'patient_records', `${doctorId}_${patientId}`);
      const patientDoc = await getDoc(patientRef);
      
      if (patientDoc.exists()) {
        return {
          id: patientDoc.id,
          ...patientDoc.data()
        } as PatientRecord;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching patient details:', error);
      return null;
    }
  }

  // Hastanın sağlık analizi geçmişini getir
  async getPatientHealthHistory(
    patientId: string,
    doctorId?: string,
    limitCount: number = 10
  ): Promise<HealthAnalysisSession[]> {
    try {
      let q;
      
      if (doctorId) {
        // Sadece where kullan, orderBy client tarafında yap
        q = query(
          collection(db, 'health_sessions'),
          where('patientId', '==', patientId),
          where('doctorId', '==', doctorId)
        );
      } else {
        q = query(
          collection(db, 'health_sessions'),
          where('patientId', '==', patientId)
        );
      }
      
      const querySnapshot = await getDocs(q);
      const history: HealthAnalysisSession[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        history.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || data.createdAt
        } as HealthAnalysisSession);
      });
      
      // Client tarafında sırala ve limit uygula
      history.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
      
      return history.slice(0, limitCount);
    } catch (error) {
      console.error('Error fetching patient health history:', error);
      return [];
    }
  }

  // Risk seviyesine göre hastaları getir
  async getPatientsByRiskLevel(
    doctorId: string,
    riskLevel: 'low' | 'medium' | 'high'
  ): Promise<PatientRecord[]> {
    try {
      const q = query(
        collection(db, 'patient_records'),
        where('doctorId', '==', doctorId),
        where('riskLevel', '==', riskLevel)
      );
      
      const querySnapshot = await getDocs(q);
      const patients: PatientRecord[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        patients.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
          lastAnalysisDate: data.lastAnalysisDate?.toDate?.() || data.lastAnalysisDate
        } as PatientRecord);
      });
      
      // Client tarafında sırala
      patients.sort((a, b) => {
        const dateA = a.lastAnalysisDate instanceof Date ? a.lastAnalysisDate : new Date(a.lastAnalysisDate || 0);
        const dateB = b.lastAnalysisDate instanceof Date ? b.lastAnalysisDate : new Date(b.lastAnalysisDate || 0);
        return dateB.getTime() - dateA.getTime();
      });
      
      return patients;
    } catch (error) {
      console.error('Error fetching patients by risk level:', error);
      return [];
    }
  }

  // Acil durumda olan hastaları getir
  async getHighRiskPatients(doctorId: string): Promise<PatientRecord[]> {
    try {
      const q = query(
        collection(db, 'patient_records'),
        where('doctorId', '==', doctorId),
        where('riskLevel', '==', 'high')
      );
      
      const querySnapshot = await getDocs(q);
      const patients: PatientRecord[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const processedData = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
          lastAnalysisDate: data.lastAnalysisDate?.toDate?.() || data.lastAnalysisDate
        } as PatientRecord;
        
        patients.push(processedData);
      });
      
      // Client tarafında sırala - son 24 saat içindekiler önce
      patients.sort((a, b) => {
        const now = new Date().getTime();
        const dayMs = 24 * 60 * 60 * 1000;
        
        const aDate = a.lastAnalysisDate instanceof Date ? a.lastAnalysisDate : new Date(a.lastAnalysisDate || 0);
        const bDate = b.lastAnalysisDate instanceof Date ? b.lastAnalysisDate : new Date(b.lastAnalysisDate || 0);
        
        const aRecent = now - aDate.getTime() < dayMs;
        const bRecent = now - bDate.getTime() < dayMs;
        
        if (aRecent && !bRecent) return -1;
        if (!aRecent && bRecent) return 1;
        
        // Eğer ikisi de recent veya ikisi de değilse, tarih sırasına göre
        return bDate.getTime() - aDate.getTime();
      });
      
      return patients;
    } catch (error) {
      console.error('Error fetching high risk patients:', error);
      return [];
    }
  }

  // Hasta için not ekle
  async addPatientNote(
    doctorId: string,
    patientId: string,
    note: string,
    noteType: 'general' | 'treatment' | 'follow_up' = 'general'
  ): Promise<{ success: boolean; msg?: string }> {
    try {
      const noteData = {
        doctorId,
        patientId,
        note,
        noteType,
        createdAt: new Date()
      };
      
      await addDoc(collection(db, 'patient_notes'), noteData);
      
      return { success: true };
    } catch (error) {
      console.error('Error adding patient note:', error);
      return { success: false, msg: 'Not eklenemedi' };
    }
  }

  // Hasta notlarını getir
  async getPatientNotes(
    doctorId: string,
    patientId: string
  ): Promise<any[]> {
    try {
      const q = query(
        collection(db, 'patient_notes'),
        where('doctorId', '==', doctorId),
        where('patientId', '==', patientId)
      );
      
      const querySnapshot = await getDocs(q);
      const notes: any[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        notes.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || data.createdAt
        });
      });
      
      // Client tarafında sırala
      notes.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
      
      return notes;
    } catch (error) {
      console.error('Error fetching patient notes:', error);
      return [];
    }
  }
}

export const patientHealthService = new PatientHealthService(); 