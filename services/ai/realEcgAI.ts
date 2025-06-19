import { EKGWeights } from '../../types/health';

// EKG sınıfları
export const EKG_CLASSES = {
  0: 'Normal',
  1: 'Supraventricular',
  2: 'Ventricular', 
  3: 'Fusion',
  4: 'Unknown'
} as const;

export type EKGClass = keyof typeof EKG_CLASSES;

export interface EKGAnalysisResult {
  predictedClass: EKGClass;
  className: string;
  confidence: number;
  probabilities: Record<string, number>;
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
  timestamp: number;
}

class RealEKGAIService {
  private weights: EKGWeights | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    try {
      console.log('🫀 Gerçek EKG AI modeli yükleniyor...');
      
      // EKG model ağırlıklarını yükle
      const weightsData = require('../../ai-models/ekg_weights.json');
      this.weights = weightsData;
      
      this.isInitialized = true;
      console.log('✅ Gerçek EKG AI modeli yüklendi:', {
        layers: Object.keys(this.weights?.weights || {}).length,
        input_shape: this.weights?.metadata?.input_shape,
        classes: this.weights?.metadata?.output_classes
      });
      
    } catch (error) {
      console.error('❌ Gerçek EKG AI modeli yüklenemedi:', error);
      this.isInitialized = false;
    }
  }

  // ReLU aktivasyon fonksiyonu
  private relu(x: number): number {
    return Math.max(0, x);
  }

  // Softmax aktivasyon fonksiyonu
  private softmax(logits: number[]): number[] {
    const maxLogit = Math.max(...logits);
    const expLogits = logits.map(x => Math.exp(x - maxLogit));
    const sumExp = expLogits.reduce((sum, x) => sum + x, 0);
    return expLogits.map(x => x / sumExp);
  }

  // 1D Konvolüsyon işlemi
  private conv1d(input: number[][], kernel: number[][][], bias: number[]): number[][] {
    const inputLength = input.length;
    const inputChannels = input[0].length;
    const kernelSize = kernel.length;
    const outputChannels = kernel[0][0].length;
    const outputLength = inputLength - kernelSize + 1;
    
    const output: number[][] = [];
    
    for (let i = 0; i < outputLength; i++) {
      const outputRow: number[] = [];
      
      for (let outCh = 0; outCh < outputChannels; outCh++) {
        let sum = bias[outCh];
        
        for (let k = 0; k < kernelSize; k++) {
          for (let inCh = 0; inCh < inputChannels; inCh++) {
            sum += input[i + k][inCh] * kernel[k][inCh][outCh];
          }
        }
        
        outputRow.push(sum);
      }
      
      output.push(outputRow);
    }
    
    return output;
  }

  // Max Pooling işlemi
  private maxPool1d(input: number[][], poolSize: number = 2): number[][] {
    const output: number[][] = [];
    const channels = input[0].length;
    
    for (let i = 0; i < input.length; i += poolSize) {
      const poolRow: number[] = [];
      
      for (let ch = 0; ch < channels; ch++) {
        let maxVal = -Infinity;
        
        for (let j = 0; j < poolSize && i + j < input.length; j++) {
          maxVal = Math.max(maxVal, input[i + j][ch]);
        }
        
        poolRow.push(maxVal);
      }
      
      output.push(poolRow);
    }
    
    return output;
  }

  // Flatten işlemi
  private flatten(input: number[][]): number[] {
    return input.flat();
  }

  // Dense layer işlemi
  private dense(input: number[], weights: number[][], bias: number[]): number[] {
    const output: number[] = [];
    
    for (let i = 0; i < weights[0].length; i++) {
      let sum = bias[i];
      
      for (let j = 0; j < input.length; j++) {
        sum += input[j] * weights[j][i];
      }
      
      output.push(sum);
    }
    
    return output;
  }

  // EKG sinyalini normalize et
  private normalizeSignal(signal: number[]): number[] {
    if (!this.weights?.scaler) {
      // Basit z-score normalizasyonu
      const mean = signal.reduce((sum, val) => sum + val, 0) / signal.length;
      const std = Math.sqrt(signal.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / signal.length);
      return signal.map(val => (val - mean) / (std || 1));
    }
    
    // Scaler parametreleri ile normalize et
    const { mean, scale } = this.weights.scaler;
    return signal.map((val, idx) => {
      const meanVal = mean[idx % mean.length];
      const scaleVal = scale[idx % scale.length];
      return (val - meanVal) / scaleVal;
    });
  }

  // Ana tahmin fonksiyonu
  private predict(signal: number[]): number[] {
    if (!this.weights) {
      throw new Error('Model yüklenmedi');
    }

    // Giriş verisini hazırla (2D array: [timesteps, channels])
    let input: number[][] = signal.map(val => [val]);
    
    console.log('🔄 Gerçek EKG CNN işlemi başlıyor...');
    console.log('📊 Giriş boyutu:', input.length, 'x', input[0].length);

    // Conv1D + ReLU + MaxPool katmanları
    const conv1Weights = this.weights.weights.conv1d;
    let output = this.conv1d(input, conv1Weights.kernel, conv1Weights.bias);
    output = output.map(row => row.map(val => this.relu(val)));
    output = this.maxPool1d(output);
    console.log('✅ Conv1D-1 çıkışı:', output.length, 'x', output[0].length);

    const conv2Weights = this.weights.weights.conv1d_1;
    output = this.conv1d(output, conv2Weights.kernel, conv2Weights.bias);
    output = output.map(row => row.map(val => this.relu(val)));
    output = this.maxPool1d(output);
    console.log('✅ Conv1D-2 çıkışı:', output.length, 'x', output[0].length);

    const conv3Weights = this.weights.weights.conv1d_2;
    output = this.conv1d(output, conv3Weights.kernel, conv3Weights.bias);
    output = output.map(row => row.map(val => this.relu(val)));
    output = this.maxPool1d(output);
    console.log('✅ Conv1D-3 çıkışı:', output.length, 'x', output[0].length);

    // Flatten
    let flatOutput = this.flatten(output);
    console.log('✅ Flatten çıkışı:', flatOutput.length);

    // Dense katmanları
    const dense1Weights = this.weights.weights.dense;
    flatOutput = this.dense(flatOutput, dense1Weights.kernel as any, dense1Weights.bias);
    flatOutput = flatOutput.map(val => this.relu(val));
    console.log('✅ Dense-1 çıkışı:', flatOutput.length);

    const dense2Weights = this.weights.weights.dense_1;
    flatOutput = this.dense(flatOutput, dense2Weights.kernel as any, dense2Weights.bias);
    console.log('✅ Dense-2 (çıkış) çıkışı:', flatOutput.length);

    // Softmax
    const probabilities = this.softmax(flatOutput);
    console.log('✅ Softmax çıkışı:', probabilities);

    return probabilities;
  }

  // Risk seviyesi belirle
  private determineRiskLevel(predictedClass: EKGClass, confidence: number): 'low' | 'medium' | 'high' {
    if (predictedClass === 0) { // Normal
      return confidence > 0.8 ? 'low' : 'medium';
    } else if (predictedClass === 1) { // Supraventricular
      return confidence > 0.7 ? 'medium' : 'high';
    } else if (predictedClass === 2) { // Ventricular
      return 'high';
    } else if (predictedClass === 3) { // Fusion
      return confidence > 0.6 ? 'medium' : 'high';
    } else { // Unknown
      return 'medium';
    }
  }

  // Öneriler oluştur
  private generateRecommendations(predictedClass: EKGClass, riskLevel: string): string[] {
    const recommendations: string[] = [];

    if (predictedClass === 0) { // Normal
      recommendations.push('✅ EKG sonuçlarınız normal görünüyor');
      recommendations.push('💚 Düzenli kalp kontrolü yaptırın');
      recommendations.push('🏃‍♂️ Aktif yaşam tarzınızı sürdürün');
    } else if (predictedClass === 1) { // Supraventricular
      recommendations.push('⚠️ Supraventriküler aritmia tespit edildi');
      recommendations.push('🏥 Kardiyolog kontrolü önerilir');
      recommendations.push('☕ Kafein tüketimini azaltın');
      recommendations.push('😴 Düzenli uyku alın');
    } else if (predictedClass === 2) { // Ventricular
      recommendations.push('🚨 Ventriküler aritmia tespit edildi');
      recommendations.push('🏥 ACİL kardiyolog kontrolü gerekli');
      recommendations.push('💊 İlaç tedavinizi aksatmayın');
      recommendations.push('🚫 Ağır fiziksel aktiviteden kaçının');
    } else if (predictedClass === 3) { // Fusion
      recommendations.push('⚡ Füzyon ritmi tespit edildi');
      recommendations.push('🏥 Kardiyolog değerlendirmesi önerilir');
      recommendations.push('📊 Daha detaylı EKG analizi gerekebilir');
    } else { // Unknown
      recommendations.push('❓ Belirsiz ritim tespit edildi');
      recommendations.push('🏥 Tıbbi değerlendirme önerilir');
      recommendations.push('📈 EKG kaydını tekrarlayın');
    }

    return recommendations;
  }

  // Ana analiz fonksiyonu
  async analyzeEKG(signal: number[]): Promise<EKGAnalysisResult> {
    if (!this.isInitialized || !this.weights) {
      throw new Error('Gerçek EKG AI modeli henüz yüklenmedi');
    }

    try {
      console.log('🫀 Gerçek EKG analizi başlıyor...', { signalLength: signal.length });

      // Sinyali normalize et
      const normalizedSignal = this.normalizeSignal(signal);
      
      // Tahmin yap
      const probabilities = this.predict(normalizedSignal);
      
      // En yüksek olasılığa sahip sınıfı bul
      const predictedClass = probabilities.indexOf(Math.max(...probabilities)) as EKGClass;
      const maxProbability = Math.max(...probabilities);
      const className = EKG_CLASSES[predictedClass];
      
      // Daha gerçekçi güvenilirlik hesapla
      const confidence = this.calculateRealisticConfidence(probabilities, maxProbability);
      
      // Risk seviyesi belirle
      const riskLevel = this.determineRiskLevel(predictedClass, confidence);
      
      // Öneriler oluştur
      const recommendations = this.generateRecommendations(predictedClass, riskLevel);
      
      // Tüm sınıf olasılıklarını hazırla
      const probabilitiesObj: Record<string, number> = {};
      Object.entries(EKG_CLASSES).forEach(([key, value]) => {
        probabilitiesObj[value] = probabilities[parseInt(key)] || 0;
      });

      const result: EKGAnalysisResult = {
        predictedClass,
        className,
        confidence,
        probabilities: probabilitiesObj,
        riskLevel,
        recommendations,
        timestamp: Date.now()
      };

      console.log('✅ Gerçek EKG analizi tamamlandı:', {
        className,
        confidence: `${(confidence * 100).toFixed(1)}%`,
        riskLevel,
        rawMaxProbability: `${(maxProbability * 100).toFixed(1)}%`
      });

      return result;

    } catch (error) {
      console.error('❌ Gerçek EKG analizi hatası:', error);
      throw error;
    }
  }

  // Daha gerçekçi güvenilirlik hesapla
  private calculateRealisticConfidence(probabilities: number[], maxProbability: number): number {
    // Entropy bazlı belirsizlik hesapla
    const entropy = -probabilities.reduce((sum, p) => {
      return sum + (p > 0 ? p * Math.log2(p) : 0);
    }, 0);
    
    // Maksimum entropy (5 sınıf için)
    const maxEntropy = Math.log2(5);
    
    // Normalized entropy (0-1 arası)
    const normalizedEntropy = entropy / maxEntropy;
    
    // İkinci en yüksek olasılığı bul
    const sortedProbs = [...probabilities].sort((a, b) => b - a);
    const secondHighest = sortedProbs[1];
    
    // Margin hesabı (en yüksek ile ikinci en yüksek arasındaki fark)
    const margin = maxProbability - secondHighest;
    
    // Çok yüksek olasılıkları (>0.99) penalize et
    let confidenceAdjustment = 1.0;
    if (maxProbability > 0.99) {
      confidenceAdjustment = 0.85 + (0.15 * margin); // En fazla %85 güvenilirlik
    } else if (maxProbability > 0.95) {
      confidenceAdjustment = 0.90 + (0.10 * margin); // En fazla %90 güvenilirlik
    }
    
    // Final confidence hesabı
    let finalConfidence = maxProbability * confidenceAdjustment * (1 - normalizedEntropy * 0.2);
    
    // Minimum ve maksimum sınırlar
    finalConfidence = Math.max(0.5, Math.min(0.95, finalConfidence));
    
    console.log('🔍 Güvenilirlik detayları:', {
      rawProbability: `${(maxProbability * 100).toFixed(1)}%`,
      entropy: entropy.toFixed(3),
      normalizedEntropy: normalizedEntropy.toFixed(3),
      margin: margin.toFixed(3),
      adjustment: confidenceAdjustment.toFixed(3),
      finalConfidence: `${(finalConfidence * 100).toFixed(1)}%`
    });
    
    return finalConfidence;
  }

  // Mock EKG verisi oluştur (test için)
  generateMockEKGSignal(type: 'normal' | 'arrhythmia' = 'normal', length: number = 180): number[] {
    const signal: number[] = [];
    
    for (let i = 0; i < length; i++) {
      const t = (i / length) * 2 * Math.PI;
      
      if (type === 'normal') {
        // Normal EKG sinyali
        signal.push(
          Math.sin(t) + 
          0.3 * Math.sin(3 * t) + 
          0.1 * Math.random()
        );
      } else {
        // Aritmia sinyali
        signal.push(
          0.8 * Math.sin(t) + 
          0.5 * Math.sin(7 * t) + 
          0.2 * Math.random()
        );
      }
    }
    
    return signal;
  }

  // Fallback mock analizi
  async analyzeMockEKG(type: 'normal' | 'arrhythmia' = 'normal'): Promise<EKGAnalysisResult> {
    console.log('🫀 Mock EKG analizi çalışıyor...', { type });

    // Mock sonuçlar
    let predictedClass: EKGClass;
    let confidence: number;
    let riskLevel: 'low' | 'medium' | 'high';

    if (type === 'normal') {
      predictedClass = 0; // Normal
      confidence = 0.85 + Math.random() * 0.1;
      riskLevel = 'low';
    } else {
      // Rastgele aritmia tipi
      const arrhythmiaTypes = [1, 2, 3, 4]; // Supraventricular, Ventricular, Fusion, Unknown
      predictedClass = arrhythmiaTypes[Math.floor(Math.random() * arrhythmiaTypes.length)] as EKGClass;
      confidence = 0.6 + Math.random() * 0.25;
      riskLevel = predictedClass === 2 ? 'high' : 'medium';
    }

    const className = EKG_CLASSES[predictedClass];
    const recommendations = this.generateRecommendations(predictedClass, riskLevel);

    // Mock olasılıklar
    const probabilities: Record<string, number> = {};
    Object.entries(EKG_CLASSES).forEach(([key, value]) => {
      const classKey = parseInt(key) as EKGClass;
      if (classKey === predictedClass) {
        probabilities[value] = confidence;
      } else {
        probabilities[value] = (1 - confidence) / 4 + Math.random() * 0.1;
      }
    });

    const result: EKGAnalysisResult = {
      predictedClass,
      className,
      confidence,
      probabilities,
      riskLevel,
      recommendations,
      timestamp: Date.now()
    };

    console.log('✅ Mock EKG analizi tamamlandı:', {
      className,
      confidence: `${(confidence * 100).toFixed(1)}%`,
      riskLevel
    });

    return result;
  }
}

// Singleton instance
export const realEkgAIService = new RealEKGAIService(); 