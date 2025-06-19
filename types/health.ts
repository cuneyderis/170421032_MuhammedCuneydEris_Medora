// Health data types adapted from main project
export interface HeartRateData {
  value: number;
  timestamp: string;
  status?: 'normal' | 'tachycardia' | 'bradycardia';
}

export interface BloodPressureData {
  systolic: number;
  diastolic: number;
  timestamp: string;
  status?: 'normal' | 'elevated' | 'hypertension_1' | 'hypertension_2';
}

export interface SleepData {
  duration: number; // minutes
  quality?: 'poor' | 'fair' | 'good' | 'excellent';
  timestamp: string;
}

export interface ActivityData {
  steps: number;
  calories: number;
  distance?: number;
  timestamp: string;
}

export interface HealthMetrics {
  heartRate?: HeartRateData[];
  bloodPressure?: BloodPressureData[];
  sleep?: SleepData[];
  activity?: ActivityData[];
  weight?: number;
  height?: number;
  age?: number;
  gender?: 'male' | 'female' | 'other';
}

export interface UserProfile {
  age: number;
  gender: 'male' | 'female' | 'other';
  weight?: number;
  height?: number;
  medicalHistory?: string[];
  currentMedications?: string[];
  allergies?: string[];
}

export interface HealthContext {
  vitals?: {
    heartRate?: number;
    bloodPressure?: {
      systolic: number;
      diastolic: number;
    };
    temperature?: number;
    weight?: number;
    height?: number;
  };
  symptoms?: Array<{
    name: string;
    severity: number;
    duration?: string;
  }>;
  activities?: Array<{
    type: string;
    duration: number;
    calories?: number;
    intensity?: 'low' | 'medium' | 'high';
  }>;  demographics?: {
    age: number;
    gender?: string;
    medicalHistory?: string[];
    conditions?: string[];
    medications?: string[];
  };
  userProfile?: UserProfile;
  currentMetrics?: HealthMetrics;
  timeframe?: '24h' | '7d' | '30d';
}

export interface AIHealthResponse {
  insights: string[];
  recommendations: string[];
  alerts: string[];
  riskLevel: 'low' | 'medium' | 'high';
  actionItems?: string[];
  riskAssessment?: {
    level: 'low' | 'moderate' | 'high';
    factors: string[];
  };
  confidence: number; // 0-1
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  context?: HealthContext;
}

// Google Fit / Samsung Health data structure
export interface HealthData {
  id?: string; // Firestore document ID
  userId: string;
  timestamp: number;
  date: string; // YYYY-MM-DD format
  heartRate?: number;
  steps?: number;
  calories?: number;
  distance?: number; // in meters
  weight?: number; // in kg
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  sleep?: {
    duration: number; // in minutes
    quality?: 'poor' | 'fair' | 'good' | 'excellent';
  };
  syncedAt: number; // timestamp when synced
}

// Expanded health data for AI models
export interface ComprehensiveHealthData extends HealthData {
  // Vital signs
  bodyTemperature?: number;
  oxygenSaturation?: number; // SpO2
  respiratoryRate?: number;
  
  // Body composition
  height?: number; // in cm
  bmi?: number;
  bodyFat?: number; // percentage
  muscleMass?: number; // in kg
  
  // Blood metrics
  cholesterol?: {
    total?: number;
    hdl?: number;
    ldl?: number;
    triglycerides?: number;
  };
  glucose?: number; // mg/dL
  hba1c?: number; // percentage
  
  // Lifestyle factors
  smokingStatus?: 'never' | 'former' | 'current';
  alcoholConsumption?: 'none' | 'light' | 'moderate' | 'heavy';
  physicalActivity?: 'sedentary' | 'light' | 'moderate' | 'vigorous';
  
  // ECG data
  ecgData?: {
    rawSignal?: number[]; // 187 data points for MIT-BIH
    heartRateVariability?: number;
    qrsInterval?: number;
    qtInterval?: number;
    prInterval?: number;
  };
  
  // Stress and mental health
  stressLevel?: number; // 1-10 scale
  sleepQuality?: number; // 1-10 scale
  moodScore?: number; // 1-10 scale
  
  // Environmental factors
  weather?: {
    temperature?: number;
    humidity?: number;
    airQuality?: number;
  };
}

// AI Model Predictions
export interface CardiovascularRiskPrediction {
  riskScore: number; // 0-1 probability
  riskLevel: 'low' | 'moderate' | 'high' | 'very_high';
  confidence: number; // 0-1
  factors: {
    age: number;
    gender: number;
    bmi: number;
    bloodPressure: number;
    lifestyle: number;
    metabolic: number;
  };
  recommendations: string[];
  timestamp: number;
}

export interface ECGAnalysisPrediction {
  classification: 'Normal' | 'Supraventricular' | 'Ventricular' | 'Fusion' | 'Unknown';
  confidence: number; // 0-1
  anomalyScore: number; // 0-1
  features: {
    heartRate: number;
    rhythm: string;
    morphology: string;
  };
  recommendations: string[];
  timestamp: number;
}

// EKG Model Weights structure
export interface EKGLayerWeights {
  kernel: number[][][];
  bias: number[];
}

export interface EKGWeights {
  weights: {
    conv1d: EKGLayerWeights;
    conv1d_1: EKGLayerWeights;
    conv1d_2: EKGLayerWeights;
    dense: EKGLayerWeights;
    dense_1: EKGLayerWeights;
  };
  scaler: {
    mean: number[];
    scale: number[];
  };
  metadata: {
    input_shape: number[];
    output_classes: number;
    model_type: string;
    classes: Record<number, string>;
  };
}

export interface AIHealthAssessment {
  id?: string; // Firestore document ID
  userId: string;
  timestamp: number;
  date: string;
  cardiovascularRisk?: CardiovascularRiskPrediction;
  ecgAnalysis?: ECGAnalysisPrediction;
  overallRiskScore: number; // Combined risk 0-1
  priorityAlerts: string[];
  actionItems: string[];
  nextAssessmentDate: string;
}