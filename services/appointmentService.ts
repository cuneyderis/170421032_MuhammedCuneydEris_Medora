import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  onSnapshot,
  QuerySnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { 
  Doctor, 
  Patient, 
  Appointment, 
  AppointmentRequest, 
  AppointmentFilter,
  TimeSlot,
  DaySchedule
} from '@/types/appointment';

export class AppointmentService {
  // Collections
  private doctorsCollection = collection(db, 'doctors');
  private patientsCollection = collection(db, 'patients');
  private appointmentsCollection = collection(db, 'appointments');

  // DOCTOR METHODS
  async createDoctor(doctorData: Omit<Doctor, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(this.doctorsCollection, {
        ...doctorData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating doctor:', error);
      throw error;
    }
  }

  // Helper function to normalize doctor data
  private normalizeDoctorData(doctorData: any, docId: string): Doctor {
    return {
      id: docId,
      uid: doctorData.uid,
      firstName: doctorData.firstName,
      lastName: doctorData.lastName,
      name: doctorData.name || `${doctorData.firstName || ''} ${doctorData.lastName || ''}`.trim() || 'Doktor',
      specialty: doctorData.specialty || doctorData.specialization,
      specialization: doctorData.specialization,
      title: doctorData.title || 'Dr.',
      hospital: doctorData.hospital,
      email: doctorData.email,
      phone: doctorData.phone,
      avatar: doctorData.avatar || doctorData.image,
      image: doctorData.image,
      rating: doctorData.rating || 4.5,
      experience: doctorData.experience || 0,
      licenseNumber: doctorData.licenseNumber,
      department: doctorData.department,
      education: doctorData.education || [],
      certifications: doctorData.certifications || [],
      role: doctorData.role,
      workingHours: doctorData.workingHours || this.getDefaultWorkingHours(),
      unavailableDates: doctorData.unavailableDates || [],
      createdAt: doctorData.createdAt?.toDate ? doctorData.createdAt.toDate() : 
                 doctorData.createdAt ? new Date(doctorData.createdAt) : undefined,
      updatedAt: doctorData.updatedAt?.toDate ? doctorData.updatedAt.toDate() : 
                 doctorData.updatedAt ? new Date(doctorData.updatedAt) : undefined
    };
  }

  // Default working hours
  private getDefaultWorkingHours() {
    const defaultHours = {
      start: '09:00',
      end: '17:00',
      isWorking: true
    };

    return {
      monday: defaultHours,
      tuesday: defaultHours,
      wednesday: defaultHours,
      thursday: defaultHours,
      friday: defaultHours,
      saturday: { start: '09:00', end: '13:00', isWorking: true },
      sunday: { start: '09:00', end: '17:00', isWorking: false }
    };
  }

  async getDoctors(): Promise<Doctor[]> {
    try {
      const querySnapshot = await getDocs(this.doctorsCollection);
      return querySnapshot.docs.map(doc => 
        this.normalizeDoctorData(doc.data(), doc.id)
      );
    } catch (error) {
      console.error('Error getting doctors:', error);
      throw error;
    }
  }

  async getDoctorById(doctorId: string): Promise<Doctor | null> {
    try {
      const docSnap = await getDoc(doc(this.doctorsCollection, doctorId));
      if (docSnap.exists()) {
        return this.normalizeDoctorData(docSnap.data(), docSnap.id);
      }
      return null;
    } catch (error) {
      console.error('Error getting doctor:', error);
      throw error;
    }
  }

  async getDoctorsBySpecialty(specialty: string): Promise<Doctor[]> {
    try {
      // Both specialty and specialization fields'ını kontrol et
      const queries = [
        query(this.doctorsCollection, where('specialty', '==', specialty)),
        query(this.doctorsCollection, where('specialization', '==', specialty))
      ];

      const results = await Promise.all(queries.map(q => getDocs(q)));
      const allDocs = results.flatMap(snapshot => snapshot.docs);
      
      // Duplicate'ları kaldır
      const uniqueDocs = allDocs.filter((doc, index, self) => 
        index === self.findIndex(d => d.id === doc.id)
      );

      return uniqueDocs.map(doc => 
        this.normalizeDoctorData(doc.data(), doc.id)
      ).sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } catch (error) {
      console.error('Error getting doctors by specialty:', error);
      throw error;
    }
  }

  // PATIENT METHODS
  async createPatient(patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(this.patientsCollection, {
        ...patientData,
        dateOfBirth: Timestamp.fromDate(patientData.dateOfBirth),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating patient:', error);
      throw error;
    }
  }

  async getPatientById(patientId: string): Promise<Patient | null> {
    try {
      const docSnap = await getDoc(doc(this.patientsCollection, patientId));
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          dateOfBirth: data.dateOfBirth?.toDate ? data.dateOfBirth.toDate() : 
                       data.dateOfBirth ? new Date(data.dateOfBirth) : new Date(),
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : 
                     data.createdAt ? new Date(data.createdAt) : undefined,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : 
                     data.updatedAt ? new Date(data.updatedAt) : undefined
        } as Patient;
      }
      return null;
    } catch (error) {
      console.error('Error getting patient:', error);
      throw error;
    }
  }

