// Uygulama geneli konfigürasyon ayarları

export const APP_CONFIG = {
  // Mock Data Kontrolü
  USE_MOCK_DATA: false, // true: Mock veriler kullan, false: Gerçek Google Fit verileri kullan
  
  // Veri Öncelik Sistemi
  DATA_PRIORITY: {
    // Kullanıcı manuel girişi her zaman en yüksek öncelik
    USER_INPUT: 1,
    // Google Fit verisi ikinci öncelik (sadece kullanıcı verisi yoksa)
    GOOGLE_FIT: 2,
    // Mock veri en düşük öncelik
    MOCK_DATA: 3
  },
  
  // Debug ayarları
  DEBUG: {
    SHOW_DATA_SOURCE: true, // Verinin kaynağını göster
    LOG_DATA_PRIORITY: true, // Veri öncelik sistemini logla
  }
} as const;

export type AppConfig = typeof APP_CONFIG; 