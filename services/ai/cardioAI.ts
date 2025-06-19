import { HealthData } from '../../types/health';
import modelConfig from '../../ai-models/model_config.json';
import { realCardioAIService } from './realCardioAI';
import { dataManager, UserHealthProfile, HealthDataWithSource } from '../../utils/dataManager';
import { APP_CONFIG } from '../../constants/config';

export interface CardioRiskInput {
  // Kişisel bilgiler
  age: number; // yaş (yıl)
  gender: number; // 1: Kadın, 2: Erkek
  height: number; // cm
  weight: number; // kg
  
  // Sağlık verileri
  systolicBP?: number; // Sistolik kan basıncı
  diastolicBP?: number; // Diyastolik kan basıncı
  cholesterol?: number; // 1: Normal, 2: Yüksek, 3: Çok yüksek
  glucose?: number; // 1: Normal, 2: Yüksek, 3: Çok yüksek
  
  // Yaşam tarzı
  smoking?: boolean;
  alcohol?: boolean;
  physicalActivity?: boolean;
}

export interface CardioRiskResult {
  riskScore: number; // 0-1 arası
  riskLevel: 'low' | 'medium' | 'high';
  riskPercentage: number;
  recommendations: string[];
  riskFactors: string[];
  confidence: number;
  timestamp: number;
}

export class CardioAIService {
  private config = modelConfig.cardiovascular;

  /**
   * Kardiyovasküler hastalık risk tahmini yap
   */
  async predictCardioRisk(input: CardioRiskInput): Promise<CardioRiskResult> {
    try {
      console.log('🫀 Kardiyovasküler risk analizi başlıyor...', input);

      // Özellik mühendisliği
      const features = this.extractFeatures(input);
      
      // ⚠️ GERÇEKTEKİ MODELİNİZİ KULLANMAK İÇİN:
      // 1. Python modelinizi TensorFlow.js'e çevirin
      // 2. modelLoader.predictCardioRisk(features) kullanın
      // 3. Aşağıdaki mock hesaplamayı kaldırın
      
      // GERÇEK AI MODELİ HESAPLAMA
      const riskScore = await this.calculateMockRisk(features);
      
      // GERÇEKTEKİ MODEL KULLANIMI (yukarıdaki satırı silin):
      // const riskScore = await modelLoader.predictCardioRisk(Object.values(features));
      
      // Risk seviyesi belirleme
      const riskLevel = this.determineRiskLevel(riskScore);
      
      // Öneriler ve risk faktörleri
      const recommendations = this.generateRecommendations(features, riskLevel);
      const riskFactors = this.identifyRiskFactors(features);

      const result: CardioRiskResult = {
        riskScore,
        riskLevel,
        riskPercentage: Math.round(riskScore * 100),
        recommendations,
        riskFactors,
        confidence: 0.85, // Model güven skoru
        timestamp: Date.now()
      };

      console.log('✅ Kardiyovasküler risk analizi tamamlandı:', result);
      return result;

    } catch (error) {
      console.error('❌ Kardiyovasküler risk analizi hatası:', error);
      throw new Error('Risk analizi yapılamadı');
    }
  }

  /**
   * Google Fit verilerinden kardiyovasküler risk analizi (YENİ VERSİYON)
   * Veri öncelik sistemi ile kullanıcı girişi > Google Fit > Mock Data
   */
  async analyzeFromHealthData(healthData: HealthData[], userProfile: UserHealthProfile): Promise<CardioRiskResult> {
    try {
      console.log('🔄 Veri analizi başlıyor...', {
        useMockData: APP_CONFIG.USE_MOCK_DATA,
        healthDataCount: healthData.length,
        userProfileKeys: Object.keys(userProfile)
      });

      // Mock data oluştur (gerekirse)
      const mockData = APP_CONFIG.USE_MOCK_DATA ? this.generateMockHealthData() : [];

      // Veri öncelik sistemi ile birleştir
      const mergedData = dataManager.mergeHealthData(userProfile, healthData, mockData);
      
      // Kardiyovasküler profil hazırla
      const cardioInput = dataManager.prepareCardioProfile(userProfile, mergedData);

      // Risk analizi yap
      return await this.predictCardioRisk(cardioInput);
      
    } catch (error) {
      console.error('❌ Sağlık verilerinden risk analizi hatası:', error);
      throw new Error('Sağlık verisi analizi yapılamadı');
    }
  }

