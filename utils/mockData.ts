import { HealthContext, HealthMetrics, UserProfile } from '../types/health';

export class MockHealthDataGenerator {
  /**
   * Test için sahte sağlık verisi oluştur
   */
  static generateMockHealthContext(): HealthContext {
    const userProfile: UserProfile = {
      age: 28,
      gender: 'male',
      weight: 75,
      height: 175,
      medicalHistory: [],
      currentMedications: [],
      allergies: ['Polen']
    };

    const now = new Date();
    const currentMetrics: HealthMetrics = {
      heartRate: [
        { value: 72, timestamp: new Date(now.getTime() - 60000).toISOString(), status: 'normal' },
        { value: 78, timestamp: new Date(now.getTime() - 30000).toISOString(), status: 'normal' },
        { value: 85, timestamp: now.toISOString(), status: 'normal' }
      ],
      bloodPressure: [
        { 
          systolic: 120, 
          diastolic: 80, 
          timestamp: new Date(now.getTime() - 120000).toISOString(),
          status: 'normal'
        },
        { 
          systolic: 125, 
          diastolic: 82, 
          timestamp: now.toISOString(),
          status: 'normal'
        }
      ],
      sleep: [
        {
          duration: 450, // 7.5 saat
          quality: 'good',
          timestamp: new Date(now.getTime() - 86400000).toISOString() // Dün
        },
        {
          duration: 420, // 7 saat
          quality: 'fair',
          timestamp: new Date(now.getTime() - 43200000).toISOString() // 12 saat önce
        }
      ],
      activity: [
        {
          steps: 8500,
          calories: 2200,
          distance: 6.2,
          timestamp: new Date(now.getTime() - 86400000).toISOString()
        },
        {
          steps: 6800,
          calories: 1950,
          distance: 4.8,
          timestamp: now.toISOString()
        }
      ]
    };

    return {
      userProfile,
      currentMetrics,
      timeframe: '7d'
    };
  }

  /**
   * Farklı senaryolar için varyasyonlar
   */
  static generateHighRiskContext(): HealthContext {
    const context = this.generateMockHealthContext();
    
    // Yüksek risk faktörleri ekle
    context.currentMetrics.heartRate = [
      { value: 95, timestamp: new Date().toISOString(), status: 'tachycardia' },
      { value: 102, timestamp: new Date().toISOString(), status: 'tachycardia' }
    ];
    
    context.currentMetrics.bloodPressure = [
      { 
        systolic: 145, 
        diastolic: 95, 
        timestamp: new Date().toISOString(),
        status: 'hypertension_1'
      }
    ];

    context.currentMetrics.sleep = [
      {
        duration: 300, // 5 saat - yetersiz
        quality: 'poor',
        timestamp: new Date().toISOString()
      }
    ];

    return context;
  }

  /**
   * Mükemmel sağlık durumu
   */
  static generateOptimalContext(): HealthContext {
    const context = this.generateMockHealthContext();
    
    context.currentMetrics.heartRate = [
      { value: 65, timestamp: new Date().toISOString(), status: 'normal' },
      { value: 68, timestamp: new Date().toISOString(), status: 'normal' }
    ];
    
    context.currentMetrics.sleep = [
      {
        duration: 480, // 8 saat
        quality: 'excellent',
        timestamp: new Date().toISOString()
      }
    ];

    context.currentMetrics.activity = [
      {
        steps: 12000,
        calories: 2500,
        distance: 9.5,
        timestamp: new Date().toISOString()
      }
    ];

    return context;
  }
}
