import { NativeModules, DeviceEventEmitter } from 'react-native';

const { SamsungHealthModule } = NativeModules;

export class SamsungHealth {
  /**
   * Samsung Health SDK'sını başlat
   */
  static async initialize() {
    return await SamsungHealthModule.initialize();
  }

  /**
   * Samsung Health'e bağlan
   */
  static async connect() {
    return await SamsungHealthModule.connect();
  }

  /**
   * Bağlantı durumunu kontrol et
   */
  static async isConnected() {
    return await SamsungHealthModule.isConnected();
  }

  /**
   * EKG ölçümü başlat
   */
  static async startECGMeasurement() {
    return await SamsungHealthModule.startECGMeasurement();
  }

  /**
   * EKG ölçümünü durdur
   */
  static async stopECGMeasurement() {
    return await SamsungHealthModule.stopECGMeasurement();
  }

  /**
   * Kan basıncı ölçümü başlat
   */
  static async startBloodPressureMeasurement() {
    return await SamsungHealthModule.startBloodPressureMeasurement();
  }

  /**
   * Kan basıncı ölçümünü durdur
   */
  static async stopBloodPressureMeasurement() {
    return await SamsungHealthModule.stopBloodPressureMeasurement();
  }

  /**
   * Kalp atış hızı tracking başlat
   */
  static async startHeartRateTracking() {
    return await SamsungHealthModule.startHeartRateTracking();
  }

  /**
   * Kalp atış hızı tracking durdur
   */
  static async stopHeartRateTracking() {
    return await SamsungHealthModule.stopHeartRateTracking();
  }

  /**
   * SpO2 ölçümü başlat
   */
  static async startSpO2Measurement() {
    return await SamsungHealthModule.startSpO2Measurement();
  }

  /**
   * SpO2 ölçümünü durdur
   */
  static async stopSpO2Measurement() {
    return await SamsungHealthModule.stopSpO2Measurement();
  }

  /**
   * Desteklenen sensörleri getir
   */
  static async getSupportedSensors() {
    return await SamsungHealthModule.getSupportedSensors();
  }

  /**
   * Event listener'ları kaydet
   */
  static addListener(eventName, callback) {
    return DeviceEventEmitter.addListener(eventName, callback);
  }

  /**
   * Event listener'ları kaldır
   */
  static removeListener(eventName, callback) {
    return DeviceEventEmitter.removeListener(eventName, callback);
  }
}

// Event sabitleri
export const SamsungHealthEvents = {
  ECG_DATA: 'samsung_health_ecg_data',
  BLOOD_PRESSURE_DATA: 'samsung_health_blood_pressure_data',
  HEART_RATE_DATA: 'samsung_health_heart_rate_data',
  SPO2_DATA: 'samsung_health_spo2_data',
  CONNECTION_CHANGED: 'samsung_health_connection_changed',
  ERROR: 'samsung_health_error'
};

export default SamsungHealth; 