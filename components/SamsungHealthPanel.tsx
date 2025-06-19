import { StyleSheet, View, Alert, TouchableOpacity, ScrollView } from 'react-native';
import React, { useState, useEffect } from 'react';
import Typo from './Typo';
import Button from './Button';
import { colors, spacingX, spacingY } from '@/constants/theme';
import { verticalScale } from '@/utils/styling';
import * as Icons from 'phosphor-react-native';
import { 
  SamsungHealthEcgData,
  SamsungHealthSpo2Data,
  SamsungHealthHeartRateData,
  SamsungHealthHistoricalData,
  SamsungHealthService
} from '@/utils/samsungHealthData';

interface SamsungHealthPanelProps {
  isConnected: boolean;
  isConnecting: boolean;
  supportedSensors: string[];
  ecgData: SamsungHealthEcgData[];
  spo2Data: SamsungHealthSpo2Data[];
  heartRateData: SamsungHealthHeartRateData[];
  isMeasuring: { ecg: boolean; spo2: boolean; heartRate: boolean };
  onConnect: () => Promise<void>;
  onStartECG: () => Promise<void>;
  onStopECG: () => Promise<void>;
  onStartSpO2: () => Promise<void>;
  onStopSpO2: () => Promise<void>;
  onStartHeartRate: () => Promise<void>;
  onStopHeartRate: () => Promise<void>;
}

