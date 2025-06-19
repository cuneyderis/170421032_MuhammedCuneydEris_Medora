#!/usr/bin/env python3
"""
H5 modelinden ağırlıkları çıkarıp JavaScript formatında kaydetme
"""
import h5py
import json
import numpy as np
import pickle

def extract_h5_weights(h5_path):
    """H5 dosyasından ağırlıkları çıkar"""
    weights = {}
    
    try:
        with h5py.File(h5_path, 'r') as f:
            print("H5 dosyası yapısı:")
            
            def print_structure(name, obj):
                print(f"  {name}: {type(obj)}")
                if isinstance(obj, h5py.Dataset):
                    print(f"    Shape: {obj.shape}, dtype: {obj.dtype}")
            
            f.visititems(print_structure)
            
            # Model ağırlıklarını bul
            model_weights = f.get('model_weights')
            if model_weights:
                print("\nModel ağırlıkları bulundu!")
                
                # Dense katmanları çıkar
                for layer_name in ['dense_5', 'dense_6', 'dense_7', 'dense_8', 'dense_9']:
                    if layer_name in model_weights:
                        layer_group = model_weights[layer_name]['sequential_1'][layer_name]
                        print(f"\nKatman: {layer_name}")
                        
                        layer_weights = {}
                        
                        # Kernel (weights) ve bias çıkar
                        if 'kernel' in layer_group:
                            kernel_data = layer_group['kernel'][:]
                            layer_weights['kernel'] = kernel_data.tolist()
                            print(f"  kernel: {kernel_data.shape}")
                        
                        if 'bias' in layer_group:
                            bias_data = layer_group['bias'][:]
                            layer_weights['bias'] = bias_data.tolist()
                            print(f"  bias: {bias_data.shape}")
                        
                        weights[layer_name] = layer_weights
            else:
                print("Model ağırlıkları bulunamadı, alternatif yapı aranıyor...")
                # Alternatif yapıları kontrol et
                for key in f.keys():
                    print(f"Ana anahtar: {key}")
                    if 'weight' in key.lower() or 'layer' in key.lower():
                        data = f[key][:]
                        weights[key] = data.tolist()
                        print(f"  Ağırlık: {key}, Shape: {data.shape}")
                        
    except Exception as e:
        print(f"H5 okuma hatası: {e}")
        return None
    
    return weights

def extract_scaler_params(scaler_path):
    """Scaler parametrelerini çıkar"""
    try:
        with open(scaler_path, 'rb') as f:
            scaler = pickle.load(f)
            return {
                'mean': scaler.mean_.tolist(),
                'scale': scaler.scale_.tolist()
            }
    except Exception as e:
        print(f"Scaler okuma hatası: {e}")
        return None

def main():
    print("🔬 Model ağırlıklarını çıkarıyor...")
    
    # H5 modelinden ağırlıkları çıkar
    weights = extract_h5_weights('ai-models/cardio_model.h5')
    
    # Scaler parametrelerini çıkar
    scaler_params = extract_scaler_params('ai-models/scaler.pkl')
    
    if weights and scaler_params:
        # JavaScript formatında kaydet
        js_model = {
            'weights': weights,
            'scaler': scaler_params,
            'metadata': {
                'input_features': 16,
                'output_classes': 1,
                'activation': 'sigmoid',
                'model_type': 'neural_network'
            }
        }
        
        with open('ai-models/model_weights.json', 'w') as f:
            json.dump(js_model, f, indent=2)
        
        print("✅ Model ağırlıkları ai-models/model_weights.json dosyasına kaydedildi!")
        print(f"📊 Toplam katman sayısı: {len(weights)}")
        print(f"🔢 Scaler parametreleri: mean({len(scaler_params['mean'])}), scale({len(scaler_params['scale'])})")
        
    else:
        print("❌ Model ağırlıkları çıkarılamadı!")

if __name__ == "__main__":
    main() 