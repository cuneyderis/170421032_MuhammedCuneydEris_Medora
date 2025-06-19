import { ComprehensiveHealthData, AIHealthAssessment, CardiovascularRiskPrediction, ECGAnalysisPrediction } from '../../types/health';
import { cardioAI } from './cardioAI';
import { ecgAI } from './ecgAI';
import { db } from '../../config/firebase';
import { collection, addDoc, query, where, orderBy, limit as firestoreLimit, getDocs } from 'firebase/firestore';

export class HealthAssessmentAIService {
  private static instance: HealthAssessmentAIService;
  
  public static getInstance(): HealthAssessmentAIService {
    if (!HealthAssessmentAIService.instance) {
      HealthAssessmentAIService.instance = new HealthAssessmentAIService();
    }
    return HealthAssessmentAIService.instance;
  }

  /**
   * Kapsamlı sağlık değerlendirmesi yap
   */
  async performHealthAssessment(userId: string, healthData: ComprehensiveHealthData): Promise<AIHealthAssessment> {
    try {
      console.log('🤖 AI sağlık değerlendirmesi başlıyor...');
      
      // Paralel olarak her iki AI modelini çalıştır
      const [cardiovascularRisk, ecgAnalysis] = await Promise.all([
        cardioAI.predictCardiovascularRisk(healthData).catch(error => {
          console.warn('⚠️ Kardiyovasküler risk tahmini hatası:', error);
          return null;
        }),
        ecgAI.analyzeECG(healthData).catch(error => {
          console.warn('⚠️ EKG analiz hatası:', error);
          return null;
        })
      ]);

      // Genel risk skorunu hesapla
      const overallRiskScore = this.calculateOverallRisk(cardiovascularRisk, ecgAnalysis);
      
      // Öncelikli uyarıları belirle
      const priorityAlerts = this.generatePriorityAlerts(cardiovascularRisk, ecgAnalysis);
      
      // Eylem öğelerini oluştur
      const actionItems = this.generateActionItems(cardiovascularRisk, ecgAnalysis, overallRiskScore);
      
      // Bir sonraki değerlendirme tarihini belirle
      const nextAssessmentDate = this.calculateNextAssessmentDate(overallRiskScore);

      const assessment: AIHealthAssessment = {
        userId,
        timestamp: Date.now(),
        date: new Date().toISOString().split('T')[0],
        cardiovascularRisk: cardiovascularRisk || undefined,
        ecgAnalysis: ecgAnalysis || undefined,
        overallRiskScore,
        priorityAlerts,
        actionItems,
        nextAssessmentDate
      };

      // Değerlendirmeyi kaydet
      await this.saveAssessment(assessment);
      
      console.log('✅ AI sağlık değerlendirmesi tamamlandı:', {
        overallRisk: overallRiskScore,
        alerts: priorityAlerts.length,
        actions: actionItems.length
      });

      return assessment;
    } catch (error) {
      console.error('❌ Sağlık değerlendirmesi hatası:', error);
      throw error;
    }
  }

  /**
   * Genel risk skorunu hesapla
   */
  private calculateOverallRisk(
    cardiovascularRisk: CardiovascularRiskPrediction | null,
    ecgAnalysis: ECGAnalysisPrediction | null
  ): number {
    let totalRisk = 0;
    let factorCount = 0;

    // Kardiyovasküler risk
    if (cardiovascularRisk) {
      totalRisk += cardiovascularRisk.riskScore * 0.6; // %60 ağırlık
      factorCount += 0.6;
    }

    // EKG anomali riski
    if (ecgAnalysis) {
      totalRisk += ecgAnalysis.anomalyScore * 0.4; // %40 ağırlık
      factorCount += 0.4;
    }

    return factorCount > 0 ? totalRisk / factorCount : 0.1; // Varsayılan düşük risk
  }

  /**
   * Öncelikli uyarıları oluştur
   */
  private generatePriorityAlerts(
    cardiovascularRisk: CardiovascularRiskPrediction | null,
    ecgAnalysis: ECGAnalysisPrediction | null
  ): string[] {
    const alerts: string[] = [];

    // Kardiyovasküler risk uyarıları
    if (cardiovascularRisk) {
      if (cardiovascularRisk.riskLevel === 'very_high') {
        alerts.push('🚨 ÇOK YÜKSEK kardiyovasküler risk tespit edildi!');
      } else if (cardiovascularRisk.riskLevel === 'high') {
        alerts.push('⚠️ YÜKSEK kardiyovasküler risk tespit edildi');
      }
    }

    // EKG uyarıları
    if (ecgAnalysis) {
      if (ecgAnalysis.classification === 'Ventricular') {
        alerts.push('🚨 Ventriküler aritmia tespit edildi - ACİL!');
      } else if (ecgAnalysis.classification === 'Supraventricular') {
        alerts.push('⚠️ Üst ventriküler aritmia tespit edildi');
      }
      
      if (ecgAnalysis.anomalyScore > 0.8) {
        alerts.push('🚨 Yüksek EKG anomali skoru');
      }
    }

    return alerts;
  }

