export interface Doctor {
  id: string;
  uid?: string; // Authentication UID
  firstName?: string;
  lastName?: string;
  name?: string; // Fallback for combined name
  specialty?: string;
  specialization?: string; // Firebase'deki alan adı
  title?: string;
  hospital?: string;
  email: string;
  phone?: string;
  avatar?: string;
  image?: string; // Firebase'deki alan adı
  rating?: number;
  experience?: number; // yıl cinsinden
  licenseNumber?: string;
  department?: string;
  education?: string[];
  certifications?: string[];
  role?: string;
  workingHours?: {
    [key: string]: { // 'monday', 'tuesday', etc.
      start: string; // '09:00'
      end: string; // '17:00'
      isWorking: boolean;
    };
  };
  unavailableDates?: string[]; // ISO date strings
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  avatar?: string;
  medicalHistory?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Appointment {
  id: string;
  doctorId: string;
  patientId: string;
  date: Date; // randevu tarihi ve saati
  duration: number; // dakika cinsinden, varsayılan 30
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no-show';
  type: 'consultation' | 'follow-up' | 'emergency' | 'routine-check';
  notes?: string; // hasta notları
  doctorNotes?: string; // doktor notları
  symptoms?: string[];
  reason: string; // randevu sebebi
  // Hasta bilgileri
  patientName?: string;
  patientEmail?: string;
  patientPhone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeSlot {
  time: string; // '09:00', '09:30', etc.
  isAvailable: boolean;
  isBooked: boolean;
  appointmentId?: string;
}

export interface DaySchedule {
  date: string; // 'YYYY-MM-DD'
  dayOfWeek: string; // 'monday', 'tuesday', etc.
  isWorkingDay: boolean;
  timeSlots: TimeSlot[];
}

export interface AppointmentRequest {
  doctorId: string;
  patientId: string;
  date: Date;
  reason: string;
  symptoms?: string[];
  notes?: string;
  type: 'consultation' | 'follow-up' | 'emergency' | 'routine-check';
  // Hasta bilgileri
  patientName?: string;
  patientEmail?: string;
  patientPhone?: string;
}

export interface AppointmentFilter {
  doctorId?: string;
  patientId?: string;
  status?: Appointment['status'];
  type?: Appointment['type'];
  dateFrom?: Date;
  dateTo?: Date;
  specialty?: string;
}

// Randevu durumu için renkler
export const APPOINTMENT_STATUS_COLORS = {
  pending: '#f59e0b', // amber
  confirmed: '#10b981', // emerald
  cancelled: '#ef4444', // red
  completed: '#6366f1', // indigo
  'no-show': '#6b7280', // gray
} as const;

// Randevu tipi için renkler
export const APPOINTMENT_TYPE_COLORS = {
  consultation: '#3b82f6', // blue
  'follow-up': '#8b5cf6', // violet
  emergency: '#ef4444', // red
  'routine-check': '#10b981', // emerald
} as const; 