import tensorflowjs as tfjs
import tensorflow as tf
import numpy as np
import json
import os
import pickle
from datetime import datetime

def convert_cardio_model():
    """Kardiyovasküler model'i TensorFlow.js formatına çevir"""
    try:
        print("🫀 Kardiyovasküler model dönüştürülüyor...")
        
        # Model'i yükle
        model = tf.keras.models.load_model('../model_results/cardio_model.h5')
        
        # TensorFlow.js formatına çevir
        output_dir = '../ai-models/cardio_model_tfjs'
        tfjs.converters.save_keras_model(model, output_dir)
        
        print(f"✅ Kardiyovasküler model başarıyla dönüştürüldü: {output_dir}")
        return True
        
    except Exception as e:
        print(f"❌ Kardiyovasküler model dönüştürme hatası: {e}")
        return False

def convert_ekg_model():
    """EKG model'i TensorFlow.js formatına çevir"""
    try:
        print("📈 EKG model dönüştürülüyor...")
        
        # Model'i yükle
        model = tf.keras.models.load_model('../ekg_model_results/ekg_model.h5')
        
        # TensorFlow.js formatına çevir
        output_dir = '../ai-models/ekg_model_tfjs'
        tfjs.converters.save_keras_model(model, output_dir)
        
        print(f"✅ EKG model başarıyla dönüştürüldü: {output_dir}")
        return True
        
    except Exception as e:
        print(f"❌ EKG model dönüştürme hatası: {e}")
        return False

def export_scaler_params():
    """StandardScaler parametrelerini export et"""
    try:
        print("📊 Scaler parametreleri export ediliyor...")
        
        # Scaler'ı yükle
        with open('../model_results/scaler.pkl', 'rb') as f:
            scaler = pickle.load(f)
        
        # Parametreleri JSON formatında kaydet
        scaler_params = {
            'mean': scaler.mean_.tolist(),
            'std': scaler.scale_.tolist(),
            'feature_names': [
                'age', 'gender', 'height', 'weight', 'ap_hi', 'ap_lo',
                'cholesterol', 'gluc', 'smoke', 'alco', 'active',
                'bmi', 'age_years', 'pressure_risk', 'lifestyle_risk', 'metabolic_risk'
            ]
        }
        
        with open('../ai-models/scaler_params.json', 'w') as f:
            json.dump(scaler_params, f, indent=2)
        
        print("✅ Scaler parametreleri export edildi: ../ai-models/scaler_params.json")
        return scaler_params
        
    except Exception as e:
        print(f"❌ Scaler export hatası: {e}")
        return None

def create_model_manifest():
    """Model manifest dosyası oluştur"""
    try:
        print("📋 Model manifest oluşturuluyor...")
        
        manifest = {
            'version': '1.0.0',
            'created_at': datetime.now().isoformat(),
            'models': {
                'cardiovascular': {
                    'path': './cardio_model_tfjs/model.json',
                    'type': 'classification',
                    'input_shape': [16],
                    'output_shape': [1],
                    'description': 'Kardiyovasküler hastalık risk tahmini modeli'
                },
                'ekg': {
                    'path': './ekg_model_tfjs/model.json', 
                    'type': 'classification',
                    'input_shape': [187, 1],
                    'output_shape': [5],
                    'description': 'EKG aritmisi sınıflandırma modeli'
                }
            },
            'preprocessing': {
                'scaler': './scaler_params.json',
                'normalization': 'standard_scaler'
            },
            'usage': {
                'cardio_example': {
                    'input': [23*365, 2, 170, 70, 120, 80, 1, 1, 0, 0, 1, 24.2, 23, 96, 0, 2],
                    'description': '23 yaş erkek, normal değerler'
                },
                'ekg_example': {
                    'input': 'Array of 187 ECG signal values',
                    'description': 'MIT-BIH formatında EKG sinyali'
                }
            }
        }
        
        with open('../ai-models/model_manifest.json', 'w') as f:
            json.dump(manifest, f, indent=2)
        
        print("✅ Model manifest oluşturuldu: ../ai-models/model_manifest.json")
        return True
        
    except Exception as e:
        print(f"❌ Manifest oluşturma hatası: {e}")
        return False

def test_converted_models():
    """Dönüştürülen modelleri test et"""
    try:
        print("🧪 Dönüştürülen modeller test ediliyor...")
        
        # Test verisi
        test_input = np.array([[23*365, 2, 170, 70, 120, 80, 1, 1, 0, 0, 1, 24.2, 23, 96, 0, 2]])
        
        # Orijinal model testi
        original_model = tf.keras.models.load_model('../model_results/cardio_model.h5')
        original_prediction = original_model.predict(test_input)
        
        print(f"📊 Orijinal model tahmini: {original_prediction[0][0]:.4f}")
        
        # TensorFlow.js model yükleme testi (Python'da)
        import tensorflowjs as tfjs
        js_model = tfjs.converters.load_keras_model('../ai-models/cardio_model_tfjs/model.json')
        js_prediction = js_model.predict(test_input)
        
        print(f"📊 TensorFlow.js model tahmini: {js_prediction[0][0]:.4f}")
        
        # Fark kontrolü
        diff = abs(original_prediction[0][0] - js_prediction[0][0])
        if diff < 0.001:
            print("✅ Model dönüştürme başarılı! Tahminler uyumlu.")
            return True
        else:
            print(f"⚠️ Model tahminleri arasında fark var: {diff:.6f}")
            return False
            
    except Exception as e:
        print(f"❌ Model test hatası: {e}")
        return False

def main():
    """Ana dönüştürme fonksiyonu"""
    print("🚀 AI Model Dönüştürme İşlemi Başlıyor...")
    print("=" * 50)
    
    # Çıktı klasörünü oluştur
    os.makedirs('../ai-models', exist_ok=True)
    
    success_count = 0
    
    # 1. Kardiyovasküler model dönüştür
    if convert_cardio_model():
        success_count += 1
    
    # 2. EKG model dönüştür  
    if convert_ekg_model():
        success_count += 1
    
    # 3. Scaler parametrelerini export et
    scaler_params = export_scaler_params()
    if scaler_params:
        success_count += 1
    
    # 4. Model manifest oluştur
    if create_model_manifest():
        success_count += 1
    
    # 5. Modelleri test et
    if test_converted_models():
        success_count += 1
    
    print("=" * 50)
    print(f"🎯 Dönüştürme işlemi tamamlandı! {success_count}/5 başarılı")
    
    if success_count == 5:
        print("🎉 Tüm modeller başarıyla React Native için hazırlandı!")
        print("\n📂 Oluşturulan dosyalar:")
        print("   - ai-models/cardio_model_tfjs/")
        print("   - ai-models/ekg_model_tfjs/")
        print("   - ai-models/scaler_params.json")
        print("   - ai-models/model_manifest.json")
        print("\n🚀 React Native uygulamanızda artık gerçek AI modelleri kullanabilirsiniz!")
    else:
        print("⚠️ Bazı dönüştürme işlemleri başarısız oldu. Logları kontrol edin.")

if __name__ == "__main__":
    main() 