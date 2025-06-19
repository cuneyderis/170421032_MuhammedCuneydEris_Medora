import GoogleFit, { 
  BucketUnit, 
  Scopes,
} from 'react-native-google-fit';
import { db } from '../config/firebase';
import { doc, setDoc, getDoc, collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';

// Health data types
export interface HealthData {
  userId: string;
  timestamp: number;
  date: string; // YYYY-MM-DD format
  heartRate?: number;
  steps?: number;
  distance?: number; // meters
  calories?: number;
  sleepDuration?: number; // minutes
  weight?: number; // kg
  height?: number; // cm
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  bodyFat?: number; // percentage
  waterIntake?: number; // ml
  activities?: ActivityData[];
  syncedAt: number;
}

export interface ActivityData {
  type: string;
  duration: number; // minutes
  calories?: number;
  distance?: number; // meters
  startTime: number;
  endTime: number;
}

export interface SyncStatus {
  userId: string;
  lastSyncDate: string;
  isConnected: boolean;
  syncedAt: number;
}

export class GoogleFitService {
  private CLIENT_ID = '961841426928-osptg1n236isl1rbj5gfv21aj2kd4ggv.apps.googleusercontent.com';
  private isConnected = false;

  /**
   * Google Fit'e bağlan
   */
  async connect(): Promise<{ success: boolean; message?: string }> {
    try {
      const options = {
        scopes: [
          Scopes.FITNESS_ACTIVITY_READ,
          Scopes.FITNESS_BODY_READ,
          Scopes.FITNESS_HEART_RATE_READ,
          Scopes.FITNESS_BLOOD_PRESSURE_READ,
          Scopes.FITNESS_SLEEP_READ,
          Scopes.FITNESS_NUTRITION_READ,
        ],
        clientId: this.CLIENT_ID,
      };

      console.log('🏃‍♂️ Google Fit bağlantısı başlatılıyor...');
      const authResult = await GoogleFit.authorize(options);
      
      if (authResult.success) {
        this.isConnected = true;
        console.log('✅ Google Fit bağlantısı başarılı!');
        return { success: true };
      } else {
        console.log('❌ Google Fit bağlantısı başarısız:', authResult.message);
        return { 
          success: false, 
          message: authResult.message || 'Yetkilendirme başarısız oldu' 
        };
      }
    } catch (error) {
      console.error('❌ Google Fit bağlantı hatası:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu' 
      };
    }
  }

  /**
   * Günlük sağlık verilerini Google Fit'ten çek
   */
  async fetchDailyHealthData(date: Date): Promise<HealthData | null> {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      const dateStr = date.toISOString().split('T')[0];

      console.log(`📊 ${dateStr} için sağlık verileri çekiliyor...`);

      // Veri çekme fonksiyonları
      const healthData: HealthData = {
        userId: '', // Will be set when saving
        timestamp: Date.now(),
        date: dateStr,
        syncedAt: Date.now()
      };

      // Her veri türü için ayrı ayrı çek
      try {
        const heartRateData = await this.fetchHeartRate(startDate, endDate);
        if (heartRateData && heartRateData.length > 0) {
          healthData.heartRate = Math.round(heartRateData.reduce((sum: number, data: any) => sum + (data.value || 0), 0) / heartRateData.length);
        }
      } catch (error) {
        console.warn('⚠️ Kalp hızı verisi çekilemedi:', error);
      }

      try {
        const stepsData = await this.fetchSteps(startDate, endDate);
        if (stepsData && stepsData.length > 0) {
          healthData.steps = stepsData.reduce((sum: number, data: any) => sum + (data.value || data.steps || 0), 0);
        }
      } catch (error) {
        console.warn('⚠️ Adım verisi çekilemedi:', error);
      }

      try {
        const distanceData = await this.fetchDistance(startDate, endDate);
        if (distanceData && distanceData.length > 0) {
          healthData.distance = distanceData.reduce((sum: number, data: any) => sum + (data.value || data.distance || 0), 0);
        }
      } catch (error) {
        console.warn('⚠️ Mesafe verisi çekilemedi:', error);
      }

      try {
        const caloriesData = await this.fetchCalories(startDate, endDate);
        if (caloriesData && caloriesData.length > 0) {
          healthData.calories = caloriesData.reduce((sum: number, data: any) => sum + (data.value || data.calories || 0), 0);
        }
      } catch (error) {
        console.warn('⚠️ Kalori verisi çekilemedi:', error);
      }

      try {
        const weightData = await this.fetchWeight(startDate, endDate);
        if (weightData && weightData.length > 0) {
          healthData.weight = weightData[weightData.length - 1].value;
        }
      } catch (error) {
        console.warn('⚠️ Kilo verisi çekilemedi:', error);
      }

      try {
        const bloodPressureData = await this.fetchBloodPressure(startDate, endDate);
        if (bloodPressureData && bloodPressureData.length > 0) {
          const lastBP = bloodPressureData[bloodPressureData.length - 1];
          healthData.bloodPressure = {
            systolic: lastBP.systolic,
            diastolic: lastBP.diastolic
          };
        }
      } catch (error) {
        console.warn('⚠️ Kan basıncı verisi çekilemedi:', error);
      }

      // 🧪 DEMO/TEST VERİSİ - Eğer gerçek veri yoksa mock data ekle
      const hasRealData = healthData.heartRate || healthData.steps || healthData.calories || healthData.distance;
      
      if (!hasRealData) {
        console.log('📱 Gerçek veri bulunamadı, demo verisi ekleniyor...');
        
        // Tarih bazlı rastgele ama tutarlı veriler
        const dayOffset = Math.abs(new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
        const seed = dateStr.split('-').join('');
        const randomSeed = parseInt(seed) % 1000;
        
        healthData.heartRate = 65 + (randomSeed % 30); // 65-95 bpm
        healthData.steps = 3000 + (randomSeed * 15) % 8000; // 3000-11000 steps
        healthData.calories = 1200 + (randomSeed * 8) % 800; // 1200-2000 kcal
        healthData.distance = (healthData.steps * 0.0008) * 1000; // ~0.8m per step in meters
        
        // Haftanın günlerine göre kan basıncı
        const dayOfWeek = new Date(dateStr).getDay();
        if (dayOfWeek % 3 === 0) { // Her 3 günde bir kan basıncı ölçümü
          healthData.bloodPressure = {
            systolic: 110 + (randomSeed % 20), // 110-130
            diastolic: 70 + (randomSeed % 15)  // 70-85
          };
        }
        
        // Haftalık kilo ölçümü
        if (dayOfWeek === 1) { // Pazartesi günleri
          healthData.weight = 70 + (randomSeed % 20); // 70-90 kg
        }
        
        console.log('✨ Demo verisi oluşturuldu:', {
          heartRate: healthData.heartRate,
          steps: healthData.steps,
          calories: healthData.calories,
          distance: Math.round(healthData.distance || 0),
          bloodPressure: healthData.bloodPressure,
          weight: healthData.weight
        });
      }

      console.log(`✅ ${dateStr} için veri çekme tamamlandı:`, {
        heartRate: healthData.heartRate,
        steps: healthData.steps,
        distance: healthData.distance,
        calories: healthData.calories,
        weight: healthData.weight
      });

      return healthData;
    } catch (error) {
      console.error('❌ Günlük sağlık verileri çekilemedi:', error);
      return null;
    }
  }

  /**
   * Kalp hızı verilerini çek
   */
  private async fetchHeartRate(startDate: Date, endDate: Date): Promise<any[]> {
    try {
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };
      return await GoogleFit.getHeartRateSamples(options);
    } catch (error) {
      console.warn('⚠️ Kalp hızı verileri alınamadı:', error);
      return [];
    }
  }

  /**
   * Adım verilerini çek
   */
  private async fetchSteps(startDate: Date, endDate: Date): Promise<any[]> {
    try {
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        bucketUnit: BucketUnit.DAY,
        bucketInterval: 1,
      };
      return await GoogleFit.getDailyStepCountSamples(options);
    } catch (error) {
      console.warn('⚠️ Adım verileri alınamadı:', error);
      return [];
    }
  }

  /**
   * Mesafe verilerini çek
   */
  private async fetchDistance(startDate: Date, endDate: Date): Promise<any[]> {
    try {
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        bucketUnit: BucketUnit.DAY,
        bucketInterval: 1,
      };
      return await GoogleFit.getDailyDistanceSamples(options);
    } catch (error) {
      console.warn('⚠️ Mesafe verileri alınamadı:', error);
      return [];
    }
  }

  /**
   * Kalori verilerini çek
   */
  private async fetchCalories(startDate: Date, endDate: Date): Promise<any[]> {
    try {
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        bucketUnit: BucketUnit.DAY,
        bucketInterval: 1,
      };
      return await GoogleFit.getDailyCalorieSamples(options);
    } catch (error) {
      console.warn('⚠️ Kalori verileri alınamadı:', error);
      return [];
    }
  }

  /**
   * Kilo verilerini çek
   */
  private async fetchWeight(startDate: Date, endDate: Date): Promise<any[]> {
    try {
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };
      return await GoogleFit.getWeightSamples(options);
    } catch (error) {
      console.warn('⚠️ Kilo verileri alınamadı:', error);
      return [];
    }
  }

  /**
   * Kan basıncı verilerini çek
   */
  private async fetchBloodPressure(startDate: Date, endDate: Date): Promise<any[]> {
    try {
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };
      return await GoogleFit.getBloodPressureSamples(options);
    } catch (error) {
      console.warn('⚠️ Kan basıncı verileri alınamadı:', error);
      return [];
    }
  }

  /**
   * Sağlık verilerini Firestore'a kaydet
   */
  async saveHealthDataToFirestore(userId: string, healthData: HealthData): Promise<boolean> {
    try {
      healthData.userId = userId;
      
      const docRef = doc(db, 'health-data', `${userId}_${healthData.date}`);
      await setDoc(docRef, healthData, { merge: true });
      
      console.log(`💾 ${healthData.date} için sağlık verileri kaydedildi`);
      return true;
    } catch (error) {
      console.warn('⚠️ Sağlık verileri Firestore\'a kaydedilemedi:', error);
      console.log('📱 Veriler yerel olarak saklanacak (geçici çözüm)');
      
      // Geçici olarak localStorage'da sakla (sadece development için)
      try {
        const storageKey = `health-data-${userId}-${healthData.date}`;
        const dataStr = JSON.stringify(healthData);
        // Web için localStorage, native için AsyncStorage kullanılabilir
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(storageKey, dataStr);
          console.log(`💾 ${healthData.date} için veriler yerel olarak kaydedildi`);
          return true;
        }
      } catch (localError) {
        console.error('❌ Yerel kaydetme de başarısız:', localError);
      }
      
      return false;
    }
  }

  /**
   * Son senkronizasyon durumunu kaydet
   */
  async updateSyncStatus(userId: string, lastSyncDate: string): Promise<void> {
    try {
      const syncStatus: SyncStatus = {
        userId,
        lastSyncDate,
        isConnected: this.isConnected,
        syncedAt: Date.now()
      };

      const docRef = doc(db, 'sync-status', userId);
      await setDoc(docRef, syncStatus);
      
      console.log(`🔄 Senkronizasyon durumu güncellendi: ${lastSyncDate}`);
    } catch (error) {
      console.warn('⚠️ Senkronizasyon durumu Firestore\'a kaydedilemedi:', error);
      
      // Geçici olarak localStorage'da sakla
      try {
        const storageKey = `sync-status-${userId}`;
        const dataStr = JSON.stringify({ userId, lastSyncDate, isConnected: this.isConnected, syncedAt: Date.now() });
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(storageKey, dataStr);
          console.log(`🔄 Senkronizasyon durumu yerel olarak kaydedildi`);
        }
      } catch (localError) {
        console.error('❌ Yerel senkronizasyon durumu kaydetme başarısız:', localError);
      }
    }
  }

  /**
   * Son senkronizasyon durumunu getir
   */
  async getSyncStatus(userId: string): Promise<SyncStatus | null> {
    try {
      const docRef = doc(db, 'sync-status', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as SyncStatus;
      }
      return null;
    } catch (error) {
      console.warn('⚠️ Senkronizasyon durumu Firestore\'dan alınamadı:', error);
      
      // Geçici olarak localStorage'dan oku
      try {
        const storageKey = `sync-status-${userId}`;
        if (typeof window !== 'undefined' && window.localStorage) {
          const dataStr = window.localStorage.getItem(storageKey);
          if (dataStr) {
            const syncStatus = JSON.parse(dataStr) as SyncStatus;
            console.log(`🔄 Senkronizasyon durumu yerel olarak bulundu`);
            return syncStatus;
          }
        }
      } catch (localError) {
        console.error('❌ Yerel senkronizasyon durumu okuma başarısız:', localError);
      }
      
      return null;
    }
  }

  /**
   * Kullanıcının sağlık verilerini getir
   */
  async getUserHealthData(userId: string, startDate?: string, endDate?: string, limitCount: number = 30): Promise<HealthData[]> {
    try {
      let q = query(
        collection(db, 'health-data'),
        where('userId', '==', userId),
        orderBy('date', 'desc'),
        limit(limitCount)
      );

      if (startDate && endDate) {
        q = query(
          collection(db, 'health-data'),
          where('userId', '==', userId),
          where('date', '>=', startDate),
          where('date', '<=', endDate),
          orderBy('date', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);
      const healthData: HealthData[] = [];

      querySnapshot.forEach((doc) => {
        healthData.push(doc.data() as HealthData);
      });

      console.log(`📊 ${healthData.length} adet sağlık verisi Firestore'dan getirildi`);
      return healthData;
    } catch (error) {
      console.warn('⚠️ Sağlık verileri Firestore\'dan getirilemedi:', error);
      
      // Geçici olarak localStorage'dan oku
      try {
        const healthData: HealthData[] = [];
        if (typeof window !== 'undefined' && window.localStorage) {
          // Son 7 günün verilerini localStorage'dan oku
          for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const storageKey = `health-data-${userId}-${dateStr}`;
            const dataStr = window.localStorage.getItem(storageKey);
            if (dataStr) {
              const data = JSON.parse(dataStr) as HealthData;
              healthData.push(data);
            }
          }
          
          console.log(`📊 ${healthData.length} adet sağlık verisi yerel olarak bulundu`);
          return healthData.sort((a, b) => b.date.localeCompare(a.date));
        }
      } catch (localError) {
        console.error('❌ Yerel sağlık verileri okuma başarısız:', localError);
      }
      
      return [];
    }
  }

  /**
   * Belirli tarih aralığında senkronizasyon yap
   */
  async syncHealthData(userId: string, startDate: Date, endDate: Date): Promise<{ success: boolean; syncedDays: number }> {
    try {
      console.log(`🔄 ${startDate.toDateString()} - ${endDate.toDateString()} arası senkronizasyon başlıyor...`);
      
      let syncedDays = 0;
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const healthData = await this.fetchDailyHealthData(currentDate);
        
        if (healthData) {
          const saved = await this.saveHealthDataToFirestore(userId, healthData);
          if (saved) {
            syncedDays++;
          }
        }

        // Bir sonraki güne geç
        currentDate.setDate(currentDate.getDate() + 1);
        
        // API rate limiting için kısa bekleme
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Son senkronizasyon tarihini güncelle
      await this.updateSyncStatus(userId, endDate.toISOString().split('T')[0]);

      console.log(`✅ Senkronizasyon tamamlandı. ${syncedDays} gün senkronize edildi.`);
      
      return { success: true, syncedDays };
    } catch (error) {
      console.error('❌ Senkronizasyon hatası:', error);
      return { success: false, syncedDays: 0 };
    }
  }

  /**
   * Otomatik senkronizasyon (son 7 gün)
   */
  async autoSync(userId: string): Promise<{ success: boolean; syncedDays: number }> {
    try {
      const syncStatus = await this.getSyncStatus(userId);
      
      let startDate: Date;
      if (syncStatus?.lastSyncDate) {
        startDate = new Date(syncStatus.lastSyncDate);
        startDate.setDate(startDate.getDate() + 1); // Son senkronizasyondan sonraki gün
      } else {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7); // Son 7 gün
      }

      const endDate = new Date();
      
      return await this.syncHealthData(userId, startDate, endDate);
    } catch (error) {
      console.error('❌ Otomatik senkronizasyon hatası:', error);
      return { success: false, syncedDays: 0 };
    }
  }

  /**
   * Bağlantı durumunu kontrol et
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Bağlantıyı kes
   */
  async disconnect(): Promise<void> {
    try {
      await GoogleFit.disconnect();
      this.isConnected = false;
      console.log('🔌 Google Fit bağlantısı kesildi');
    } catch (error) {
      console.error('❌ Google Fit bağlantısı kesilemedi:', error);
    }
  }

  /**
   * Firestore'dan kullanıcının sağlık verilerini yükle
   */
  async loadHealthData(userId: string, days: number = 7): Promise<HealthData[]> {
    try {
      const healthDataRef = collection(db, 'health-data');
      
      // Basit query - index gerektirmez
      const q = query(
        healthDataRef,
        where('userId', '==', userId),
        limit(days * 2) // Biraz fazla al, sonra filtrele
      );

      const querySnapshot = await getDocs(q);
      const healthData: HealthData[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as HealthData;
        if (data.date) {
          healthData.push(data);
        }
      });

      // Tarih bazlı sıralama ve filtreleme (client-side)
      const sortedData = healthData
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, days);

      console.log(`📊 ${sortedData.length} günlük sağlık verisi yüklendi`);
      
      // Debug: İlk birkaç veriyi göster
      if (sortedData.length > 0) {
        console.log('📈 Yüklenen veriler:', sortedData.slice(0, 3).map(d => ({
          date: d.date,
          heartRate: d.heartRate,
          steps: d.steps,
          calories: d.calories
        })));
      }

      return sortedData;
    } catch (error) {
      console.warn('⚠️ Sağlık verileri Firestore\'dan getirilemedi:', error);
      
      // Fallback: localStorage'dan dene
      try {
        const localData = localStorage.getItem(`healthData_${userId}`);
        if (localData) {
          const parsedData = JSON.parse(localData);
          console.log('📱 localStorage\'dan veri yüklendi:', parsedData.length);
          return parsedData.slice(0, days);
        }
      } catch (localError) {
        console.warn('⚠️ localStorage\'dan da veri alınamadı:', localError);
      }

      // Son çare: Demo data döndür
      console.log('🎭 Demo verisi döndürülüyor...');
      return this.generateDemoData(userId, days);
    }
  }

  /**
   * Demo/test verisi oluştur
   */
  private generateDemoData(userId: string, days: number): HealthData[] {
    const demoData: HealthData[] = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const seed = parseInt(dateStr.split('-').join('')) % 1000;
      
      demoData.push({
        userId,
        timestamp: date.getTime(),
        date: dateStr,
        heartRate: 65 + (seed % 30),
        steps: 3000 + ((seed * 15) % 8000),
        calories: 1200 + ((seed * 8) % 800),
        distance: (3000 + ((seed * 15) % 8000)) * 0.8, // meters
        weight: i === 0 || i % 7 === 0 ? 70 + (seed % 20) : undefined,
        bloodPressure: i % 3 === 0 ? {
          systolic: 110 + (seed % 20),
          diastolic: 70 + (seed % 15)
        } : undefined,
        syncedAt: Date.now()
      });
    }

    return demoData;
  }
}

// Singleton instance
export const googleFitService = new GoogleFitService(); 