import { APP_CONFIG } from '../constants/config';
import { HealthData } from '../types/health';

export interface DataSource {
  source: 'user_input' | 'google_fit' | 'mock_data';
  priority: number;
  timestamp: number;
}

export interface HealthDataWithSource extends HealthData {
  dataSource?: DataSource;
}

export interface UserHealthProfile {
  age?: number;
  gender?: 'male' | 'female' | 'other';
  height?: number; // cm
  weight?: number; // kg
  bloodPressure?: {
    systolic: number;
    diastolic: number;
    timestamp: number;
  };
  cholesterol?: number; // 1: normal, 2: above normal, 3: well above normal
  glucose?: number; // 1: normal, 2: above normal, 3: well above normal
  smoking?: boolean;
  alcohol?: boolean;
  physicalActivity?: boolean;
  // Kullanıcının manuel girdiği veriler
  manualEntries?: {
    [key: string]: {
      value: any;
      timestamp: number;
      source: 'user_input';
    };
  };
}

class DataManager {
  private static instance: DataManager;

  public static getInstance(): DataManager {
    if (!DataManager.instance) {
      DataManager.instance = new DataManager();
    }
    return DataManager.instance;
  }

  /**
   * Kullanıcı profili ve Google Fit/Mock verilerini birleştir
   * Öncelik: Kullanıcı girişi > Google Fit > Mock Data
   */
  mergeHealthData(
    userProfile: UserHealthProfile,
    googleFitData: HealthData[],
    mockData?: HealthData[]
  ): HealthDataWithSource[] {
    if (APP_CONFIG.DEBUG.LOG_DATA_PRIORITY) {
      console.log('🔄 Veri birleştirme başlıyor...', {
        useMockData: APP_CONFIG.USE_MOCK_DATA,
        userProfile: Object.keys(userProfile).length,
        googleFitData: googleFitData.length,
        mockData: mockData?.length || 0
      });
    }

    const mergedData: HealthDataWithSource[] = [];

    // 1. Temel veri kaynağını belirle (Mock vs Google Fit)
    const baseData = APP_CONFIG.USE_MOCK_DATA ? (mockData || []) : googleFitData;
    const baseSource: DataSource['source'] = APP_CONFIG.USE_MOCK_DATA ? 'mock_data' : 'google_fit';

    // 2. Temel verileri ekle
    baseData.forEach(data => {
      mergedData.push({
        ...data,
        dataSource: {
          source: baseSource,
          priority: APP_CONFIG.DATA_PRIORITY[baseSource.toUpperCase() as keyof typeof APP_CONFIG.DATA_PRIORITY],
          timestamp: Date.now()
        }
      });
    });

    // 3. Kullanıcı manuel girişlerini üzerine yaz
    if (userProfile.manualEntries) {
      Object.entries(userProfile.manualEntries).forEach(([key, entry]) => {
        // En son veriyi bul ve güncelle
        const latestDataIndex = mergedData.length - 1;
        if (latestDataIndex >= 0) {
          const updatedData = { ...mergedData[latestDataIndex] };
          
          // Kullanıcı verisi ile güncelle
          switch (key) {
            case 'weight':
              updatedData.weight = entry.value;
              break;
            case 'height':
              // Height genellikle değişmez, profilde sakla
              break;
            case 'bloodPressure':
              updatedData.bloodPressure = entry.value;
              break;
            case 'steps':
              updatedData.steps = entry.value;
              break;
            case 'heartRate':
              updatedData.heartRate = entry.value;
              break;
            case 'calories':
              updatedData.calories = entry.value;
              break;
          }

          updatedData.dataSource = {
            source: 'user_input',
            priority: APP_CONFIG.DATA_PRIORITY.USER_INPUT,
            timestamp: entry.timestamp
          };

          mergedData[latestDataIndex] = updatedData;

          if (APP_CONFIG.DEBUG.LOG_DATA_PRIORITY) {
            console.log(`✅ Kullanıcı verisi uygulandı: ${key}`, entry.value);
          }
        }
      });
    }

    if (APP_CONFIG.DEBUG.LOG_DATA_PRIORITY) {
      console.log('✅ Veri birleştirme tamamlandı:', {
        totalRecords: mergedData.length,
        sources: this.getDataSourceSummary(mergedData)
      });
    }

    return mergedData;
  }

