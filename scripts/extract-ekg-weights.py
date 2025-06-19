#!/usr/bin/env python3
"""
EKG H5 modelinden ağırlıkları çıkarıp JavaScript formatında kaydetme
"""
import h5py
import json
import numpy as np
import pickle

def extract_ekg_weights(h5_path):
    """EKG H5 dosyasından ağırlıkları çıkar"""
    weights = {}
    
    try:
        with h5py.File(h5_path, 'r') as f:
            print("EKG H5 dosyası yapısı:")
            
            def print_structure(name, obj):
                print(f"  {name}: {type(obj)}")
                if isinstance(obj, h5py.Dataset):
                    print(f"    Shape: {obj.shape}, dtype: {obj.dtype}")
            
            f.visititems(print_structure)
            
            # Model ağırlıklarını bul
            model_weights = f.get('model_weights')
            if model_weights:
                print("\nEKG Model ağırlıkları bulundu!")
                
                # CNN katmanları için ağırlıkları çıkar
                layer_names = []
                for key in model_weights.keys():
                    if 'conv1d' in key or 'dense' in key:
                        layer_names.append(key)
                
                layer_names.sort()  # Katmanları sırala
                
                for layer_name in layer_names:
                    try:
                        layer_group = model_weights[layer_name]
                        print(f"\nKatman: {layer_name}")
                        
                        # Katman alt yapısını kontrol et
                        if hasattr(layer_group, 'keys'):
                            for subkey in layer_group.keys():
                                print(f"  Alt grup: {subkey}")
                                subgroup = layer_group[subkey]
                                if hasattr(subgroup, 'keys'):
                                    for subsubkey in subgroup.keys():
                                        print(f"    Alt alt grup: {subsubkey}")
                                        final_group = subgroup[subsubkey]
                                        if hasattr(final_group, 'keys'):
                                            layer_weights = {}
                                            for weight_name in final_group.keys():
                                                if weight_name in ['kernel', 'bias']:
                                                    weight_data = final_group[weight_name][:]
                                                    layer_weights[weight_name] = weight_data.tolist()
                                                    print(f"      {weight_name}: {weight_data.shape}")
                                            
                                            if layer_weights:
                                                weights[layer_name] = layer_weights
                    except Exception as e:
                        print(f"    Katman işleme hatası: {e}")
                        continue
                        
    except Exception as e:
        print(f"EKG H5 okuma hatası: {e}")
        return None
    
    return weights

def extract_ekg_scaler_params(scaler_path):
    """EKG Scaler parametrelerini çıkar"""
    try:
        with open(scaler_path, 'rb') as f:
            scaler = pickle.load(f)
            return {
                'mean': scaler.mean_.tolist(),
                'scale': scaler.scale_.tolist()
            }
    except Exception as e:
        print(f"EKG Scaler okuma hatası: {e}")
        return None

def main():
    print("🫀 EKG Model ağırlıklarını çıkarıyor...")
    
    # EKG H5 modelinden ağırlıkları çıkar
    weights = extract_ekg_weights('ai-models/ecg_model_augmented.h5')
    
    # EKG Scaler parametrelerini çıkar (yoksa varsayılan kullan)
    scaler_params = extract_ekg_scaler_params('ai-models/ekg_scaler.pkl')
    if not scaler_params:
        # Varsayılan scaler parametreleri (genellikle 0 mean, 1 scale)
        scaler_params = {
            'mean': [0.0] * 360,  # EKG için genellikle 360 sample
            'scale': [1.0] * 360
        }
    
    if weights and scaler_params:
        # JavaScript formatında kaydet
        js_model = {
            'weights': weights,
            'scaler': scaler_params,
            'metadata': {
                'input_shape': [180, 1],
                'output_classes': 5,
                'model_type': 'CNN',
                'classes': {
                    0: 'Normal',
                    1: 'Supraventricular', 
                    2: 'Ventricular',
                    3: 'Fusion',
                    4: 'Unknown'
                }
            }
        }
        
        with open('ai-models/ekg_weights.json', 'w') as f:
            json.dump(js_model, f, indent=2)
        
        print("✅ EKG Model ağırlıkları ai-models/ekg_weights.json dosyasına kaydedildi!")
        print(f"📊 Toplam katman sayısı: {len(weights)}")
        print(f"🔢 Scaler parametreleri: mean({len(scaler_params['mean'])}), scale({len(scaler_params['scale'])})")
        
    else:
        print("❌ EKG Model ağırlıkları çıkarılamadı!")

if __name__ == "__main__":
    main() 