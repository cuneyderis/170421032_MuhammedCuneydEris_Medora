import { NativeModules, NativeEventEmitter, EmitterSubscription, Platform } from 'react-native';

// Web fallback için mock module
const MockSamsungHealthModule = {
  connectService: () => Promise.resolve({ success: false, message: "Samsung Health not available on web" }),
  disconnectService: () => Promise.resolve({ success: false, message: "Samsung Health not available on web" }),
  getCapabilities: () => Promise.resolve({ success: false, message: "Samsung Health not available on web" }),
  startEcgMeasurement: () => Promise.resolve({ success: false, message: "Samsung Health not available on web" }),
  stopEcgMeasurement: () => Promise.resolve({ success: false, message: "Samsung Health not available on web" }),
  startSpo2Measurement: () => Promise.resolve({ success: false, message: "Samsung Health not available on web" }),
  stopSpo2Measurement: () => Promise.resolve({ success: false, message: "Samsung Health not available on web" }),
  startHeartRateTracking: () => Promise.resolve({ success: false, message: "Samsung Health not available on web" }),
  stopHeartRateTracking: () => Promise.resolve({ success: false, message: "Samsung Health not available on web" }),
  setUserProfile: () => Promise.resolve({ success: false, message: "Samsung Health not available on web" }),
  getHistoricalHeartRateData: () => Promise.resolve({ success: false, message: "Samsung Health not available on web" }),
  getHistoricalStepsData: () => Promise.resolve({ success: false, message: "Samsung Health not available on web" }),
  getHistoricalSleepData: () => Promise.resolve({ success: false, message: "Samsung Health not available on web" }),
  getHistoricalSpo2Data: () => Promise.resolve({ success: false, message: "Samsung Health not available on web" }),
  getTodayHeartRateData: () => Promise.resolve({ success: false, message: "Samsung Health not available on web" }),
  getTodayStepsData: () => Promise.resolve({ success: false, message: "Samsung Health not available on web" }),
  getTodaySpo2Data: () => Promise.resolve({ success: false, message: "Samsung Health not available on web" }),
};

const SamsungHealthModule = Platform.OS === 'web' ? MockSamsungHealthModule : NativeModules.SamsungHealthModule;

// Samsung Health SDK Event Types
export interface SamsungHealthEcgData {
  timestamp: number;
  status: string;
  ecgData?: number[];
}

export interface SamsungHealthSpo2Data {
  timestamp: number;
  status: string;
  oxygenSaturation?: number;
}

export interface SamsungHealthHeartRateData {
  timestamp: number;
  heartRate?: number;
  status: string;
  ibiList?: number[];
}

export interface SamsungHealthStepsData {
  timestamp: number;
  steps: number;
  date: string;
}

export interface SamsungHealthSleepData {
  timestamp: number;
  sleepDuration: number; // minutes
  sleepQuality?: string;
  date: string;
}

export interface SamsungHealthHistoricalData {
  heartRate: SamsungHealthHeartRateData[];
  steps: SamsungHealthStepsData[];
  sleep: SamsungHealthSleepData[];
  spo2: SamsungHealthSpo2Data[];
}

export interface SamsungHealthCapabilities {
  ecgSupported: boolean;
  spo2Supported: boolean;
  heartRateSupported: boolean;
}

export interface SamsungHealthError {
  error: string;
}

// Event Types
export type SamsungHealthEventType = 
  | 'onEcgData'
  | 'onEcgError'
  | 'onSpo2Data'
  | 'onSpo2Error'
  | 'onHeartRateData'
  | 'onHeartRateError';

// Samsung Health SDK Status Constants
export const SAMSUNG_HEALTH_CONSTANTS = {
  // Gender
  GENDER_MALE: 1,
  GENDER_FEMALE: 2,
};

export class SamsungHealthService {
  private eventEmitter: NativeEventEmitter;
  private eventListeners: Map<string, EmitterSubscription[]> = new Map();
  private isConnected = false;

  constructor() {
    this.eventEmitter = new NativeEventEmitter(SamsungHealthModule);
  }

