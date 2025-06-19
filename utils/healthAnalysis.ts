/**
 * Sağlık verilerinin analizi için yardımcı fonksiyonlar
 */

// Yaşa ve cinsiyete göre normal kalp atış hızı aralıkları
interface HeartRateRange {
  min: number;
  max: number;
}

interface AgeRanges {
  [key: string]: HeartRateRange;
}

// Yetişkinler için istirahatte normal kalp atış hızı
const adultRestingHeartRate: HeartRateRange = {
  min: 60,
  max: 100,
};

// Taşikardi tespiti (kalp atış hızı > 100)
export const detectTachycardia = (heartRateBpm: number): boolean => {
  return heartRateBpm > 100;
};

// Bradikardi tespiti (kalp atış hızı < 60)
export const detectBradycardia = (heartRateBpm: number): boolean => {
  return heartRateBpm < 60;
};

// Kalp atış hızı anormallik tespiti
export const analyzeHeartRate = (heartRateBpm: number): {
  status: 'normal' | 'tachycardia' | 'bradycardia';
  message: string;
} => {
  if (detectTachycardia(heartRateBpm)) {
    return {
      status: 'tachycardia',
      message: 'Taşikardi: Kalp atış hızınız normalden yüksek.',
    };
  }

  if (detectBradycardia(heartRateBpm)) {
    return {
      status: 'bradycardia',
      message: 'Bradikardi: Kalp atış hızınız normalden düşük.',
    };
  }

  return {
    status: 'normal',
    message: 'Normal: Kalp atış hızınız normal aralıkta.',
  };
};

// Hipertansiyon tespiti
export const analyzeBloodPressure = (
  systolic: number,
  diastolic: number
): {
  status: 'normal' | 'elevated' | 'hypertension_1' | 'hypertension_2' | 'hypertensive_crisis';
  message: string;
} => {
  // Amerikan Kalp Derneği (AHA) sınıflandırması
  if (systolic < 120 && diastolic < 80) {
    return {
      status: 'normal',
      message: 'Normal kan basıncı.',
    };
  }

  if ((systolic >= 120 && systolic <= 129) && diastolic < 80) {
    return {
      status: 'elevated',
      message: 'Yüksek kan basıncı: Kan basıncınız normalin üstünde.',
    };
  }

  if ((systolic >= 130 && systolic <= 139) || (diastolic >= 80 && diastolic <= 89)) {
    return {
      status: 'hypertension_1',
      message: 'Hipertansiyon Aşama 1: Kan basıncınız yüksek.',
    };
  }

  if (systolic >= 140 || diastolic >= 90) {
    return {
      status: 'hypertension_2',
      message: 'Hipertansiyon Aşama 2: Kan basıncınız çok yüksek.',
    };
  }

  if (systolic > 180 || diastolic > 120) {
    return {
      status: 'hypertensive_crisis',
      message: 'Hipertansif Kriz: Acil tıbbi yardım gerekebilir!',
    };
  }

  return {
    status: 'normal',
    message: 'Kan basıncı analizi yapılamadı.',
  };
};

// Vücut kitle indeksi (BMI) hesaplama
export const calculateBMI = (weightKg: number, heightCm: number): number => {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
};

// BMI sınıflandırma
export const analyzeBMI = (bmi: number): {
  status: 'underweight' | 'normal' | 'overweight' | 'obese';
  message: string;
} => {
  if (bmi < 18.5) {
    return {
      status: 'underweight',
      message: 'Düşük Kilo: BMI değeriniz normalin altında.',
    };
  }

  if (bmi >= 18.5 && bmi < 25) {
    return {
      status: 'normal',
      message: 'Normal Kilo: BMI değeriniz normal aralıkta.',
    };
  }

  if (bmi >= 25 && bmi < 30) {
    return {
      status: 'overweight',
      message: 'Fazla Kilo: BMI değeriniz normalin üstünde.',
    };
  }

  return {
    status: 'obese',
    message: 'Obezite: BMI değeriniz çok yüksek.',
  };
};

// Matematiksel yardımcı fonksiyonlar
const calculateMean = (data: number[]): number => {
  return data.reduce((sum, value) => sum + value, 0) / data.length;
};

const calculateStandardDeviation = (data: number[]): number => {
  const mean = calculateMean(data);
  const variance = data.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / data.length;
  return Math.sqrt(variance);
};

// Anomali tespit fonksiyonları
export interface AnomalyDetectionResult {
  isAnomaly: boolean;
  confidence: number;
  message: string;
}