const SamsungHealthPanel: React.FC<SamsungHealthPanelProps> = ({
  isConnected,
  isConnecting,
  supportedSensors,
  ecgData,
  spo2Data,
  heartRateData,
  isMeasuring,
  onConnect,
  onStartECG,
  onStopECG,
  onStartSpO2,
  onStopSpO2,
  onStartHeartRate,
  onStopHeartRate,
}) => {
  const [historicalData, setHistoricalData] = useState<SamsungHealthHistoricalData | null>(null);
  const [loadingHistorical, setLoadingHistorical] = useState(false);
  const [showHistorical, setShowHistorical] = useState(false);
  
  // Günlük veri state'leri
  const [todayData, setTodayData] = useState({
    heartRate: [] as SamsungHealthHeartRateData[],
    steps: { steps: 0, timestamp: 0 },
    spo2: [] as SamsungHealthSpo2Data[],
  });
  const [loadingTodayData, setLoadingTodayData] = useState(false);

  const samsungHealthService = new SamsungHealthService();

  // Günlük verileri yükle
  const loadTodayData = async () => {
    if (!isConnected) {
      Alert.alert('Hata', 'Samsung Health bağlantısı gerekli');
      return;
    }
    
    setLoadingTodayData(true);
    try {
      const [heartRateData, stepsData, spo2Data] = await Promise.all([
        samsungHealthService.getTodayHeartRateData().catch(() => []),
        samsungHealthService.getTodayStepsData().catch(() => ({ steps: 0, timestamp: 0 })),
        samsungHealthService.getTodaySpo2Data().catch(() => [])
      ]);

      setTodayData({
        heartRate: heartRateData,
        steps: stepsData,
        spo2: spo2Data
      });
      
      Alert.alert('Başarılı', 'Günlük veriler yüklendi!');
    } catch (error) {
      console.error('Günlük veriler yüklenemedi:', error);
      Alert.alert('Hata', 'Günlük veriler yüklenemedi. Samsung Health bağlantısını kontrol edin.');
    } finally {
      setLoadingTodayData(false);
    }
  };

  // Geçmiş verileri yükle
  const loadHistoricalData = async () => {
    if (!isConnected) {
      Alert.alert('Hata', 'Samsung Health bağlantısı gerekli');
      return;
    }
    
    setLoadingHistorical(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7); // Son 7 gün

      const data = await samsungHealthService.getAllHistoricalData(startDate, endDate);
      setHistoricalData(data);
      setShowHistorical(true);
      
      // Veri sayısını kontrol et ve kullanıcıya bilgi ver
      const totalData = data.heartRate.length + data.steps.length + data.sleep.length + data.spo2.length;
      if (totalData === 0) {
        Alert.alert('Bilgi', 'Son 7 günde Samsung Health\'ten veri bulunamadı. Gerçek Samsung Health verilerini görmek için uygulamayı yeniden build etmeniz gerekebilir.');
      } else {
        Alert.alert('Başarılı', `${totalData} adet geçmiş veri yüklendi.`);
      }
    } catch (error) {
      console.error('Geçmiş veriler yüklenemedi:', error);
      Alert.alert('Hata', 'Geçmiş veriler yüklenemedi. Samsung Health native fonksiyonları henüz build edilmemiş olabilir.');
    } finally {
      setLoadingHistorical(false);
    }
  };

  const handleECGPress = async () => {
    try {
      if (isMeasuring.ecg) {
        await onStopECG();
      } else {
        await onStartECG();
      }
    } catch (error) {
      Alert.alert('Hata', 'EKG işlemi gerçekleştirilemedi');
    }
  };

  const handleSpO2Press = async () => {
    try {
      if (isMeasuring.spo2) {
        await onStopSpO2();
      } else {
        await onStartSpO2();
      }
    } catch (error) {
      Alert.alert('Hata', 'SpO2 işlemi gerçekleştirilemedi');
    }
  };

  const handleHeartRatePress = async () => {
    try {
      if (isMeasuring.heartRate) {
        await onStopHeartRate();
      } else {
        await onStartHeartRate();
      }
    } catch (error) {
      Alert.alert('Hata', 'Nabız ölçümü gerçekleştirilemedi');
    }
  };

  return (
    <View style={styles.container}>
      {/* Bağlantı Durumu Kartı */}
      <View style={[styles.connectionCard, isConnected && styles.connectedCard]}>
        <View style={styles.connectionHeader}>
          <Icons.Heart size={verticalScale(24)} color={isConnected ? colors.primary : colors.textLighter} />
          <View style={styles.connectionInfo}>
            <Typo size={16} fontWeight="600">Samsung Health</Typo>
            <View style={styles.connectionStatus}>
              <View style={[styles.statusDot, isConnected && styles.connectedDot]} />
              <Typo size={14} color={isConnected ? colors.primary : colors.textLighter}>
                {isConnected ? 'Bağlı' : 'Bağlı Değil'}
              </Typo>
            </View>
          </View>
          {!isConnected && (
            <Button 
              onPress={onConnect} 
              loading={isConnecting} 
              style={styles.connectButton}
            >
              <Typo fontWeight="600" color={colors.white} size={14}>
                Bağlan
              </Typo>
            </Button>
          )}
        </View>

        {isConnected && supportedSensors.length > 0 && (
          <View style={styles.sensorsContainer}>
            <Typo size={12} color={colors.textLighter} style={styles.sensorsLabel}>
              Desteklenen Sensörler:
            </Typo>
            <View style={styles.sensorsList}>
              {supportedSensors.map((sensor, index) => (
                <View key={index} style={styles.sensorChip}>
                  <Typo size={10} color={colors.primary} fontWeight="600">
                    {sensor}
                  </Typo>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Sensör Kontrolleri */}
      {isConnected && (
        <View style={styles.controlsContainer}>
          <Typo size={18} fontWeight="700" style={styles.sectionTitle}>
            Sensör Kontrolleri
          </Typo>
          
          {/* EKG Kontrolü */}
          {supportedSensors.includes('ECG') && (
            <View style={styles.sensorControlCard}>
              <View style={styles.sensorControlHeader}>
                <Icons.Pulse size={verticalScale(24)} color={colors.rose} />
                <View style={styles.sensorInfo}>
                  <Typo size={16} fontWeight="600">EKG Ölçümü</Typo>
                  <Typo size={12} color={colors.textLighter}>
                    Elektrokardiyogram (30 saniye)
                  </Typo>
                </View>
                <Button 
                  onPress={handleECGPress}
                  style={isMeasuring.ecg ? [styles.sensorButton, styles.activeSensorButton] : styles.sensorButton}
                >
                  <Typo fontWeight="600" color={isMeasuring.ecg ? colors.white : colors.rose}>
                    {isMeasuring.ecg ? 'Durdur' : 'Başlat'}
                  </Typo>
                </Button>
              </View>
              
              {ecgData.length > 0 && (
                <View style={styles.sensorDataPreview}>
                  <View style={styles.dataRow}>
                    <Icons.Clock size={verticalScale(16)} color={colors.textLighter} />
                    <Typo size={12} color={colors.textLighter} style={{ marginLeft: spacingX._5 }}>
                      Son EKG: {new Date(ecgData[ecgData.length - 1].timestamp).toLocaleTimeString('tr-TR')}
                    </Typo>
                  </View>
                  <View style={styles.dataRow}>
                    <Icons.ChartLine size={verticalScale(16)} color={colors.green} />
                    <Typo size={12} color={colors.green} style={{ marginLeft: spacingX._5 }}>
                      {ecgData.length} ölçüm kaydedildi
                    </Typo>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* SpO2 Kontrolü */}
          {supportedSensors.includes('SpO2') && (
            <View style={styles.sensorControlCard}>
              <View style={styles.sensorControlHeader}>
                <Icons.Drop size={verticalScale(24)} color={colors.secondary} />
                <View style={styles.sensorInfo}>
                  <Typo size={16} fontWeight="600">SpO2 Ölçümü</Typo>
                  <Typo size={12} color={colors.textLighter}>
                    Kan oksijen saturasyonu (15 saniye)
                  </Typo>
                </View>
                <Button 
                  onPress={handleSpO2Press}
                  style={isMeasuring.spo2 ? [styles.sensorButton, styles.activeSensorButton] : styles.sensorButton}
                >
                  <Typo fontWeight="600" color={isMeasuring.spo2 ? colors.white : colors.secondary}>
                    {isMeasuring.spo2 ? 'Durdur' : 'Başlat'}
                  </Typo>
                </Button>
              </View>
              
              {spo2Data.length > 0 && (
                <View style={styles.sensorDataPreview}>
                  <View style={styles.dataRow}>
                    <Icons.Clock size={verticalScale(16)} color={colors.textLighter} />
                    <Typo size={12} color={colors.textLighter} style={{ marginLeft: spacingX._5 }}>
                      Son SpO2: {new Date(spo2Data[spo2Data.length - 1].timestamp).toLocaleTimeString('tr-TR')}
                    </Typo>
                  </View>
                  <View style={styles.dataRow}>
                    <Icons.Percent size={verticalScale(16)} color={colors.secondary} />
                    <Typo size={12} color={colors.secondary} style={{ marginLeft: spacingX._5 }}>
                      %{spo2Data[spo2Data.length - 1].oxygenSaturation}
                    </Typo>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Heart Rate Kontrolü */}
          {supportedSensors.includes('Heart Rate') && (
            <View style={styles.sensorControlCard}>
              <View style={styles.sensorControlHeader}>
                <Icons.Heart size={verticalScale(24)} color={colors.primary} weight="fill" />
                <View style={styles.sensorInfo}>
                  <Typo size={16} fontWeight="600">Kalp Atışı Takibi</Typo>
                  <Typo size={12} color={colors.textLighter}>
                    Sürekli kalp atışı izleme
                  </Typo>
                </View>
                <Button 
                  onPress={handleHeartRatePress}
                  style={isMeasuring.heartRate ? [styles.sensorButton, styles.activeSensorButton] : styles.sensorButton}
                >
                  <Typo fontWeight="600" color={isMeasuring.heartRate ? colors.white : colors.primary}>
                    {isMeasuring.heartRate ? 'Durdur' : 'Başlat'}
                  </Typo>
                </Button>
              </View>
              
              {heartRateData.length > 0 && (
                <View style={styles.sensorDataPreview}>
                  <View style={styles.dataRow}>
                    <Icons.Clock size={verticalScale(16)} color={colors.textLighter} />
                    <Typo size={12} color={colors.textLighter} style={{ marginLeft: spacingX._5 }}>
                      Son Nabız: {new Date(heartRateData[heartRateData.length - 1].timestamp).toLocaleTimeString('tr-TR')}
                    </Typo>
                  </View>
                  <View style={styles.dataRow}>
                    <Icons.Heart size={verticalScale(16)} color={colors.primary} />
                    <Typo size={12} color={colors.primary} style={{ marginLeft: spacingX._5 }}>
                      {heartRateData[heartRateData.length - 1].heartRate} BPM
                    </Typo>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Günlük Veriler Bölümü */}
          <View style={styles.historicalSection}>
            <View style={styles.historicalHeader}>
              <Typo size={16} fontWeight="600">Günlük Veriler</Typo>
              <Button 
                onPress={loadTodayData} 
                loading={loadingTodayData}
                style={styles.historicalButton}
              >
                <Typo fontWeight="600" color={colors.white} size={12}>
                  Yükle
                </Typo>
              </Button>
            </View>

            {/* Günlük Adım Sayısı */}
            {todayData.steps.steps > 0 && (
              <View style={styles.historicalCard}>
                <View style={styles.historicalCardHeader}>
                  <Icons.Footprints size={verticalScale(20)} color={colors.green} />
                  <Typo size={14} fontWeight="600" style={{ marginLeft: spacingX._10 }}>
                    Bugünkü Adımlar
                  </Typo>
                </View>
                <View style={styles.historicalItem}>
                  <Typo size={12} color={colors.textLighter}>
                    {new Date(todayData.steps.timestamp).toLocaleTimeString('tr-TR')}
                  </Typo>
                  <Typo size={18} fontWeight="700" color={colors.green}>
                    {todayData.steps.steps.toLocaleString()} adım
                  </Typo>
                </View>
              </View>
            )}

            {/* Günlük Nabız Verileri */}
            {todayData.heartRate.length > 0 && (
              <View style={styles.historicalCard}>
                <View style={styles.historicalCardHeader}>
                  <Icons.Heart size={verticalScale(20)} color={colors.rose} />
                  <Typo size={14} fontWeight="600" style={{ marginLeft: spacingX._10 }}>
                    Bugünkü Nabız ({todayData.heartRate.length} ölçüm)
                  </Typo>
                </View>
                <View style={styles.historicalList}>
                  {todayData.heartRate.slice(-5).map((data, index) => (
                    <View key={index} style={styles.historicalItem}>
                      <Typo size={12} color={colors.textLighter}>
                        {new Date(data.timestamp).toLocaleTimeString('tr-TR')}
                      </Typo>
                      <Typo size={14} fontWeight="600" color={colors.rose}>
                        {data.heartRate} BPM
                      </Typo>
                    </View>
                  ))}
                </View>
              </View>
            )}

                         {/* Günlük SpO2 Verileri */}
             {todayData.spo2.length > 0 && (
               <View style={styles.historicalCard}>
                 <View style={styles.historicalCardHeader}>
                   <Icons.Drop size={verticalScale(20)} color={colors.secondary} />
                   <Typo size={14} fontWeight="600" style={{ marginLeft: spacingX._10 }}>
                     Bugünkü SpO2 ({todayData.spo2.length} ölçüm)
                   </Typo>
                 </View>
                 <View style={styles.historicalList}>
                   {todayData.spo2.slice(-3).map((data, index) => (
                     <View key={index} style={styles.historicalItem}>
                       <Typo size={12} color={colors.textLighter}>
                         {new Date(data.timestamp).toLocaleTimeString('tr-TR')}
                       </Typo>
                       <Typo size={14} fontWeight="600" color={colors.secondary}>
                         {data.oxygenSaturation}%
                       </Typo>
                     </View>
                   ))}
                 </View>
               </View>
             )}
          </View>

          {/* Geçmiş Veriler Bölümü */}
          <View style={styles.historicalSection}>
            <View style={styles.historicalHeader}>
              <Typo size={16} fontWeight="600">Geçmiş Veriler (7 Gün)</Typo>
              <Button 
                onPress={loadHistoricalData}
                loading={loadingHistorical}
                style={styles.historicalButton}
              >
                <Typo fontWeight="600" color={colors.primary} size={12}>
                  Son 7 Gün
                </Typo>
              </Button>
            </View>

            {showHistorical && historicalData && (
              <ScrollView style={styles.historicalData} showsVerticalScrollIndicator={false}>
                {/* Nabız Geçmişi */}
                {historicalData.heartRate.length > 0 && (
                  <View style={styles.historicalCard}>
                    <View style={styles.historicalCardHeader}>
                      <Icons.Heart size={verticalScale(20)} color={colors.primary} />
                      <Typo size={14} fontWeight="600" style={{ marginLeft: spacingX._10 }}>
                        Nabız Geçmişi ({historicalData.heartRate.length} ölçüm)
                      </Typo>
                    </View>
                    <View style={styles.historicalList}>
                      {historicalData.heartRate.slice(-5).map((data, index) => (
                        <View key={index} style={styles.historicalItem}>
                          <Typo size={12} color={colors.textLighter}>
                            {new Date(data.timestamp).toLocaleDateString('tr-TR')} - {new Date(data.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                          </Typo>
                          <Typo size={14} fontWeight="600" color={colors.primary}>
                            {data.heartRate} BPM
                          </Typo>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Adım Geçmişi */}
                {historicalData.steps.length > 0 && (
                  <View style={styles.historicalCard}>
                    <View style={styles.historicalCardHeader}>
                      <Icons.Footprints size={verticalScale(20)} color={colors.green} />
                      <Typo size={14} fontWeight="600" style={{ marginLeft: spacingX._10 }}>
                        Adım Geçmişi ({historicalData.steps.length} gün)
                      </Typo>
                    </View>
                    <View style={styles.historicalList}>
                      {historicalData.steps.slice(-5).map((data, index) => (
                        <View key={index} style={styles.historicalItem}>
                          <Typo size={12} color={colors.textLighter}>
                            {new Date(data.timestamp).toLocaleDateString('tr-TR')}
                          </Typo>
                          <Typo size={14} fontWeight="600" color={colors.green}>
                            {data.steps.toLocaleString()} adım
                          </Typo>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* SpO2 Geçmişi */}
                {historicalData.spo2.length > 0 && (
                  <View style={styles.historicalCard}>
                    <View style={styles.historicalCardHeader}>
                      <Icons.Drop size={verticalScale(20)} color={colors.secondary} />
                      <Typo size={14} fontWeight="600" style={{ marginLeft: spacingX._10 }}>
                        SpO2 Geçmişi ({historicalData.spo2.length} ölçüm)
                      </Typo>
                    </View>
                    <View style={styles.historicalList}>
                      {historicalData.spo2.slice(-5).map((data, index) => (
                        <View key={index} style={styles.historicalItem}>
                          <Typo size={12} color={colors.textLighter}>
                            {new Date(data.timestamp).toLocaleDateString('tr-TR')} - {new Date(data.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                          </Typo>
                          <Typo size={14} fontWeight="600" color={colors.secondary}>
                            %{data.oxygenSaturation}
                          </Typo>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Uyku Geçmişi */}
                {historicalData.sleep.length > 0 && (
                  <View style={styles.historicalCard}>
                    <View style={styles.historicalCardHeader}>
                      <Icons.Moon size={verticalScale(20)} color={colors.rose} />
                      <Typo size={14} fontWeight="600" style={{ marginLeft: spacingX._10 }}>
                        Uyku Geçmişi ({historicalData.sleep.length} gece)
                      </Typo>
                    </View>
                    <View style={styles.historicalList}>
                      {historicalData.sleep.slice(-5).map((data, index) => (
                        <View key={index} style={styles.historicalItem}>
                          <Typo size={12} color={colors.textLighter}>
                            {new Date(data.timestamp).toLocaleDateString('tr-TR')}
                          </Typo>
                          <View style={styles.sleepInfo}>
                            <Typo size={14} fontWeight="600" color={colors.rose}>
                              {Math.floor(data.sleepDuration / 60)}s {data.sleepDuration % 60}dk
                            </Typo>
                            {data.sleepQuality && (
                              <Typo size={10} color={colors.textLighter} style={{ marginTop: 2 }}>
                                {data.sleepQuality}
                              </Typo>
                            )}
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacingY._25,
  },
  connectionCard: {
    backgroundColor: colors.neutral800,
    borderRadius: 12,
    padding: spacingY._15,
    marginBottom: spacingY._15,
    borderWidth: 1,
    borderColor: colors.neutral700,
  },
  connectedCard: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  connectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionInfo: {
    flex: 1,
    marginLeft: spacingX._15,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacingY._5,
  },
  statusDot: {
    width: verticalScale(8),
    height: verticalScale(8),
    borderRadius: verticalScale(4),
    backgroundColor: colors.textLighter,
    marginRight: spacingX._5,
  },
  connectedDot: {
    backgroundColor: colors.green,
  },
  connectButton: {
    paddingHorizontal: spacingX._15,
    paddingVertical: spacingY._10,
    minHeight: verticalScale(36),
    backgroundColor: colors.primary,
  },
  sensorsContainer: {
    marginTop: spacingY._15,
    paddingTop: spacingY._15,
    borderTopWidth: 1,
    borderTopColor: colors.neutral700,
  },
  sensorsLabel: {
    marginBottom: spacingY._10,
  },
  sensorsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacingX._5,
  },
  sensorChip: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacingX._10,
    paddingVertical: spacingY._5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  controlsContainer: {
    backgroundColor: colors.neutral800,
    borderRadius: 12,
    padding: spacingY._15,
    borderWidth: 1,
    borderColor: colors.neutral700,
  },
  sectionTitle: {
    marginBottom: spacingY._15,
  },
  sensorControlCard: {
    backgroundColor: colors.neutral900,
    borderRadius: 8,
    padding: spacingY._15,
    marginBottom: spacingY._10,
    borderWidth: 1,
    borderColor: colors.neutral600,
  },
  sensorControlHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sensorInfo: {
    flex: 1,
    marginLeft: spacingX._15,
  },
  sensorButton: {
    paddingHorizontal: spacingX._15,
    paddingVertical: spacingY._10,
    minHeight: verticalScale(36),
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
  },
  activeSensorButton: {
    backgroundColor: colors.primary,
  },
  sensorDataPreview: {
    marginTop: spacingY._15,
    paddingTop: spacingY._15,
    borderTopWidth: 1,
    borderTopColor: colors.neutral600,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacingY._5,
  },
  historicalSection: {
    marginTop: spacingY._15,
    paddingTop: spacingY._15,
    borderTopWidth: 1,
    borderTopColor: colors.neutral700,
  },
  historicalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacingY._10,
  },
  historicalButton: {
    paddingHorizontal: spacingX._15,
    paddingVertical: spacingY._10,
    minHeight: verticalScale(36),
    backgroundColor: colors.primary,
  },
  historicalCard: {
    backgroundColor: colors.neutral900,
    borderRadius: 8,
    padding: spacingY._15,
    marginBottom: spacingY._10,
    borderWidth: 1,
    borderColor: colors.neutral600,
  },
  historicalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacingY._10,
  },
  historicalList: {
    marginTop: spacingY._10,
  },
  historicalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacingY._5,
  },
  historicalData: {
    maxHeight: verticalScale(300),
  },
  sleepInfo: {
    alignItems: 'flex-end',
  },
});

export default SamsungHealthPanel; 