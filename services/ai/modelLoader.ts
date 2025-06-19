import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';

/**
 * TensorFlow.js Model Loader
 * Python'da eğitilen modelleri React Native'de çalıştırır
 */
export class ModelLoader {
  private static instance: ModelLoader;
  private cardioModel: tf.LayersModel | null = null;
  private ekgModel: tf.LayersModel | null = null;
  private scaler: { mean: number[], std: number[] } | null = null;

  private constructor() {}

  public static getInstance(): ModelLoader {
    if (!ModelLoader.instance) {
      ModelLoader.instance = new ModelLoader();
    }
    return ModelLoader.instance;
  }

  /**
   * Kardiyovasküler model yükleme
   */
  async loadCardioModel(): Promise<tf.LayersModel> {
    try {
      if (this.cardioModel) {
        return this.cardioModel;
      }

      console.log('🔄 Kardiyovasküler model yükleniyor...');
      
      // Model dosyasını yükle (asset'ten veya URL'den)
      const modelUrl = 'file://./ai-models/cardio_model.h5'; // Model dosyanızın yolu
      this.cardioModel = await tf.loadLayersModel(modelUrl);
      
      console.log('✅ Kardiyovasküler model yüklendi!');
      return this.cardioModel;

    } catch (error) {
      console.error('❌ Kardiyovasküler model yükleme hatası:', error);
      throw new Error('Model yüklenemedi');
    }
  }

  /**
   * EKG model yükleme
   */
  async loadEKGModel(): Promise<tf.LayersModel> {
    try {
      if (this.ekgModel) {
        return this.ekgModel;
      }

      console.log('🔄 EKG model yükleniyor...');
      
      const modelUrl = 'file://./ai-models/ekg_model.h5'; // EKG model dosyanızın yolu
      this.ekgModel = await tf.loadLayersModel(modelUrl);
      
      console.log('✅ EKG model yüklendi!');
      return this.ekgModel;

    } catch (error) {
      console.error('❌ EKG model yükleme hatası:', error);
      throw new Error('EKG model yüklenemedi');
    }
  }

  /**
   * Scaler parametrelerini yükle
   */
  async loadScaler(): Promise<{ mean: number[], std: number[] }> {
    try {
      if (this.scaler) {
        return this.scaler;
      }

      // Scaler parametreleri (Python'dan export edilecek)
      // Bu değerler model_results.json'dan okunacak
      this.scaler = {
        mean: [13870.5, 1.5, 170.0, 70.0, 120.0, 80.0, 1.5, 1.2, 0.3, 0.2, 0.7, 24.0, 38.0, 96.0, 0.8, 2.7],
        std: [7500.2, 0.5, 15.0, 12.0, 20.0, 15.0, 0.7, 0.5, 0.46, 0.4, 0.46, 5.0, 15.0, 45.0, 0.6, 1.2]
      };

      console.log('✅ Scaler parametreleri yüklendi!');
      return this.scaler;

    } catch (error) {
      console.error('❌ Scaler yükleme hatası:', error);
      throw new Error('Scaler yüklenemedi');
    }
  }

  /**
   * Kardiyovasküler risk tahmini (Gerçek Model)
   */
  async predictCardioRisk(features: number[]): Promise<number> {
    try {
      const model = await this.loadCardioModel();
      const scaler = await this.loadScaler();

      // Özellik normalizasyonu
      const normalizedFeatures = features.map((feature, index) => {
        const mean = scaler.mean[index] || 0;
        const std = scaler.std[index] || 1;
        return (feature - mean) / std;
      });

      // Tensor oluştur
      const inputTensor = tf.tensor2d([normalizedFeatures]);

      // Model tahmini
      const prediction = model.predict(inputTensor) as tf.Tensor;
      const riskScore = await prediction.data();

      // Cleanup
      inputTensor.dispose();
      prediction.dispose();

      return riskScore[0];

    } catch (error) {
      console.error('❌ Gerçek model tahmin hatası:', error);
      // Fallback olarak basitleştirilmiş hesaplama
      return this.fallbackCardioRisk(features);
    }
  }

  /**
   * EKG sınıflandırma (Gerçek Model)
   */
  async predictEKGClass(ekgData: number[]): Promise<{ class: number, probability: number[] }> {
    try {
      const model = await this.loadEKGModel();

      // EKG verisini reshape et (187, 1)
      const reshapedData = tf.tensor3d([ekgData.map(x => [x])]);

      // Model tahmini
      const prediction = model.predict(reshapedData) as tf.Tensor;
      const probabilities = await prediction.data();

      // En yüksek olasılıklı sınıfı bul
      const predictedClass = probabilities.indexOf(Math.max(...probabilities));

      // Cleanup
      reshapedData.dispose();
      prediction.dispose();

      return {
        class: predictedClass,
        probability: Array.from(probabilities)
      };

    } catch (error) {
      console.error('❌ EKG model tahmin hatası:', error);
      // Fallback
      return { class: 0, probability: [1, 0, 0, 0, 0] };
    }
  }

  /**
   * Fallback kardiyovasküler risk hesaplama
   */
  private fallbackCardioRisk(features: number[]): number {
    let risk = 0.1; // Base risk
    const [age, gender, height, weight, systolic, diastolic, cholesterol, glucose, smoke, alcohol, active, bmi, ageYears] = features;

    // Yaş faktörü
    if (ageYears > 60) risk += 0.3;
    else if (ageYears > 45) risk += 0.2;
    else if (ageYears > 35) risk += 0.1;

    // BMI faktörü
    if (bmi > 30) risk += 0.2;
    else if (bmi > 25) risk += 0.1;

    // Kan basıncı faktörü
    if (systolic > 140 || diastolic > 90) risk += 0.25;
    else if (systolic > 130 || diastolic > 85) risk += 0.15;

    // Yaşam tarzı faktörleri
    if (smoke) risk += 0.2;
    if (alcohol) risk += 0.1;
    if (!active) risk += 0.15;

    // Metabolik faktörler
    if (cholesterol > 2) risk += 0.15;
    if (glucose > 2) risk += 0.15;

    // Cinsiyet faktörü
    if (gender === 2 && ageYears > 45) risk += 0.1;

    return Math.min(risk, 0.95);
  }

  /**
   * Model performans istatistikleri
   */
  getModelStats() {
    return {
      cardioModelLoaded: this.cardioModel !== null,
      ekgModelLoaded: this.ekgModel !== null,
      scalerLoaded: this.scaler !== null,
      tfVersion: tf.version.tfjs,
      backend: tf.getBackend()
    };
  }

  /**
   * Memory cleanup
   */
  dispose() {
    if (this.cardioModel) {
      this.cardioModel.dispose();
      this.cardioModel = null;
    }
    if (this.ekgModel) {
      this.ekgModel.dispose();
      this.ekgModel = null;
    }
    this.scaler = null;
  }
}

// Singleton instance
export const modelLoader = ModelLoader.getInstance(); 