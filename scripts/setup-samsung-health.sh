#!/bin/bash

# Samsung Health SDK Kurulum Script
echo "🔧 Samsung Health SDK kurulumu başlıyor..."

# Gerekli klasörleri oluştur
echo "📁 Gerekli klasörler oluşturuluyor..."
mkdir -p modules/react-native-samsung-health/android/libs
mkdir -p modules/react-native-samsung-health/android/src/main/java/com/samsunghealth

# AAR dosyasını kontrol et
AAR_FILE="modules/react-native-samsung-health/android/libs/samsung-health-sensor-api.aar"
if [ ! -f "$AAR_FILE" ]; then
    echo "❌ HATA: Samsung Health SDK AAR dosyası bulunamadı!"
    echo "📋 Lütfen aşağıdaki adımları takip edin:"
    echo "   1. https://developer.samsung.com/health/sensor adresine gidin"
    echo "   2. Samsung Health Sensor SDK v1.3.0'ı indirin"
    echo "   3. samsung-health-sensor-api.aar dosyasını şu konuma kopyalayın:"
    echo "      $AAR_FILE"
    echo ""
    echo "💡 Manuel kurulum için:"
    echo "   cp /path/to/samsung-health-sensor-api.aar $AAR_FILE"
    exit 1
else
    echo "✅ Samsung Health SDK AAR dosyası bulundu: $AAR_FILE"
fi

# Package dependencies
echo "📦 Dependencies yükleniyor..."
cd modules/react-native-samsung-health
npm install
cd ../..

echo "📱 Ana proje dependencies yükleniyor..."
npm install

# Android build
echo "🏗️ Android projesi hazırlanıyor..."
cd android
./gradlew clean
cd ..

echo "✅ Samsung Health SDK kurulumu tamamlandı!"
echo ""
echo "📋 Sonraki adımlar:"
echo "   1. Samsung Developer Portal'da hesap oluşturun"
echo "   2. Samsung Health Partner Program'a katılın"
echo "   3. Galaxy Watch'ı Developer Mode'a alın"
echo "   4. npm run android ile projeyi çalıştırın"
echo ""
echo "📖 Detaylı kurulum rehberi: docs/SAMSUNG_HEALTH_SETUP.md" 