  /**
   * Connect to Samsung Health Service
   */
  async connect(): Promise<void> {
    try {
      const result = await SamsungHealthModule.connectService();
      console.log('Samsung Health SDK connected:', result.message);
      this.isConnected = result.success;
    } catch (error) {
      console.error('Failed to connect to Samsung Health Service:', error);
      throw error;
    }
  }

  /**
   * Check device capabilities
   */
  async getCapabilities(): Promise<SamsungHealthCapabilities> {
    try {
      const result = await SamsungHealthModule.getCapabilities();
      if (result.success) {
        return result.data;
      } else {
        throw new Error('Failed to get capabilities');
      }
    } catch (error) {
      console.error('Failed to get capabilities:', error);
      throw error;
    }
  }

  /**
   * Set user profile for better accuracy
   */
  async setUserProfile(weight: number, height: number, age: number, gender: number): Promise<void> {
    try {
      const result = await SamsungHealthModule.setUserProfile(weight, height, age, gender);
      console.log('User profile result:', result.message);
    } catch (error) {
      console.error('Failed to set user profile:', error);
      throw error;
    }
  }

  /**
   * Start ECG measurement
   */
  async startEcgMeasurement(): Promise<void> {
    try {
      const result = await SamsungHealthModule.startEcgMeasurement();
      console.log('ECG measurement result:', result.message);
    } catch (error) {
      console.error('Failed to start ECG measurement:', error);
      throw error;
    }
  }

  /**
   * Stop ECG measurement
   */
  async stopEcgMeasurement(): Promise<void> {
    try {
      const result = await SamsungHealthModule.stopEcgMeasurement();
      console.log('ECG measurement stopped:', result.message);
    } catch (error) {
      console.error('Failed to stop ECG measurement:', error);
      throw error;
    }
  }

  /**
   * Start SpO2 measurement
   */
  async startSpo2Measurement(): Promise<void> {
    try {
      const result = await SamsungHealthModule.startSpo2Measurement();
      console.log('SpO2 measurement result:', result.message);
    } catch (error) {
      console.error('Failed to start SpO2 measurement:', error);
      throw error;
    }
  }

  /**
   * Stop SpO2 measurement
   */
  async stopSpo2Measurement(): Promise<void> {
    try {
      const result = await SamsungHealthModule.stopSpo2Measurement();
      console.log('SpO2 measurement stopped:', result.message);
    } catch (error) {
      console.error('Failed to stop SpO2 measurement:', error);
      throw error;
    }
  }

  /**
   * Start heart rate tracking
   */
  async startHeartRateTracking(): Promise<void> {
    try {
      const result = await SamsungHealthModule.startHeartRateTracking();
      console.log('Heart rate tracking result:', result.message);
    } catch (error) {
      console.error('Failed to start heart rate tracking:', error);
      throw error;
    }
  }

  /**
   * Stop heart rate tracking
   */
  async stopHeartRateTracking(): Promise<void> {
    try {
      const result = await SamsungHealthModule.stopHeartRateTracking();
      console.log('Heart rate tracking stopped:', result.message);
    } catch (error) {
      console.error('Failed to stop heart rate tracking:', error);
      throw error;
    }
  }

  /**
   * Add event listener for Samsung Health events
   */
  addListener<T>(
    eventType: SamsungHealthEventType,
    listener: (data: T) => void
  ): EmitterSubscription {
    const subscription = this.eventEmitter.addListener(eventType, listener);
    
    // Store subscription for cleanup
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(subscription);
    
    return subscription;
  }

  /**
   * Add event listener (alias for addListener)
   */
  addEventListener<T>(
    eventType: SamsungHealthEventType,
    listener: (data: T) => void
  ): EmitterSubscription {
    return this.addListener(eventType, listener);
  }

  /**
   * Remove specific event listener
   */
  removeEventListener(subscription: EmitterSubscription): void {
    subscription.remove();
    
    // Remove from stored subscriptions
    for (const [eventType, subscriptions] of this.eventListeners.entries()) {
      const index = subscriptions.indexOf(subscription);
      if (index > -1) {
        subscriptions.splice(index, 1);
        if (subscriptions.length === 0) {
          this.eventListeners.delete(eventType);
        }
        break;
      }
    }
  }