  /**
   * Kullanıcı profili verilerini sağlık verisi formatına çevir
   */
  convertProfileToHealthData(userProfile: UserHealthProfile, userId: string): HealthDataWithSource {
    const now = Date.now();
    const today = new Date().toISOString().split('T')[0];

    return {
      userId,
      timestamp: now,
      date: today,
      syncedAt: now,
      // Kullanıcı profil verilerini health data formatına map et
      weight: userProfile.weight,
      heartRate: userProfile.bloodPressure ? 
        Math.round((userProfile.bloodPressure.systolic + userProfile.bloodPressure.diastolic) / 2) : 
        undefined,
      bloodPressure: userProfile.bloodPressure ? {
        systolic: userProfile.bloodPressure.systolic,
        diastolic: userProfile.bloodPressure.diastolic
      } : undefined,
      dataSource: {
        source: 'user_input',
        priority: APP_CONFIG.DATA_PRIORITY.USER_INPUT,
        timestamp: now
      }
    };
  }

     /**
    * Kardiyovasküler analiz için kullanıcı profilini hazırla
    */
   prepareCardioProfile(userProfile: UserHealthProfile, healthData: HealthDataWithSource[]) {
     // En son sağlık verisini al
     const latestData = healthData[healthData.length - 1];
     
     // Gender string'i number'a çevir
     const genderToNumber = (gender?: string): number => {
       switch (gender) {
         case 'female': return 1;
         case 'male': return 2;
         default: return 2; // default erkek
       }
     };
     
     const cardioProfile = {
       // Kullanıcı profili öncelikli
       age: userProfile.age || 30,
       gender: genderToNumber(userProfile.gender),
       height: userProfile.height || 170,
       weight: userProfile.weight || latestData?.weight || 70,
       
       // Kan basıncı - kullanıcı girişi öncelikli
       systolicBP: userProfile.bloodPressure?.systolic || latestData?.bloodPressure?.systolic || 120,
       diastolicBP: userProfile.bloodPressure?.diastolic || latestData?.bloodPressure?.diastolic || 80,
       
       // Diğer faktörler
       cholesterol: userProfile.cholesterol || 1,
       glucose: userProfile.glucose || 1,
       smoking: userProfile.smoking || false,
       alcohol: userProfile.alcohol || false,
       physicalActivity: userProfile.physicalActivity || false
     };

    if (APP_CONFIG.DEBUG.LOG_DATA_PRIORITY) {
      console.log('🫀 Kardiyovasküler profil hazırlandı:', cardioProfile);
      console.log('📊 Veri kaynakları:', {
        weight: userProfile.weight ? 'user' : 'health_data',
        bloodPressure: userProfile.bloodPressure ? 'user' : 'health_data',
        demographics: 'user_profile'
      });
    }

    return cardioProfile;
  }

  /**
   * Veri kaynağı özetini çıkar
   */
  private getDataSourceSummary(data: HealthDataWithSource[]) {
    const summary = {
      user_input: 0,
      google_fit: 0,
      mock_data: 0
    };

    data.forEach(item => {
      if (item.dataSource) {
        summary[item.dataSource.source]++;
      }
    });

    return summary;
  }

  /**
   * Mock data flag'ini değiştir
   */
  setMockDataMode(enabled: boolean) {
    // Runtime'da config değiştirme (development için)
    (APP_CONFIG as any).USE_MOCK_DATA = enabled;
    
    console.log(`🔧 Mock data modu ${enabled ? 'açıldı' : 'kapatıldı'}`);
  }

  /**
   * Kullanıcı manuel veri girişi kaydet
   */
  saveUserInput(userProfile: UserHealthProfile, key: string, value: any): UserHealthProfile {
    const updatedProfile = { ...userProfile };
    
    if (!updatedProfile.manualEntries) {
      updatedProfile.manualEntries = {};
    }

    updatedProfile.manualEntries[key] = {
      value,
      timestamp: Date.now(),
      source: 'user_input'
    };

    // Aynı zamanda ana profile de kaydet
    switch (key) {
      case 'weight':
        updatedProfile.weight = value;
        break;
      case 'height':
        updatedProfile.height = value;
        break;
      case 'bloodPressure':
        updatedProfile.bloodPressure = {
          ...value,
          timestamp: Date.now()
        };
        break;
      case 'age':
        updatedProfile.age = value;
        break;
      case 'gender':
        updatedProfile.gender = value;
        break;
    }

    if (APP_CONFIG.DEBUG.LOG_DATA_PRIORITY) {
      console.log(`💾 Kullanıcı verisi kaydedildi: ${key}`, value);
    }

    return updatedProfile;
  }

  /**
   * Veri kaynağını göster (debug için)
   */
  getDataSourceInfo(data: HealthDataWithSource): string {
    if (!APP_CONFIG.DEBUG.SHOW_DATA_SOURCE || !data.dataSource) {
      return '';
    }

    const sourceLabels = {
      user_input: '👤 Kullanıcı',
      google_fit: '🏃‍♂️ Google Fit',
      mock_data: '🧪 Demo'
    };

    return ` (${sourceLabels[data.dataSource.source]})`;
  }
}

// Singleton instance export
export const dataManager = DataManager.getInstance(); 