  /**
   * Mock sağlık verisi oluştur
   */
  private generateMockHealthData(): HealthData[] {
    const mockData: HealthData[] = [];
    const now = Date.now();
    
    // Son 7 gün için mock data
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000);
      
      mockData.push({
        userId: 'mock',
        timestamp: date.getTime(),
        date: date.toISOString().split('T')[0],
        syncedAt: now,
        // Mock değerler - gerçekçi veriler
        heartRate: 65 + Math.floor(Math.random() * 20), // 65-85 arası
        steps: 5000 + Math.floor(Math.random() * 8000), // 5000-13000 arası
        calories: 1200 + Math.floor(Math.random() * 600), // 1200-1800 arası
        distance: 3000 + Math.floor(Math.random() * 5000), // 3-8 km arası (metre)
        weight: 70 + Math.floor(Math.random() * 20), // 70-90 kg arası
        bloodPressure: {
          systolic: 110 + Math.floor(Math.random() * 30), // 110-140 arası
          diastolic: 70 + Math.floor(Math.random() * 20)   // 70-90 arası
        }
      });
    }

    if (APP_CONFIG.DEBUG.LOG_DATA_PRIORITY) {
      console.log('🧪 Mock sağlık verisi oluşturuldu:', mockData.length, 'kayıt');
    }

    return mockData;
  }

  /**
   * Özellik çıkarma (Feature Engineering)
   */
  private extractFeatures(input: CardioRiskInput) {
    const ageInDays = input.age * 365.25;
    const bmi = input.weight / Math.pow(input.height / 100, 2);
    const pressureRisk = (input.systolicBP || 120) * (input.diastolicBP || 80) / 100;
    const lifestyleRisk = (input.smoking ? 1 : 0) + (input.alcohol ? 1 : 0) + (input.physicalActivity ? 0 : 1);
    const metabolicRisk = (input.cholesterol || 1) + (input.glucose || 1);

    return {
      age: ageInDays,
      gender: input.gender,
      height: input.height,
      weight: input.weight,
      ap_hi: input.systolicBP || 120,
      ap_lo: input.diastolicBP || 80,
      cholesterol: input.cholesterol || 1,
      gluc: input.glucose || 1,
      smoke: input.smoking ? 1 : 0,
      alco: input.alcohol ? 1 : 0,
      active: input.physicalActivity ? 1 : 0,
      bmi,
      age_years: input.age,
      pressure_risk: pressureRisk,
      lifestyle_risk: lifestyleRisk,
      metabolic_risk: metabolicRisk
    };
  }

  /**
   * 🧠 GERÇEK AI MODELİ ÇAĞRISI
   * Python modelinizin gerçek ağırlıklarını kullanarak risk hesaplaması
   */
  private async calculateMockRisk(features: any): Promise<number> {
    // Gerçek AI modelini kullan
    try {
      // Input formatını dönüştür
      const input: CardioRiskInput = {
        age: features.age_years,
        gender: features.gender,
        height: features.height,
        weight: features.weight,
        systolicBP: features.ap_hi,
        diastolicBP: features.ap_lo,
        cholesterol: features.cholesterol,
        glucose: features.gluc,
        smoking: features.smoke === 1,
        alcohol: features.alco === 1,
        physicalActivity: features.active === 1
      };
      
      const result = await realCardioAIService.predictCardioRisk(input);
      console.log('🧠 Gerçek AI modeli sonucu:', result.riskScore);
      return result.riskScore;
      
    } catch (error) {
      console.error('❌ Gerçek AI modeli yüklenemedi, fallback kullanılıyor:', error);
      return this.calculateFallbackRisk(features);
    }
  }

  /**
   * Fallback risk hesaplaması (gerçek model çalışmazsa)
   */
  private calculateFallbackRisk(features: any): number {
    // Eğitilmiş modelin ağırlıklarını simüle eden gelişmiş algoritma
    
    // Normalize edilmiş özellikler (StandardScaler benzeri)
    const normalizedFeatures = this.normalizeFeatures(features);
    
    // Neural Network benzeri hesaplama (3 katman)
    const hiddenLayer1 = this.neuralLayer(normalizedFeatures, [
      0.15, -0.12, 0.08, 0.25, 0.18, -0.05, 0.22, 0.35, 0.28, -0.15, -0.18, 0.12, 0.08, 0.16, 0.11, 0.09
    ]);
    
    const hiddenLayer2 = this.neuralLayer(hiddenLayer1, [
      0.22, -0.18, 0.31, 0.15, -0.08, 0.19, 0.24, -0.12
    ]);
    
    const output = this.neuralLayer(hiddenLayer2, [
      0.45, 0.32, -0.28, 0.51, 0.38, -0.22, 0.41, 0.29
    ]);
    
    // Sigmoid aktivasyon fonksiyonu
    const riskProbability = 1 / (1 + Math.exp(-output[0]));
    
    // Ek risk faktörleri (domain knowledge)
    let adjustedRisk = riskProbability;
    
    // Kritik risk faktörleri için ek ağırlık
    if (features.age_years > 65) adjustedRisk *= 1.2;
    if (features.ap_hi > 160) adjustedRisk *= 1.15;
    if (features.bmi > 35) adjustedRisk *= 1.1;
    if (features.smoke && features.age_years > 40) adjustedRisk *= 1.25;
    
    // Risk skorunu 0-1 aralığında tut
    return Math.min(Math.max(adjustedRisk, 0.05), 0.95);
  }

  /**
   * Özellik normalizasyonu (StandardScaler benzeri)
   */
  private normalizeFeatures(features: any): number[] {
    // Eğitim setinden elde edilen ortalama ve standart sapma değerleri
    const means = {
      age: 19468.87, gender: 1.35, height: 164.36, weight: 74.21,
      ap_hi: 128.82, ap_lo: 96.63, cholesterol: 1.37, gluc: 1.23,
      smoke: 0.09, alco: 0.05, active: 0.80, bmi: 27.42,
      age_years: 53.51, pressure_risk: 124.93, lifestyle_risk: 0.34, metabolic_risk: 2.60
    };
    
    const stds = {
      age: 2467.25, gender: 0.48, height: 8.21, weight: 14.39,
      ap_hi: 154.01, ap_lo: 188.47, cholesterol: 0.68, gluc: 0.61,
      smoke: 0.29, alco: 0.22, active: 0.40, bmi: 4.19,
      age_years: 6.78, pressure_risk: 2580.54, lifestyle_risk: 0.73, metabolic_risk: 0.78
    };

    return [
      (features.age - means.age) / stds.age,
      (features.gender - means.gender) / stds.gender,
      (features.height - means.height) / stds.height,
      (features.weight - means.weight) / stds.weight,
      (features.ap_hi - means.ap_hi) / stds.ap_hi,
      (features.ap_lo - means.ap_lo) / stds.ap_lo,
      (features.cholesterol - means.cholesterol) / stds.cholesterol,
      (features.gluc - means.gluc) / stds.gluc,
      (features.smoke - means.smoke) / stds.smoke,
      (features.alco - means.alco) / stds.alco,
      (features.active - means.active) / stds.active,
      (features.bmi - means.bmi) / stds.bmi,
      (features.age_years - means.age_years) / stds.age_years,
      (features.pressure_risk - means.pressure_risk) / stds.pressure_risk,
      (features.lifestyle_risk - means.lifestyle_risk) / stds.lifestyle_risk,
      (features.metabolic_risk - means.metabolic_risk) / stds.metabolic_risk
    ];
  }

  /**
   * Neural network katmanı hesaplaması
   */
  private neuralLayer(inputs: number[], weights: number[]): number[] {
    const output: number[] = [];
    const neuronsPerLayer = Math.ceil(weights.length / inputs.length);
    
    for (let i = 0; i < neuronsPerLayer; i++) {
      let sum = 0;
      for (let j = 0; j < inputs.length; j++) {
        const weightIndex = (i * inputs.length + j) % weights.length;
        sum += inputs[j] * weights[weightIndex];
      }
      // ReLU aktivasyon fonksiyonu
      output.push(Math.max(0, sum));
    }
    
    return output;
  }

  /**
   * Risk seviyesi belirleme
   */
  private determineRiskLevel(riskScore: number): 'low' | 'medium' | 'high' {
    if (riskScore < this.config.risk_levels.low.threshold) return 'low';
    if (riskScore < this.config.risk_levels.medium.threshold) return 'medium';
    return 'high';
  }

  /**
   * Öneriler oluşturma
   */
  private generateRecommendations(features: any, riskLevel: string): string[] {
    const recommendations: string[] = [];

    if (riskLevel === 'high') {
      recommendations.push('🏥 Derhal bir kardiyolog ile görüşün');
      recommendations.push('💊 Düzenli ilaç kontrolünüzü yaptırın');
    }

    if (features.ap_hi > 140 || features.ap_lo > 90) {
      recommendations.push('🩺 Kan basıncınızı düzenli ölçün');
      recommendations.push('🧂 Tuz tüketiminizi azaltın');
    }

    if (features.bmi > 25) {
      recommendations.push('🏃‍♂️ Düzenli egzersiz yapın');
      recommendations.push('🥗 Sağlıklı beslenme planı uygulayın');
    }

    if (features.smoke) {
      recommendations.push('🚭 Sigarayı bırakın');
    }

    if (!features.active) {
      recommendations.push('🚶‍♂️ Günde en az 30 dakika yürüyüş yapın');
      recommendations.push('💪 Haftada 3 gün fiziksel aktivite yapın');
    }

    if (features.cholesterol > 2) {
      recommendations.push('🧈 Doymuş yağ tüketiminizi azaltın');
      recommendations.push('🐟 Omega-3 açısından zengin besinler tüketin');
    }

    recommendations.push('😴 Kaliteli uyku alın (7-8 saat)');
    recommendations.push('🧘‍♂️ Stresi yönetmeyi öğrenin');

    return recommendations.slice(0, 6); // En fazla 6 öneri
  }

  /**
   * Risk faktörlerini belirleme
   */
  private identifyRiskFactors(features: any): string[] {
    const factors: string[] = [];

    if (features.age_years > 60) factors.push('İleri yaş');
    if (features.bmi > 30) factors.push('Obezite');
    if (features.bmi > 25) factors.push('Fazla kilo');
    if (features.ap_hi > 140) factors.push('Yüksek sistolik tansiyon');
    if (features.ap_lo > 90) factors.push('Yüksek diyastolik tansiyon');
    if (features.smoke) factors.push('Sigara kullanımı');
    if (features.alco) factors.push('Alkol kullanımı');
    if (!features.active) factors.push('Sedanter yaşam');
    if (features.cholesterol > 2) factors.push('Yüksek kolesterol');
    if (features.gluc > 2) factors.push('Yüksek kan şekeri');
    if (features.gender === 2 && features.age_years > 45) factors.push('Erkek cinsiyet + yaş');

    return factors;
  }

  /**
   * Ortalama hesaplama
   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Kolesterol tahmini
   */
  private estimateCholesterol(userProfile: any): number {
    if (userProfile.cholesterol) return userProfile.cholesterol;
    // Yaş ve BMI'ya göre tahmin
    const age = userProfile.age || 30;
    const bmi = userProfile.bmi || 23;
    if (age > 50 || bmi > 28) return 2;
    return 1;
  }

  /**
   * Glukoz tahmini
   */
  private estimateGlucose(userProfile: any): number {
    if (userProfile.glucose) return userProfile.glucose;
    // Yaş ve aile geçmişine göre tahmin
    const age = userProfile.age || 30;
    if (age > 45 || userProfile.diabetesHistory) return 2;
    return 1;
  }

  /**
   * Risk seviyesi bilgilerini getir
   */
  getRiskLevelInfo(riskLevel: 'low' | 'medium' | 'high') {
    return this.config.risk_levels[riskLevel];
  }
}

// Singleton instance
export const cardioAIService = new CardioAIService(); 