// Z-Score temelli anomali tespiti (TensorFlow.js olmadan)
export const detectAnomalyWithZScore = (
  data: number[], 
  threshold = 2.0
): AnomalyDetectionResult[] => {
  if (data.length < 2) {
    return [{ 
      isAnomaly: false, 
      confidence: 0, 
      message: 'Yetersiz veri: Anomali tespiti için en az 2 veri noktası gereklidir.' 
    }];
  }

  try {
    const mean = calculateMean(data);
    const std = calculateStandardDeviation(data);
    
    // Her veri noktası için Z-score hesapla ve anomali kontrolü yap
    return data.map(value => {
      const zScore = std > 0 ? Math.abs((value - mean) / std) : 0;
      const isAnomaly = zScore > threshold;
      const confidence = Math.min(zScore / (threshold * 2), 1) * 100;
      
      return {
        isAnomaly,
        confidence,
        message: isAnomaly 
          ? `Anomali tespit edildi (güven: %${confidence.toFixed(1)})` 
          : 'Normal değer',
      };
    });
  } catch (error) {
    console.error('Anomali tespiti sırasında hata:', error);
    return [{ 
      isAnomaly: false, 
      confidence: 0, 
      message: 'Anomali analizi sırasında bir hata oluştu.' 
    }];
  }
};

// Kalp atış hızı verilerinde anomali tespiti
export const detectHeartRateAnomalies = (
  heartRates: number[]
): AnomalyDetectionResult[] => {
  return detectAnomalyWithZScore(heartRates, 2.5);
};

// Kan basıncı verilerinde anomali tespiti
export const detectBloodPressureAnomalies = (
  systolicValues: number[],
  diastolicValues: number[]
): {
  systolic: AnomalyDetectionResult[],
  diastolic: AnomalyDetectionResult[]
} => {
  return {
    systolic: detectAnomalyWithZScore(systolicValues, 2.5),
    diastolic: detectAnomalyWithZScore(diastolicValues, 2.5)
  };
};

// Trend analizi
export interface TrendAnalysisResult {
  trend: 'increasing' | 'decreasing' | 'stable' | 'fluctuating';
  changeRate: number; // Yüzde olarak değişim
  message: string;
}

