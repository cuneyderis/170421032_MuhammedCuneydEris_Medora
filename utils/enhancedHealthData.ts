import { googleFitService } from './googleFitService';
import { HealthData, ComprehensiveHealthData } from '../types/health';
import { healthAssessmentAI } from '../services/ai/healthAssessmentAI';

export class EnhancedHealthDataService {
  private static instance: EnhancedHealthDataService;
  
  public static getInstance(): EnhancedHealthDataService {
    if (!EnhancedHealthDataService.instance) {
      EnhancedHealthDataService.instance = new EnhancedHealthDataService();
    }
    return EnhancedHealthDataService.instance;
  }

  /**
   * Kapsamlı sağlık verisi topla ve AI analizine hazırla
   */
  async collectComprehensiveHealthData(userId: string): Promise<ComprehensiveHealthData> {
    try {
      console.log('🔍 Kapsamlı sağlık verisi toplanıyor...');
      
      // Temel sağlık verilerini al
      const basicHealthData = await this.getLatestHealthData(userId);
      
      // Kullanıcı profilini al
      const userProfile = await this.getUserProfile(userId);
      
      // Çevresel verileri al
      const environmentalData = await this.getEnvironmentalData();
      
      // EKG verilerini simüle et (gerçek uygulamada Samsung Watch'dan gelecek)
      const ecgData = await this.generateMockECGData();
      
      // Yaşam tarzı verilerini tahmin et
      const lifestyleData = this.estimateLifestyleFactors(basicHealthData, userProfile);
      
      // Kapsamlı veri yapısını oluştur
      const comprehensiveData: ComprehensiveHealthData = {
        ...basicHealthData,
        
        // Kullanıcı profili
        height: userProfile.height,
        bmi: this.calculateBMI(userProfile.height, basicHealthData.weight),
        
        // Vital signs (mock data)
        bodyTemperature: 36.5 + (Math.random() - 0.5), // 36-37°C
        oxygenSaturation: 95 + Math.random() * 5, // 95-100%
        respiratoryRate: 12 + Math.random() * 8, // 12-20/min
        
        // Blood metrics (mock - gerçekte lab sonuçlarından gelecek)
        cholesterol: {
          total: 180 + Math.random() * 60, // 180-240 mg/dL
          hdl: 40 + Math.random() * 20, // 40-60 mg/dL
          ldl: 100 + Math.random() * 40, // 100-140 mg/dL
          triglycerides: 100 + Math.random() * 50 // 100-150 mg/dL
        },
        glucose: 80 + Math.random() * 40, // 80-120 mg/dL
        hba1c: 5.0 + Math.random() * 1.5, // 5.0-6.5%
        
        // Lifestyle factors
        smokingStatus: lifestyleData.smoking,
        alcoholConsumption: lifestyleData.alcohol,
        physicalActivity: lifestyleData.activity,
        
        // ECG data
        ecgData,
        
        // Stress and mental health (mock)
        stressLevel: Math.floor(Math.random() * 10) + 1, // 1-10
        sleepQuality: Math.floor(Math.random() * 10) + 1, // 1-10
        moodScore: Math.floor(Math.random() * 10) + 1, // 1-10
        
        // Environmental
        weather: environmentalData
      };
      
      console.log('✅ Kapsamlı sağlık verisi toplandı');
      return comprehensiveData;
      
    } catch (error) {
      console.error('❌ Kapsamlı sağlık verisi toplama hatası:', error);
      throw error;
    }
  }

  /**
   * AI sağlık değerlendirmesi yap
   */
  async performAIHealthAssessment(userId: string): Promise<any> {
    try {
      console.log('🤖 AI sağlık değerlendirmesi başlatılıyor...');
      
      // Kapsamlı sağlık verisini topla
      const healthData = await this.collectComprehensiveHealthData(userId);
      
      // AI değerlendirmesini yap
      const assessment = await healthAssessmentAI.performHealthAssessment(userId, healthData);
      
      console.log('✅ AI sağlık değerlendirmesi tamamlandı:', {
        riskScore: assessment.overallRiskScore,
        alerts: assessment.priorityAlerts.length,
        actions: assessment.actionItems.length
      });
      
      return assessment;
      
    } catch (error) {
      console.error('❌ AI sağlık değerlendirmesi hatası:', error);
      throw error;
    }
  }

  /**
   * En son sağlık verilerini al
   */
  private async getLatestHealthData(userId: string): Promise<HealthData> {
    const healthDataList = await googleFitService.loadHealthData(userId, 1);
    
    if (healthDataList.length > 0) {
      return healthDataList[0];
    }
    
    // Fallback: demo data
    return {
      userId,
      timestamp: Date.now(),
      date: new Date().toISOString().split('T')[0],
      heartRate: 70 + Math.random() * 20,
      steps: 5000 + Math.random() * 5000,
      calories: 1500 + Math.random() * 500,
      distance: 3000 + Math.random() * 3000,
      weight: 70 + Math.random() * 20,
      bloodPressure: {
        systolic: 110 + Math.random() * 30,
        diastolic: 70 + Math.random() * 20
      },
      syncedAt: Date.now()
    };
  }

  /**
   * Kullanıcı profilini al (mock)
   */
  private async getUserProfile(userId: string): Promise<any> {
    // Gerçek uygulamada Firestore'dan gelecek
    return {
      age: 30 + Math.random() * 40, // 30-70 yaş
      gender: Math.random() > 0.5 ? 'male' : 'female',
      height: 160 + Math.random() * 25, // 160-185 cm
      medicalHistory: ['none'],
      medications: [],
      allergies: []
    };
  }

