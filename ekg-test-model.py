import numpy as np
import pandas as pd
from tensorflow.keras.models import load_model
from tensorflow.keras.utils import to_categorical
from sklearn.metrics import classification_report, confusion_matrix
import seaborn as sns
import matplotlib.pyplot as plt
import json
import os
from datetime import datetime

# Sonuçları kaydetmek için klasör oluştur
results_dir = 'ekg_model_results'
if not os.path.exists(results_dir):
    os.makedirs(results_dir)

# Test verisini yükle
print("Test verisi yükleniyor...")
test_df = pd.read_csv('mitbih_test.csv')

# Verileri ve etiketleri ayır
X_test = test_df.iloc[:, :-1].values
y_test = test_df.iloc[:, -1].values

print(f"Test verisi boyutu: {X_test.shape}")
print(f"Sınıf dağılımı: {np.bincount(y_test)}")

# Verileri yeniden şekillendir (CNN için gerekli)
X_test = X_test.reshape(X_test.shape[0], X_test.shape[1], 1)

# Etiketleri one-hot encoding formatına dönüştür
y_test_categorical = to_categorical(y_test)

# En iyi modeli yükle
print("En iyi model yükleniyor...")
model = load_model('best_augmented_model.h5')

# Model mimarisini kaydet
model_summary = []
model.summary(print_fn=lambda x: model_summary.append(x))

# Modeli test et
print("Model test ediliyor...")
test_loss, test_accuracy = model.evaluate(X_test, y_test_categorical, verbose=1)
print(f"\nTest doğruluğu: {test_accuracy:.4f}")
print(f"Test kaybı: {test_loss:.4f}")

# Tahminleri yap
print("Tahminler yapılıyor...")
y_pred = model.predict(X_test)
y_pred_classes = np.argmax(y_pred, axis=1)
y_test_classes = np.argmax(y_test_categorical, axis=1)

# Sınıf isimleri ve açıklamaları
class_info = {
    0: {'name': 'Normal', 'description': 'Normal kalp ritmi', 'risk_level': 'low'},
    1: {'name': 'Supraventricular', 'description': 'Supraventriküler aritmiler', 'risk_level': 'medium'},
    2: {'name': 'Ventricular', 'description': 'Ventriküler aritmiler', 'risk_level': 'high'},
    3: {'name': 'Fusion', 'description': 'Füzyon ritmi', 'risk_level': 'medium'},
    4: {'name': 'Unknown', 'description': 'Bilinmeyen ritim', 'risk_level': 'medium'}
}

class_names = [class_info[i]['name'] for i in range(5)]

# Sınıflandırma raporu
print("\nSınıflandırma Raporu:")
class_report = classification_report(y_test_classes, y_pred_classes, 
                                   target_names=class_names, output_dict=True)
print(classification_report(y_test_classes, y_pred_classes, target_names=class_names))

# Her sınıf için detaylı analiz
class_accuracies = {}
for i, class_name in enumerate(class_names):
    class_mask = y_test_classes == i
    if np.sum(class_mask) > 0:
        class_acc = np.mean(y_pred_classes[class_mask] == i)
        class_accuracies[class_name] = class_acc
        print(f"{class_name} doğruluğu: {class_acc:.4f}")

# Karmaşıklık matrisini hesapla ve görselleştir
cm = confusion_matrix(y_test_classes, y_pred_classes)
plt.figure(figsize=(12, 10))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
            xticklabels=class_names, yticklabels=class_names,
            cbar_kws={'label': 'Örnek Sayısı'})
plt.title('EKG Sınıflandırma - Karmaşıklık Matrisi\n(Artırılmış Model)', fontsize=16)
plt.xlabel('Tahmin Edilen Sınıf', fontsize=12)
plt.ylabel('Gerçek Sınıf', fontsize=12)
plt.tight_layout()
plt.savefig(os.path.join(results_dir, 'ekg_confusion_matrix.png'), dpi=300, bbox_inches='tight')
plt.close()