  /**
   * Remove all listeners for specific event type or all events
   */
  removeAllListeners(eventType?: SamsungHealthEventType): void {
    if (eventType) {
      // Remove listeners for specific event type
      const subscriptions = this.eventListeners.get(eventType);
      if (subscriptions) {
        subscriptions.forEach(subscription => subscription.remove());
        this.eventListeners.delete(eventType);
      }
      this.eventEmitter.removeAllListeners(eventType);
    } else {
      // Remove all listeners
      for (const subscriptions of this.eventListeners.values()) {
        subscriptions.forEach(subscription => subscription.remove());
      }
      this.eventListeners.clear();
      
      // Remove all listeners from the native event emitter
      const eventTypes: SamsungHealthEventType[] = ['onEcgData', 'onEcgError', 'onSpo2Data', 'onSpo2Error', 'onHeartRateData', 'onHeartRateError'];
      eventTypes.forEach(eventType => {
        this.eventEmitter.removeAllListeners(eventType);
      });
    }
  }

  /**
   * Disconnect from Samsung Health Service
   */
  async disconnect(): Promise<void> {
    try {
      // Remove all event listeners
      this.removeAllListeners();
      
      // Disconnect service
      const result = await SamsungHealthModule.disconnectService();
      console.log('Samsung Health SDK disconnected:', result.message);
      this.isConnected = false;
    } catch (error) {
      console.error('Failed to disconnect from Samsung Health Service:', error);
      throw error;
    }
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): { isConnected: boolean } {
    return { isConnected: this.isConnected };
  }

  /**
   * Get readable text for ECG status
   */
  getEcgStatusText(status: string): string {
    switch (status.toLowerCase()) {
      case 'no_data_flush':
        return 'No data to flush';
      case 'optimal_result':
        return 'Optimal ECG measurement';
      case 'irregular_hr':
        return 'Irregular heart rhythm detected';
      case 'finger_not_detected':
        return 'Please place finger on sensor';
      case 'unreliable_data':
        return 'Unreliable ECG data';
      default:
        return `Unknown ECG status: ${status}`;
    }
  }

  /**
   * Get readable text for SpO2 status
   */
  getSpo2StatusText(status: string): string {
    switch (status.toLowerCase()) {
      case 'no_data_flush':
        return 'No data to flush';
      case 'optimal_result':
        return 'Optimal SpO2 measurement';
      case 'finger_not_detected':
        return 'Please place finger on sensor';
      case 'unreliable_data':
        return 'Unreliable SpO2 data';
      default:
        return `Unknown SpO2 status: ${status}`;
    }
  }

  /**
   * Get readable text for heart rate status
   */
  getHeartRateStatusText(status: string): string {
    switch (status.toLowerCase()) {
      case 'no_data_flush':
        return 'No data to flush';
      case 'optimal_result':
        return 'Optimal heart rate measurement';
      case 'unreliable_data':
        return 'Unreliable heart rate data';
      default:
        return `Unknown heart rate status: ${status}`;
    }
  }

  /**
   * Get historical heart rate data
   */
  async getHistoricalHeartRateData(startDate: Date, endDate: Date): Promise<SamsungHealthHeartRateData[]> {
    try {
      if (!this.isConnected) {
        throw new Error('Samsung Health service not connected');
      }

      const result = await SamsungHealthModule.getHistoricalHeartRateData(
        startDate.getTime(),
        endDate.getTime()
      );
      
      if (result.success) {
        return result.data || [];
      } else {
        throw new Error(result.message || 'Failed to get historical heart rate data');
      }
    } catch (error) {
      console.error('Failed to get historical heart rate data:', error);
      throw error;
    }
  }

  /**
   * Get historical steps data
   */
  async getHistoricalStepsData(startDate: Date, endDate: Date): Promise<SamsungHealthStepsData[]> {
    try {
      if (!this.isConnected) {
        throw new Error('Samsung Health service not connected');
      }

      const result = await SamsungHealthModule.getHistoricalStepsData(
        startDate.getTime(),
        endDate.getTime()
      );
      
      if (result.success) {
        return result.data || [];
      } else {
        throw new Error(result.message || 'Failed to get historical steps data');
      }
    } catch (error) {
      console.error('Failed to get historical steps data:', error);
      throw error;
    }
  }