  /**
   * Çevresel verileri al (mock)
   */
  private async getEnvironmentalData(): Promise<any> {
    // Gerçek uygulamada hava durumu API'sinden gelecek
    return {
      temperature: 15 + Math.random() * 20, // 15-35°C
      humidity: 40 + Math.random() * 40, // 40-80%
      airQuality: 50 + Math.random() * 100 // AQI 50-150
    };
  }

  /**
   * Mock EKG verisi oluştur
   */
  private async generateMockECGData(): Promise<any> {
    // MIT-BIH formatında 187 data point
    const ecgSignal: number[] = [];
    
    for (let i = 0; i < 187; i++) {
      // Basit sinüs ritmi simülasyonu
      const t = (i / 187) * 2 * Math.PI * 3; // 3 kalp atışı
      let signal = 0;
      
      // P wave
      signal += 0.1 * Math.sin(t * 0.3) * Math.exp(-Math.pow((i % 60 - 10), 2) / 20);
      
      // QRS complex
      signal += 0.8 * Math.sin(t) * Math.exp(-Math.pow((i % 60 - 30), 2) / 10);
      
      // T wave
      signal += 0.2 * Math.sin(t * 0.5) * Math.exp(-Math.pow((i % 60 - 50), 2) / 30);
      
      // Noise
      signal += (Math.random() - 0.5) * 0.05;
      
      ecgSignal.push(signal);
    }
    
    return {
      rawSignal: ecgSignal,
      heartRateVariability: 20 + Math.random() * 30, // ms
      qrsInterval: 80 + Math.random() * 20, // ms
      qtInterval: 350 + Math.random() * 50, // ms
      prInterval: 120 + Math.random() * 40 // ms
    };
  }

  /**
   * Yaşam tarzı faktörlerini tahmin et
   */
  private estimateLifestyleFactors(healthData: HealthData, userProfile: any): any {
    // Adım sayısına göre aktivite seviyesi
    let activity: 'sedentary' | 'light' | 'moderate' | 'vigorous' = 'sedentary';
    if (healthData.steps) {
      if (healthData.steps > 10000) activity = 'vigorous';
      else if (healthData.steps > 7000) activity = 'moderate';
      else if (healthData.steps > 3000) activity = 'light';
    }
    
    // Yaşa göre sigara durumu (istatistiksel)
    let smoking: 'never' | 'former' | 'current' = 'never';
    if (userProfile.age > 40 && Math.random() < 0.3) smoking = 'former';
    else if (userProfile.age > 25 && Math.random() < 0.2) smoking = 'current';
    
    // Aktiviteye göre alkol tüketimi
    let alcohol: 'none' | 'light' | 'moderate' | 'heavy' = 'none';
    if (activity === 'moderate' || activity === 'vigorous') {
      if (Math.random() < 0.4) alcohol = 'light';
      if (Math.random() < 0.1) alcohol = 'moderate';
    }
    
    return { activity, smoking, alcohol };
  }

  /**
   * BMI hesapla
   */
  private calculateBMI(height?: number, weight?: number): number | undefined {
    if (!height || !weight) return undefined;
    return weight / ((height / 100) ** 2);
  }

  /**
   * Trend analizi yap
   */
  async analyzeTrends(userId: string, days: number = 30): Promise<any> {
    try {
      const healthDataList = await googleFitService.loadHealthData(userId, days);
      
      if (healthDataList.length < 7) {
        return { error: 'Insufficient data for trend analysis' };
      }
      
      // Trend hesaplamaları
      const heartRateTrend = this.calculateTrend(healthDataList.map(d => d.heartRate || 0));
      const stepsTrend = this.calculateTrend(healthDataList.map(d => d.steps || 0));
      const weightTrend = this.calculateTrend(healthDataList.map(d => d.weight || 0).filter(w => w > 0));
      
      return {
        heartRate: heartRateTrend,
        steps: stepsTrend,
        weight: weightTrend,
        period: `${days} gün`,
        dataPoints: healthDataList.length
      };
      
    } catch (error) {
      console.error('❌ Trend analizi hatası:', error);
      return { error: 'Trend analysis failed' };
    }
  }

  /**
   * Basit trend hesaplama
   */
  private calculateTrend(values: number[]): any {
    if (values.length < 2) return { trend: 'insufficient_data' };
    
    const validValues = values.filter(v => v > 0);
    if (validValues.length < 2) return { trend: 'insufficient_data' };
    
    const first = validValues.slice(0, Math.ceil(validValues.length / 3));
    const last = validValues.slice(-Math.ceil(validValues.length / 3));
    
    const firstAvg = first.reduce((sum, v) => sum + v, 0) / first.length;
    const lastAvg = last.reduce((sum, v) => sum + v, 0) / last.length;
    
    const change = ((lastAvg - firstAvg) / firstAvg) * 100;
    
    let trend: 'increasing' | 'stable' | 'decreasing';
    if (change > 5) trend = 'increasing';
    else if (change < -5) trend = 'decreasing';
    else trend = 'stable';
    
    return {
      trend,
      change: Math.round(change * 100) / 100,
      firstPeriodAvg: Math.round(firstAvg * 100) / 100,
      lastPeriodAvg: Math.round(lastAvg * 100) / 100
    };
  }
}

export const enhancedHealthData = EnhancedHealthDataService.getInstance(); 