  /**
   * Eylem öğelerini oluştur
   */
  private generateActionItems(
    cardiovascularRisk: CardiovascularRiskPrediction | null,
    ecgAnalysis: ECGAnalysisPrediction | null,
    overallRisk: number
  ): string[] {
    const actions: string[] = [];

    // Acil durumlar
    if (overallRisk > 0.8) {
      actions.push('🏥 Acil servise başvurun');
      actions.push('📞 Kardiyolog ile hemen iletişime geçin');
    } else if (overallRisk > 0.6) {
      actions.push('🩺 Bu hafta içinde kardiyolog randevusu alın');
      actions.push('💊 Mevcut ilaçlarınızı gözden geçirin');
    }

    // Kardiyovasküler öneriler
    if (cardiovascularRisk) {
      actions.push(...cardiovascularRisk.recommendations);
    }

    // EKG önerileri
    if (ecgAnalysis) {
      actions.push(...ecgAnalysis.recommendations);
    }

    // Genel sağlık önerileri
    if (overallRisk > 0.3) {
      actions.push('📊 Günlük sağlık verilerinizi takip edin');
      actions.push('🏃‍♂️ Düzenli hafif egzersiz yapın');
      actions.push('🥗 Kalp sağlığı için beslenme planı uygulayın');
    }

    // Duplikatları kaldır
    return [...new Set(actions)];
  }

  /**
   * Bir sonraki değerlendirme tarihini hesapla
   */
  private calculateNextAssessmentDate(overallRisk: number): string {
    const today = new Date();
    let daysUntilNext = 30; // Varsayılan 1 ay

    if (overallRisk > 0.8) {
      daysUntilNext = 3; // 3 gün
    } else if (overallRisk > 0.6) {
      daysUntilNext = 7; // 1 hafta
    } else if (overallRisk > 0.4) {
      daysUntilNext = 14; // 2 hafta
    }

    const nextDate = new Date(today.getTime() + daysUntilNext * 24 * 60 * 60 * 1000);
    return nextDate.toISOString().split('T')[0];
  }

  /**
   * Değerlendirmeyi Firestore'a kaydet
   */
  private async saveAssessment(assessment: AIHealthAssessment): Promise<void> {
    try {
      const assessmentsRef = collection(db, 'health-assessments');
      await addDoc(assessmentsRef, assessment);
      console.log('💾 Sağlık değerlendirmesi kaydedildi');
    } catch (error) {
      console.warn('⚠️ Sağlık değerlendirmesi kaydedilemedi:', error);
      // localStorage fallback
      try {
        const localAssessments = JSON.parse(localStorage.getItem(`assessments_${assessment.userId}`) || '[]');
        localAssessments.push(assessment);
        localStorage.setItem(`assessments_${assessment.userId}`, JSON.stringify(localAssessments));
                 console.log('💾 Sağlık değerlendirmesi localStorage\'a kaydedildi');
      } catch (localError) {
        console.error('❌ localStorage kayıt hatası:', localError);
      }
    }
  }

  /**
   * Kullanıcının son değerlendirmelerini getir
   */
  async getRecentAssessments(userId: string, limit: number = 5): Promise<AIHealthAssessment[]> {
    try {
      const assessmentsRef = collection(db, 'health-assessments');
             const q = query(
         assessmentsRef,
         where('userId', '==', userId),
         orderBy('timestamp', 'desc'),
         firestoreLimit(limit)
       );

      const querySnapshot = await getDocs(q);
      const assessments: AIHealthAssessment[] = [];

             querySnapshot.forEach((doc) => {
         const data = doc.data() as AIHealthAssessment;
         assessments.push({
           ...data,
           id: doc.id
         });
       });

      return assessments;
    } catch (error) {
      console.warn('⚠️ Değerlendirmeler getirilemedi:', error);
      
      // localStorage fallback
      try {
        const localAssessments = JSON.parse(localStorage.getItem(`assessments_${userId}`) || '[]');
        return localAssessments.slice(0, limit);
      } catch (localError) {
        console.error('❌ localStorage okuma hatası:', localError);
        return [];
      }
    }
  }

  /**
   * Risk trend analizi
   */
  async analyzeRiskTrend(userId: string): Promise<{
    trend: 'improving' | 'stable' | 'worsening';
    change: number;
    period: string;
  }> {
    const assessments = await this.getRecentAssessments(userId, 10);
    
    if (assessments.length < 2) {
      return { trend: 'stable', change: 0, period: 'insufficient_data' };
    }

    const recent = assessments.slice(0, 3);
    const older = assessments.slice(3, 6);

    const recentAvg = recent.reduce((sum, a) => sum + a.overallRiskScore, 0) / recent.length;
    const olderAvg = older.length > 0 ? older.reduce((sum, a) => sum + a.overallRiskScore, 0) / older.length : recentAvg;

    const change = recentAvg - olderAvg;
    const threshold = 0.1;

    let trend: 'improving' | 'stable' | 'worsening';
    if (change < -threshold) {
      trend = 'improving';
    } else if (change > threshold) {
      trend = 'worsening';
    } else {
      trend = 'stable';
    }

    return {
      trend,
      change: Math.abs(change),
      period: `${assessments.length} değerlendirme`
    };
  }
}

export const healthAssessmentAI = HealthAssessmentAIService.getInstance(); 