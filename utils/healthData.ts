import GoogleFit, { 
  BucketUnit, 
  Scopes,
} from 'react-native-google-fit';

// Export types (also used by the mock implementation)
export type HeartRateResponse = {
  startDate: string;
  endDate: string;
  value: number;
  dataSources?: string[];
};

export type BloodPressureResponse = {
  startDate: string;
  endDate: string;
  systolic: number;
  diastolic: number;
};

export type WeightResponse = {
  startDate: string;
  endDate: string;
  value: number;
};

export type ActivityResponse = {
  startDate: string;
  endDate: string;
  value: number;
};

export type SleepResponse = {
  startDate: string;
  endDate: string;
  duration: number; // dakika cinsinden
  quality?: 'poor' | 'fair' | 'good' | 'excellent';
};

export type WaterIntakeResponse = {
  startDate: string;
  endDate: string;
  volume: number; // ml cinsinden
};

export type ExerciseResponse = {
  startDate: string;
  endDate: string;
  duration: number; // dakika cinsinden
  type: string;
  calories?: number;
};

export interface HealthDataResponse {
  heartRate: HeartRateResponse[];
  bloodPressure: BloodPressureResponse[];
  bodyMetrics: {
    weight: WeightResponse[];
    height: WeightResponse[];
  };
  activityData: {
    steps: ActivityResponse[];
    sleep: SleepResponse[];
    calories: ActivityResponse[];
    waterIntake: WaterIntakeResponse[];
    exercises: ExerciseResponse[];
  };
}

/**
 * Google Fit'e bağlanma
 */
export const connectGoogleFit = async (): Promise<{ success: boolean; message?: string }> => {
  try {
    // TODO: Google Cloud Console'dan aldığınız OAuth Client ID'yi buraya ekleyin
    const CLIENT_ID = '961841426928-osptg1n236isl1rbj5gfv21aj2kd4ggv.apps.googleusercontent.com';
    
    const options = {
      scopes: [
        Scopes.FITNESS_ACTIVITY_READ,
        Scopes.FITNESS_BODY_READ,
        Scopes.FITNESS_HEART_RATE_READ,
        Scopes.FITNESS_BLOOD_PRESSURE_READ,
      ],
      // OAuth Client ID'yi ekleyin (Google Cloud Console'dan alacaksınız)
      clientId: CLIENT_ID,
    };

    console.log('Google Fit bağlantısı başlatılıyor...');
    console.log('Client ID:', CLIENT_ID);
    
    const authResult = await GoogleFit.authorize(options);
    console.log('Google Fit auth result:', authResult);
    
    if (authResult.success) {
      console.log('Google Fit bağlantısı başarılı!');
      return { success: true };
    } else {
      console.log('Google Fit bağlantısı başarısız:', authResult.message);
      return { 
        success: false, 
        message: authResult.message || 'Yetkilendirme başarısız oldu. Google Cloud Console ayarlarını kontrol edin.' 
      };
    }
  } catch (error) {
    console.error('Google Fit bağlantı hatası:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu. Google Cloud Console ayarlarını kontrol edin.' 
    };
  }
};

/**
 * Kalp hızı verilerini getir
 */
export const fetchHeartRateData = async (
  startDate: string, 
  endDate: string
): Promise<HeartRateResponse[]> => {
  try {
    const options = {
      startDate: startDate,
      endDate: endDate,
      bucketUnit: BucketUnit.DAY,
      bucketInterval: 1,
    };

    const heartRateResponse = await GoogleFit.getHeartRateSamples(options);
    
    // Google Fit'ten gelen verileri bizim formatımıza dönüştür
    return heartRateResponse.map(item => ({
      startDate: new Date(item.startDate).toISOString(),
      endDate: new Date(item.endDate).toISOString(),
      value: item.value,
    }));
  } catch (error) {
    console.error('Kalp hızı verileri alınamadı:', error);
    return [];
  }
};

/**
 * Kan basıncı verilerini getir
 */
export const fetchBloodPressureData = async (
  startDate: string,
  endDate: string
): Promise<BloodPressureResponse[]> => {
  try {
    const options = {
      startDate: startDate,
      endDate: endDate,
      bucketUnit: BucketUnit.DAY,
      bucketInterval: 1,
    };

    const bloodPressureData = await GoogleFit.getBloodPressureSamples(options);
    
    // Google Fit'ten gelen verileri bizim formatımıza dönüştür
    return bloodPressureData.map(item => ({
      startDate: new Date(item.startDate).toISOString(),
      endDate: new Date(item.endDate).toISOString(),
      systolic: item.systolic,
      diastolic: item.diastolic,
    }));
  } catch (error) {
    console.error('Kan basıncı verileri alınamadı:', error);
    return [];
  }
};

/**
 * Kilo verilerini getir
 */
export const fetchWeightData = async (
  startDate: string,
  endDate: string
): Promise<WeightResponse[]> => {
  try {
    const options = {
      startDate: startDate,
      endDate: endDate,
      bucketUnit: BucketUnit.DAY,
      bucketInterval: 1,
    };

    const weightData = await GoogleFit.getWeightSamples(options);
    
    // Google Fit'ten gelen verileri bizim formatımıza dönüştür
    return weightData.map(item => ({
      startDate: new Date(item.startDate).toISOString(),
      endDate: new Date(item.endDate).toISOString(),
      value: item.value,
    }));
  } catch (error) {
    console.error('Kilo verileri alınamadı:', error);
    return [];
  }
};

/**
 * Boy verilerini getir
 */
export const fetchHeightData = async (
  startDate: string,
  endDate: string
): Promise<WeightResponse[]> => {
  try {
    const options = {
      startDate: startDate,
      endDate: endDate,
    };

    const heightData = await GoogleFit.getHeightSamples(options);
    
    // Google Fit'ten gelen verileri bizim formatımıza dönüştür
    return heightData.map(item => ({
      startDate: new Date(item.startDate).toISOString(),
      endDate: new Date(item.endDate).toISOString(),
      value: item.value,
    }));
  } catch (error) {
    console.error('Boy verileri alınamadı:', error);
    return [];
  }
};

/**
 * Tüm sağlık verilerini getir
 */
export const fetchAllHealthData = async (
  startDate: string,
  endDate: string
): Promise<{
  success: boolean;
  message?: string;
  data?: HealthDataResponse;
}> => {
  try {
    // Google Fit bağlantısını kontrol et
    const isConnected = await GoogleFit.isAuthorized;
    
    if (!isConnected) {
      return { success: false, message: 'Google Fit bağlantısı kurulmadı' };
    }
    
    // Paralel olarak tüm verileri çek
    const [heartRateData, bloodPressureData, weightData, heightData] = await Promise.all([
      fetchHeartRateData(startDate, endDate),
      fetchBloodPressureData(startDate, endDate),
      fetchWeightData(startDate, endDate),
      fetchHeightData(startDate, endDate),
    ]);
    
    return {
      success: true,
      data: {
        heartRate: heartRateData,
        bloodPressure: bloodPressureData,
        bodyMetrics: {
          weight: weightData,
          height: heightData,
        },
        activityData: {
          steps: [],
          sleep: [],
          calories: [],
          waterIntake: [],
          exercises: [],
        },
      },
    };
  } catch (error) {
    console.error('Sağlık verileri alınamadı:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Sağlık verileri alınırken bir hata oluştu',
    };
  }
}; 