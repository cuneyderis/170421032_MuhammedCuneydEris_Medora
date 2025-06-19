import { HealthDataResponse } from './healthData';

// Mock sağlık verilerini oluştur
export const createMockHealthData = (): HealthDataResponse => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  // Son 30 gün için mock kalp atış hızı verileri
  const heartRateData = [];
  for (let i = 0; i < 30; i++) {
    const date = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
    // Günde 3-5 ölçüm
    const measurementsPerDay = Math.floor(Math.random() * 3) + 3;
    
    for (let j = 0; j < measurementsPerDay; j++) {
      const measurementTime = new Date(date);
      measurementTime.setHours(8 + j * 4 + Math.floor(Math.random() * 2));
      
      // Normal kalp atış hızı: 60-100 BPM, bazı varyasyonlar
      let heartRate = 65 + Math.floor(Math.random() * 30);
      
      // Egzersiz sonrası yüksek değerler ekle
      if (Math.random() < 0.1) {
        heartRate = 110 + Math.floor(Math.random() * 30);
      }
      
      heartRateData.push({
        value: heartRate,
        startDate: measurementTime.toISOString(),
        endDate: measurementTime.toISOString(),
      });
    }
  }

  // Son 30 gün için mock kan basıncı verileri
  const bloodPressureData = [];
  for (let i = 0; i < 20; i++) {
    const date = new Date(thirtyDaysAgo.getTime() + i * 1.5 * 24 * 60 * 60 * 1000);
    date.setHours(9 + Math.floor(Math.random() * 8));
    
    // Normal kan basıncı: 110-130/70-85 mmHg
    const systolic = 110 + Math.floor(Math.random() * 25);
    const diastolic = 70 + Math.floor(Math.random() * 18);
    
    bloodPressureData.push({
      systolic,
      diastolic,
      startDate: date.toISOString(),
      endDate: date.toISOString(),
    });
  }

  // Son 30 gün için mock kilo verileri
  const weightData = [];
  let baseWeight = 70 + Math.floor(Math.random() * 20); // 70-90 kg arası
  
  for (let i = 0; i < 15; i++) {
    const date = new Date(thirtyDaysAgo.getTime() + i * 2 * 24 * 60 * 60 * 1000);
    date.setHours(7 + Math.floor(Math.random() * 2));
    
    // Kilo hafif dalgalanmalar gösterir
    const weightVariation = (Math.random() - 0.5) * 2; // ±1 kg
    const currentWeight = baseWeight + weightVariation;
    
    weightData.push({
      value: Math.round(currentWeight * 10) / 10, // 1 ondalık haneli
      startDate: date.toISOString(),
      endDate: date.toISOString(),
    });
    
    // Trend oluştur (hafif kilo kaybı veya artışı)
    baseWeight += (Math.random() - 0.5) * 0.1;
  }

  // Boy verisi (genellikle sabit)
  const heightData = [];
  const baseHeight = 1.65 + Math.random() * 0.25; // 1.65-1.90 m arası
  
  for (let i = 0; i < 3; i++) {
    const date = new Date(thirtyDaysAgo.getTime() + i * 10 * 24 * 60 * 60 * 1000);
    
    heightData.push({
      value: Math.round(baseHeight * 1000) / 1000, // 3 ondalık haneli
      startDate: date.toISOString(),
      endDate: date.toISOString(),
    });
  }

  // Adım verileri (günlük)
  const stepsData = [];
  for (let i = 0; i < 30; i++) {
    const date = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    
    // Hafta içi daha fazla adım
    const baseSteps = isWeekend ? 5000 + Math.floor(Math.random() * 4000) : 7000 + Math.floor(Math.random() * 6000);
    
    stepsData.push({
      value: baseSteps,
      startDate: date.toISOString(),
      endDate: date.toISOString(),
    });
  }

  // Uyku verileri
  const sleepData = [];
  const sleepQualities = ['poor', 'fair', 'good', 'excellent'] as const;
  for (let i = 0; i < 30; i++) {
    const date = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
    date.setHours(22 + Math.floor(Math.random() * 3)); // 22:00-01:00 arası yatış
    
    const endDate = new Date(date);
    endDate.setHours(6 + Math.floor(Math.random() * 3)); // 06:00-09:00 arası kalkış
    endDate.setDate(endDate.getDate() + 1);
    
    // 5-10 saat arası uyku
    const sleepHours = 5 + Math.random() * 5;
    const sleepMinutes = sleepHours * 60;
    
    // Uyku kalitesi - genellikle iyi olsun
    const qualityIndex = Math.floor(Math.random() * sleepQualities.length);
    const quality = sleepQualities[qualityIndex];
    
    sleepData.push({
      duration: Math.round(sleepMinutes),
      quality,
      startDate: date.toISOString(),
      endDate: endDate.toISOString(),
    });
  }

  // Kalori yakma verileri (günlük)
  const caloriesData = [];
  for (let i = 0; i < 30; i++) {
    const date = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
    
    // Bazal metabolizma + aktivite: 1800-3000 kalori arası
    const calories = 1800 + Math.floor(Math.random() * 1200);
    
    caloriesData.push({
      value: calories,
      startDate: date.toISOString(),
      endDate: date.toISOString(),
    });
  }

  // Su tüketimi verileri (günlük)
  const waterIntakeData = [];
  for (let i = 0; i < 30; i++) {
    const date = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
    
    // Günde 1.5-3.5 litre su tüketimi
    const waterML = 1500 + Math.floor(Math.random() * 2000);
    
    waterIntakeData.push({
      volume: waterML,
      startDate: date.toISOString(),
      endDate: date.toISOString(),
    });
  }

  // Egzersiz verileri
  const exerciseData = [];
  const exerciseTypes = ['Koşu', 'Yürüyüş', 'Bisiklet', 'Yüzme', 'Fitness', 'Yoga', 'Futbol', 'Basketbol'];
  
  // Haftada 3-5 kez egzersiz
  for (let i = 0; i < 30; i++) {
    if (Math.random() < 0.5) { // %50 şans ile egzersiz
      const date = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
      date.setHours(17 + Math.floor(Math.random() * 4)); // 17:00-21:00 arası
      
      const exerciseType = exerciseTypes[Math.floor(Math.random() * exerciseTypes.length)];
      const duration = 20 + Math.floor(Math.random() * 80); // 20-100 dakika
      const calories = duration * (3 + Math.random() * 7); // Dakika başına 3-10 kalori
      
      const endDate = new Date(date);
      endDate.setMinutes(endDate.getMinutes() + duration);
      
      exerciseData.push({
        duration,
        type: exerciseType,
        calories: Math.round(calories),
        startDate: date.toISOString(),
        endDate: endDate.toISOString(),
      });
    }
  }

  return {
    heartRate: heartRateData,
    bloodPressure: bloodPressureData,
    bodyMetrics: {
      weight: weightData,
      height: heightData,
    },
    activityData: {
      steps: stepsData,
      sleep: sleepData,
      calories: caloriesData,
      waterIntake: waterIntakeData,
      exercises: exerciseData,
    },
  };
};

// Mock verilerle birlikte başarılı response
export const mockFetchHealthData = async (): Promise<{ success: boolean; data?: HealthDataResponse; message?: string }> => {
  // API çağrısını simüle et
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
  
  // %90 başarı oranı
  if (Math.random() < 0.9) {
    return {
      success: true,
      data: createMockHealthData()
    };
  } else {
    return {
      success: false,
      message: 'Veriler alınırken bir hata oluştu. Lütfen tekrar deneyin.'
    };
  }
};

// Google Fit bağlantısını simüle et
export const mockConnectGoogleFit = async (): Promise<{ success: boolean; message?: string }> => {
  // Bağlantı sürecini simüle et
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));
  
  // %95 başarı oranı
  if (Math.random() < 0.95) {
    return {
      success: true,
      message: 'Google Fit\'e başarıyla bağlandı!'
    };
  } else {
    return {
      success: false,
      message: 'Google Fit bağlantısı kurulamadı. İnternet bağlantınızı kontrol edin.'
    };
  }
}; 