  /**
   * Get historical sleep data
   */
  async getHistoricalSleepData(startDate: Date, endDate: Date): Promise<SamsungHealthSleepData[]> {
    try {
      if (!this.isConnected) {
        throw new Error('Samsung Health service not connected');
      }

      const result = await SamsungHealthModule.getHistoricalSleepData(
        startDate.getTime(),
        endDate.getTime()
      );
      
      if (result.success) {
        return result.data || [];
      } else {
        throw new Error(result.message || 'Failed to get historical sleep data');
      }
    } catch (error) {
      console.error('Failed to get historical sleep data:', error);
      throw error;
    }
  }

  /**
   * Get historical SpO2 data
   */
  async getHistoricalSpo2Data(startDate: Date, endDate: Date): Promise<SamsungHealthSpo2Data[]> {
    try {
      if (!this.isConnected) {
        throw new Error('Samsung Health service not connected');
      }

      const result = await SamsungHealthModule.getHistoricalSpo2Data(
        startDate.getTime(),
        endDate.getTime()
      );
      
      if (result.success) {
        return result.data || [];
      } else {
        throw new Error(result.message || 'Failed to get historical SpO2 data');
      }
    } catch (error) {
      console.error('Failed to get historical SpO2 data:', error);
      throw error;
    }
  }

  /**
   * Get all historical data at once
   */
  async getAllHistoricalData(startDate: Date, endDate: Date): Promise<SamsungHealthHistoricalData> {
    try {
      const [heartRate, steps, sleep, spo2] = await Promise.all([
        this.getHistoricalHeartRateData(startDate, endDate),
        this.getHistoricalStepsData(startDate, endDate),
        this.getHistoricalSleepData(startDate, endDate),
        this.getHistoricalSpo2Data(startDate, endDate)
      ]);

      return {
        heartRate,
        steps,
        sleep,
        spo2
      };
    } catch (error) {
      console.error('Failed to get all historical data:', error);
      return {
        heartRate: [],
        steps: [],
        sleep: [],
        spo2: []
      };
    }
  }

  /**
   * Get today's heart rate data
   */
  async getTodayHeartRateData(): Promise<SamsungHealthHeartRateData[]> {
    try {
      if (!this.isConnected) {
        throw new Error('Samsung Health service not connected');
      }

      const result = await SamsungHealthModule.getTodayHeartRateData();
      
      if (result.success) {
        return result.data || [];
      } else {
        throw new Error(result.message || 'Failed to get today\'s heart rate data');
      }
    } catch (error) {
      console.error('Failed to get today\'s heart rate data:', error);
      throw error;
    }
  }

  /**
   * Get today's steps data
   */
  async getTodayStepsData(): Promise<{ steps: number; timestamp: number }> {
    try {
      if (!this.isConnected) {
        throw new Error('Samsung Health service not connected');
      }

      const result = await SamsungHealthModule.getTodayStepsData();
      
      if (result.success) {
        return {
          steps: result.steps || 0,
          timestamp: result.timestamp || Date.now()
        };
      } else {
        throw new Error(result.message || 'Failed to get today\'s steps data');
      }
    } catch (error) {
      console.error('Failed to get today\'s steps data:', error);
      throw error;
    }
  }

  /**
   * Get today's SpO2 data
   */
  async getTodaySpo2Data(): Promise<SamsungHealthSpo2Data[]> {
    try {
      if (!this.isConnected) {
        throw new Error('Samsung Health service not connected');
      }

      const result = await SamsungHealthModule.getTodaySpo2Data();
      
      if (result.success) {
        return result.data || [];
      } else {
        throw new Error(result.message || 'Failed to get today\'s SpO2 data');
      }
    } catch (error) {
      console.error('Failed to get today\'s SpO2 data:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const samsungHealthService = new SamsungHealthService();
export default samsungHealthService; 