// Linear regresyon hesaplama (basit yöntem)
const calculateLinearRegression = (data: number[]): { slope: number; intercept: number } => {
  const n = data.length;
  const x = Array.from({ length: n }, (_, i) => i);
  
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = data.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * data[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return { slope, intercept };
};

// Verilen sayı dizisindeki trendi analiz eder
export const analyzeTrend = (data: number[]): TrendAnalysisResult => {
  if (data.length < 3) {
    return {
      trend: 'stable',
      changeRate: 0,
      message: 'Trend analizi için yetersiz veri.'
    };
  }

  try {
    const { slope } = calculateLinearRegression(data);
    
    // Toplam değişim yüzdesi hesapla
    const firstValue = data[0];
    const lastValue = data[data.length - 1];
    const changeRate = firstValue !== 0 ? ((lastValue - firstValue) / Math.abs(firstValue)) * 100 : 0;
    
    // Değişkenlik katsayısını hesapla
    const mean = calculateMean(data);
    const std = calculateStandardDeviation(data);
    const variabilityCoeff = mean !== 0 ? (std / Math.abs(mean)) * 100 : 0;
    
    // Trend belirle
    let trend: 'increasing' | 'decreasing' | 'stable' | 'fluctuating';
    let message: string;
    
    if (variabilityCoeff > 20) {
      trend = 'fluctuating';
      message = 'Değerlerinizde dalgalanma görülüyor.';
    } else if (Math.abs(changeRate) < 5) {
      trend = 'stable';
      message = 'Değerleriniz kararlı bir seyir izliyor.';
    } else if (slope > 0 || changeRate > 0) {
      trend = 'increasing';
      message = `Değerlerinizde %${Math.abs(changeRate).toFixed(1)} oranında artış görülüyor.`;
    } else {
      trend = 'decreasing';
      message = `Değerlerinizde %${Math.abs(changeRate).toFixed(1)} oranında azalma görülüyor.`;
    }
    
    return {
      trend,
      changeRate,
      message
    };
  } catch (error) {
    console.error('Trend analizi sırasında hata:', error);
    return {
      trend: 'stable',
      changeRate: 0,
      message: 'Trend analizi yapılamadı.'
    };
  }
};

// Yeni sağlık metriklerinin analiz fonksiyonları

// Adım analizi
export const analyzeSteps = (dailySteps: number): {
  status: 'low' | 'moderate' | 'good' | 'excellent';
  message: string;
} => {
  if (dailySteps < 5000) {
    return {
      status: 'low',
      message: 'Düşük aktivite: Daha fazla yürümeye çalışın.'
    };
  } else if (dailySteps < 8000) {
    return {
      status: 'moderate',
      message: 'Orta düzey aktivite: İyi gidiyorsunuz!'
    };
  } else if (dailySteps < 12000) {
    return {
      status: 'good',
      message: 'İyi aktivite: Günlük hedefe yaklaşıyorsunuz.'
    };
  } else {
    return {
      status: 'excellent',
      message: 'Mükemmel aktivite: Günlük hedefi aştınız!'
    };
  }
};

// Uyku analizi
export const analyzeSleep = (sleepDurationMinutes: number, quality?: string): {
  status: 'poor' | 'insufficient' | 'good' | 'excellent';
  message: string;
} => {
  const sleepHours = sleepDurationMinutes / 60;
  
  if (sleepHours < 6) {
    return {
      status: 'poor',
      message: 'Yetersiz uyku: En az 7-8 saat uyumaya çalışın.'
    };
  } else if (sleepHours < 7) {
    return {
      status: 'insufficient',
      message: 'Az uyku: Biraz daha uzun uyumanız önerilir.'
    };
  } else if (sleepHours <= 9) {
    return {
      status: 'good',
      message: 'İyi uyku: Kaliteli dinlenme süresi.'
    };
  } else {
    return {
      status: 'excellent',
      message: 'Uzun uyku: Çok iyi dinlenmişsiniz.'
    };
  }
};

// Su tüketimi analizi
export const analyzeWaterIntake = (dailyWaterML: number): {
  status: 'low' | 'moderate' | 'good' | 'excellent';
  message: string;
} => {
  if (dailyWaterML < 1500) {
    return {
      status: 'low',
      message: 'Az su içimi: Daha fazla su içmeye çalışın.'
    };
  } else if (dailyWaterML < 2000) {
    return {
      status: 'moderate',
      message: 'Orta su tüketimi: İyi gidiyorsunuz.'
    };
  } else if (dailyWaterML < 3000) {
    return {
      status: 'good',
      message: 'İyi su tüketimi: Günlük hedefinize yaklaştınız.'
    };
  } else {
    return {
      status: 'excellent',
      message: 'Mükemmel hidrasyon: Çok iyi su içiyorsunuz!'
    };
  }
};

// Kalori analizi
export const analyzeCalories = (dailyCalories: number, userAge: number = 30, userGender: 'male' | 'female' = 'male'): {
  status: 'low' | 'normal' | 'high' | 'excessive';
  message: string;
} => {
  // Bazal metabolik hız tahmini (Harris-Benedict)
  const baseCalories = userGender === 'male' ? 1800 : 1500;
  
  if (dailyCalories < baseCalories * 0.8) {
    return {
      status: 'low',
      message: 'Düşük kalori: Yeterli beslenmeye dikkat edin.'
    };
  } else if (dailyCalories < baseCalories * 1.2) {
    return {
      status: 'normal',
      message: 'Normal kalori tüketimi: Dengeli besleniyorsunuz.'
    };
  } else if (dailyCalories < baseCalories * 1.5) {
    return {
      status: 'high',
      message: 'Yüksek kalori: Aktif bir gününüz var.'
    };
  } else {
    return {
      status: 'excessive',
      message: 'Çok yüksek kalori: Kalori alımını kontrol etmeyi düşünün.'
    };
  }
};

// Egzersiz analizi
export const analyzeExerciseWeekly = (weeklyMinutes: number): {
  status: 'inactive' | 'low' | 'moderate' | 'active' | 'very_active';
  message: string;
} => {
  if (weeklyMinutes < 60) {
    return {
      status: 'inactive',
      message: 'Hareketsiz: Haftada en az 150 dakika egzersiz önerilir.'
    };
  } else if (weeklyMinutes < 150) {
    return {
      status: 'low',
      message: 'Az aktif: Egzersiz sürenizi artırmaya çalışın.'
    };
  } else if (weeklyMinutes < 300) {
    return {
      status: 'moderate',
      message: 'Orta aktif: WHO önerilerine uyuyorsunuz.'
    };
  } else if (weeklyMinutes < 500) {
    return {
      status: 'active',
      message: 'Aktif: Çok iyi egzersiz rutininiz var.'
    };
  } else {
    return {
      status: 'very_active',
      message: 'Çok aktif: Mükemmel egzersiz düzeyi!'
    };
  }
}; 