# Sınıf dağılımı grafiği
plt.figure(figsize=(10, 6))
unique, counts = np.unique(y_test_classes, return_counts=True)
colors = ['#2E8B57', '#FF6B35', '#DC143C', '#FFD700', '#9370DB']
bars = plt.bar([class_names[i] for i in unique], counts, color=[colors[i] for i in unique])
plt.title('Test Verisinde Sınıf Dağılımı', fontsize=14)
plt.xlabel('EKG Sınıfları', fontsize=12)
plt.ylabel('Örnek Sayısı', fontsize=12)
plt.xticks(rotation=45)

# Bar üzerine değer yazma
for bar, count in zip(bars, counts):
    plt.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 10,
             str(count), ha='center', va='bottom', fontweight='bold')

plt.tight_layout()
plt.savefig(os.path.join(results_dir, 'ekg_class_distribution.png'), dpi=300, bbox_inches='tight')
plt.close()

# Model performans özeti
performance_summary = {
    'model_info': {
        'name': 'EKG Arrhythmia Classification Model',
        'version': '1.0.0',
        'architecture': 'CNN with Data Augmentation',
        'input_shape': [X_test.shape[1], 1],
        'num_classes': 5,
        'model_summary': model_summary
    },
    'test_results': {
        'test_accuracy': float(test_accuracy),
        'test_loss': float(test_loss),
        'total_samples': int(len(X_test)),
        'class_accuracies': {k: float(v) for k, v in class_accuracies.items()}
    },
    'classification_report': class_report,
    'confusion_matrix': cm.tolist(),
    'class_info': class_info,
    'timestamp': datetime.now().isoformat()
}

# Sonuçları JSON olarak kaydet
with open(os.path.join(results_dir, 'ekg_model_results.json'), 'w', encoding='utf-8') as f:
    json.dump(performance_summary, f, indent=2, ensure_ascii=False)

# React Native için model konfigürasyonu
rn_config = {
    'ekg_model': {
        'name': 'EKG Arrhythmia Classification',
        'description': 'MIT-BIH veritabanı ile eğitilmiş EKG aritmisi sınıflandırma modeli',
        'version': '1.0.0',
        'accuracy': float(test_accuracy),
        'input_length': int(X_test.shape[1]),
        'classes': class_info,
        'preprocessing': {
            'reshape': [X_test.shape[1], 1],
            'normalization': 'standard',
            'data_type': 'float32'
        },
        'risk_mapping': {
            'Normal': 'low',
            'Supraventricular': 'medium', 
            'Ventricular': 'high',
            'Fusion': 'medium',
            'Unknown': 'medium'
        }
    }
}

# React Native config dosyasını güncelle
config_path = os.path.join('ai-models', 'model_config.json')
if os.path.exists(config_path):
    with open(config_path, 'r', encoding='utf-8') as f:
        existing_config = json.load(f)
    existing_config.update(rn_config)
else:
    existing_config = rn_config

with open(config_path, 'w', encoding='utf-8') as f:
    json.dump(existing_config, f, indent=2, ensure_ascii=False)

print(f"\n✅ Tüm sonuçlar '{results_dir}' klasörüne kaydedildi!")
print(f"📊 Test doğruluğu: {test_accuracy:.4f}")
print(f"📁 Dosyalar:")
print(f"   - ekg_model_results.json: Detaylı test sonuçları")
print(f"   - ekg_confusion_matrix.png: Karmaşıklık matrisi")
print(f"   - ekg_class_distribution.png: Sınıf dağılımı")
print(f"   - ../ai-models/model_config.json: React Native konfigürasyonu")

# Model dosyasını React Native projesine kopyala
import shutil
try:
    if os.path.exists('best_augmented_model.h5'):
        shutil.copy('best_augmented_model.h5', os.path.join('ai-models', 'ekg_model.h5'))
        print(f"   - ekg_model.h5: Model dosyası React Native projesine kopyalandı")
except Exception as e:
    print(f"⚠️  Model dosyası kopyalanamadı: {e}")

print("\n🚀 React Native entegrasyonu için hazır!") 