  // APPOINTMENT METHODS
  async createAppointment(appointmentData: AppointmentRequest): Promise<string> {
    try {
      // Undefined değerleri temizle
      const cleanData = Object.fromEntries(
        Object.entries(appointmentData).filter(([_, value]) => value !== undefined)
      );

      const finalData = {
        ...cleanData,
        date: Timestamp.fromDate(appointmentData.date),
        duration: 30, // varsayılan 30 dakika
        status: 'pending',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(this.appointmentsCollection, finalData);
      
      // Randevu oluşturulduğunda otomatik hasta kaydı oluştur
      try {
        await this.createPatientRecordFromAppointment(appointmentData);
      } catch (patientError) {
        console.warn('Patient record creation failed, but appointment was created:', patientError);
        // Hasta kaydı başarısız olursa sadece warn log'u at, randevuyu iptal etme
      }
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  }

  // Randevu bilgilerinden hasta kaydı oluştur
  private async createPatientRecordFromAppointment(appointmentData: AppointmentRequest): Promise<void> {
    if (!appointmentData.patientName || !appointmentData.doctorId || !appointmentData.patientId) {
      console.log('Insufficient patient data for creating patient record');
      return;
    }

    // Hasta kaydı patients sayfasında otomatik olarak oluşturulacak
    console.log(`📋 Appointment created for patient: ${appointmentData.patientName}`);
    console.log(`🔗 Patient will be available in doctor's patient list automatically`);
  }

  async getAppointments(filter?: AppointmentFilter): Promise<Appointment[]> {
    try {
      let q;
      
      // Eğer filter varsa, orderBy kullanmayalım (composite index gerektirir)
      if (filter?.doctorId || filter?.patientId || filter?.status || filter?.type) {
        q = query(this.appointmentsCollection);
        
        if (filter?.doctorId) {
          q = query(q, where('doctorId', '==', filter.doctorId));
        }
        if (filter?.patientId) {
          q = query(q, where('patientId', '==', filter.patientId));
        }
        if (filter?.status) {
          q = query(q, where('status', '==', filter.status));
        }
        if (filter?.type) {
          q = query(q, where('type', '==', filter.type));
        }
      } else {
        // Filter yoksa sadece tarih sıralaması kullan
        q = query(this.appointmentsCollection, orderBy('date', 'desc'));
      }

      const querySnapshot = await getDocs(q);
      const appointments = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date?.toDate ? data.date.toDate() : 
                data.date ? new Date(data.date) : new Date(),
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : 
                     data.createdAt ? new Date(data.createdAt) : undefined,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : 
                     data.updatedAt ? new Date(data.updatedAt) : undefined
        };
      }) as Appointment[];

      // Client-side sorting eğer filter varsa
      if (filter?.doctorId || filter?.patientId || filter?.status || filter?.type) {
        appointments.sort((a, b) => b.date.getTime() - a.date.getTime());
      }

      return appointments;
    } catch (error) {
      console.error('Error getting appointments:', error);
      throw error;
    }
  }

  async getAppointmentById(appointmentId: string): Promise<Appointment | null> {
    try {
      const docSnap = await getDoc(doc(this.appointmentsCollection, appointmentId));
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          date: data.date?.toDate ? data.date.toDate() : 
                data.date ? new Date(data.date) : new Date(),
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : 
                     data.createdAt ? new Date(data.createdAt) : undefined,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : 
                     data.updatedAt ? new Date(data.updatedAt) : undefined
        } as Appointment;
      }
      return null;
    } catch (error) {
      console.error('Error getting appointment:', error);
      throw error;
    }
  }

  async updateAppointmentStatus(appointmentId: string, status: Appointment['status']): Promise<void> {
    try {
      await updateDoc(doc(this.appointmentsCollection, appointmentId), {
        status,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating appointment status:', error);
      throw error;
    }
  }

  async cancelAppointment(appointmentId: string): Promise<void> {
    try {
      await updateDoc(doc(this.appointmentsCollection, appointmentId), {
        status: 'cancelled',
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      throw error;
    }
  }

  async addDoctorNotes(appointmentId: string, notes: string): Promise<void> {
    try {
      await updateDoc(doc(this.appointmentsCollection, appointmentId), {
        doctorNotes: notes,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error adding doctor notes:', error);
      throw error;
    }
  }

  // SCHEDULE METHODS
  async getDoctorAvailableSlots(doctorId: string, date: Date): Promise<TimeSlot[]> {
    try {
      const doctor = await this.getDoctorById(doctorId);
      if (!doctor) {
        console.error('Doctor not found:', doctorId);
        return [];
      }

      // Gün adını doğru formatta al
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayOfWeek = dayNames[date.getDay()];
      
      const workingHours = doctor.workingHours?.[dayOfWeek];
      
      if (!workingHours || !workingHours.isWorking) {
        return [];
      }

      // Mevcut randevuları al
      const dateStart = new Date(date);
      dateStart.setHours(0, 0, 0, 0);
      const dateEnd = new Date(date);
      dateEnd.setHours(23, 59, 59, 999);

      const appointments = await this.getAppointments({
        doctorId,
        dateFrom: dateStart,
        dateTo: dateEnd
      });

      // Zaman slotlarını oluştur
      const slots: TimeSlot[] = [];
      const startTime = this.parseTime(workingHours.start);
      const endTime = this.parseTime(workingHours.end);
      
      if (startTime >= endTime) {
        console.error('Invalid working hours: start time >= end time');
        return [];
      }
      
      for (let time = startTime; time < endTime; time += 30) { // 30 dakikalık slotlar
        const timeString = this.formatTime(time);
        const isBooked = appointments.some(apt => {
          const aptTime = apt.date.getHours() * 60 + apt.date.getMinutes();
          return aptTime === time && apt.status !== 'cancelled';
        });

        slots.push({
          time: timeString,
          isAvailable: !isBooked,
          isBooked,
          appointmentId: isBooked ? appointments.find(apt => {
            const aptTime = apt.date.getHours() * 60 + apt.date.getMinutes();
            return aptTime === time;
          })?.id : undefined
        });
      }

      return slots;
    } catch (error) {
      console.error('Error getting available slots:', error);
      return []; // Hata durumunda boş array döndür
    }
  }

  // REAL-TIME LISTENERS
  subscribeToAppointments(
    callback: (appointments: Appointment[]) => void,
    filter?: AppointmentFilter
  ): () => void {
    let q;
    
    // Eğer filter varsa, orderBy kullanmayalım (composite index gerektirir)
    if (filter?.doctorId || filter?.patientId) {
      q = query(this.appointmentsCollection);
      
      if (filter?.doctorId) {
        q = query(q, where('doctorId', '==', filter.doctorId));
      }
      if (filter?.patientId) {
        q = query(q, where('patientId', '==', filter.patientId));
      }
    } else {
      // Filter yoksa sadece tarih sıralaması kullan
      q = query(this.appointmentsCollection, orderBy('date', 'desc'));
    }

    return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      const appointments = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date?.toDate ? data.date.toDate() : 
                data.date ? new Date(data.date) : new Date(),
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : 
                     data.createdAt ? new Date(data.createdAt) : undefined,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : 
                     data.updatedAt ? new Date(data.updatedAt) : undefined
        };
      }) as Appointment[];
      
      // Client-side sorting eğer filter varsa
      if (filter?.doctorId || filter?.patientId) {
        appointments.sort((a, b) => b.date.getTime() - a.date.getTime());
      }
      
      callback(appointments);
    });
  }

  // UTILITY METHODS
  private parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }
}

// Singleton instance
export const appointmentService = new AppointmentService();
export default appointmentService; 