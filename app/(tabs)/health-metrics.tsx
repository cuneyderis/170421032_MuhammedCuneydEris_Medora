import { StyleSheet, View, ScrollView, Alert, RefreshControl, Dimensions, TouchableOpacity } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import Button from '@/components/Button';
import BackButton from '@/components/BackButton';
import { colors, spacingX, spacingY } from '@/constants/theme';
import { 
  fetchAllHealthData, 
  HeartRateResponse, 
  BloodPressureResponse, 
  HealthDataResponse
} from '@/utils/healthData';
import { 
  analyzeHeartRate, 
  analyzeBloodPressure, 
  detectHeartRateAnomalies,
  detectBloodPressureAnomalies,
  analyzeTrend,
  AnomalyDetectionResult
} from '@/utils/healthAnalysis';
import * as Icons from 'phosphor-react-native';
import { verticalScale } from '@/utils/styling';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');
const chartWidth = width - 40; // 40 is total horizontal padding

const HealthMetricsScreen = () => {
  const [loading, setLoading] = useState(false);
  const [healthData, setHealthData] = useState<HealthDataResponse | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'heart' | 'blood-pressure' | 'weight'>('heart');

  // Verileri çekme
  const fetchData = async () => {
    try {
      setLoading(true);
      // Son 30 günlük tarih aralığı
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const result = await fetchAllHealthData(startDate, endDate);
      
      if (result.success && result.data) {
        setHealthData(result.data);
      } else {
        Alert.alert('Veri Çekme Hatası', result.message || 'Veriler alınamadı.');
      }
    } catch (error) {
      console.error('Veri çekme hatası:', error);
      Alert.alert('Hata', 'Veriler alınırken bir hata oluştu.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // İlk yükleme
  useEffect(() => {
    fetchData();
  }, []);

  // Yenileme işlemi
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  // Sekme değiştirme
  const handleTabChange = (tab: 'heart' | 'blood-pressure' | 'weight') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  };

  // Son 7 günlük kalp atış hızı verilerini al
  const getRecentHeartRateData = () => {
    if (!healthData?.heartRate || healthData.heartRate.length === 0) {
      return [];
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    return [...healthData.heartRate]
      .filter(item => new Date(item.endDate) > sevenDaysAgo)
      .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
  };

  // Son 7 günlük kan basıncı verilerini al
  const getRecentBloodPressureData = () => {
    if (!healthData?.bloodPressure || healthData.bloodPressure.length === 0) {
      return [];
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    return [...healthData.bloodPressure]
      .filter(item => new Date(item.endDate) > sevenDaysAgo)
      .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
  };

  // Son 30 günlük kilo verilerini al
  const getRecentWeightData = () => {
    if (!healthData?.bodyMetrics?.weight || healthData.bodyMetrics.weight.length === 0) {
      return [];
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    return [...healthData.bodyMetrics.weight]
      .filter(item => new Date(item.endDate) > thirtyDaysAgo)
      .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
  };

  // Kalp atış hızı anomali tespiti
  const getHeartRateAnomalies = () => {
    const heartRateData = getRecentHeartRateData();
    if (heartRateData.length < 2) return [];
    
    const values = heartRateData.map(item => item.value);
    return detectHeartRateAnomalies(values);
  };

  // Veri noktalarını basit çizgi grafik şeklinde göster
  const renderLineGraph = (
    data: Array<{ value: number, endDate: string }>,
    normalRange?: { min: number, max: number },
    anomalies?: AnomalyDetectionResult[]
  ) => {
    if (data.length < 2) {
      return (
        <View style={styles.emptyChartContainer}>
          <Icons.ChartLine size={verticalScale(40)} color={colors.textLighter} />
          <Typo size={14} color={colors.textLighter} style={styles.emptyChartText}>
            Grafik için yeterli veri bulunmamaktadır.
          </Typo>
        </View>
      );
    }

    // Veri değerlerini al
    const values = data.map(item => item.value);
    
    // Min, max ve değer aralığını hesapla
    let min = Math.min(...values);
    let max = Math.max(...values);
    
    // Normal aralık varsa, grafik sınırlarını ayarla
    if (normalRange) {
      min = Math.min(min, normalRange.min);
      max = Math.max(max, normalRange.max);
    }
    
    // Bazı veri noktaları aynı değere sahipse, aralığı genişlet
    if (max === min) {
      max += 10;
      min = min > 10 ? min - 10 : 0;
    }
    
    const range = max - min;
    const chartHeight = 200;
    
    // Ekran genişliğine göre veri noktaları arasındaki boşluk
    const barWidth = 10;
    const gap = (chartWidth - (barWidth * data.length)) / (data.length - 1);
    
    return (
      <View style={styles.chartContainer}>
        {/* Y ekseni çizgileri */}
        <View style={styles.yAxisLines}>
          <View style={styles.axisLine} />
          <View style={[styles.axisLine, { top: chartHeight / 4 }]} />
          <View style={[styles.axisLine, { top: chartHeight / 2 }]} />
          <View style={[styles.axisLine, { top: chartHeight * 3 / 4 }]} />
          <View style={[styles.axisLine, { top: chartHeight - 1 }]} />
        </View>
        
        {/* Y ekseni değerleri */}
        <View style={styles.yAxisLabels}>
          <Typo size={10} color={colors.textLighter}>{max.toFixed(0)}</Typo>
          <Typo size={10} color={colors.textLighter}>{(max - range / 4).toFixed(0)}</Typo>
          <Typo size={10} color={colors.textLighter}>{(max - range / 2).toFixed(0)}</Typo>
          <Typo size={10} color={colors.textLighter}>{(max - range * 3 / 4).toFixed(0)}</Typo>
          <Typo size={10} color={colors.textLighter}>{min.toFixed(0)}</Typo>
        </View>
        
        {/* Normal aralık gösterimi */}
        {normalRange && (
          <View 
            style={[
              styles.normalRange,
              {
                top: chartHeight - ((normalRange.max - min) / range) * chartHeight,
                height: ((normalRange.max - normalRange.min) / range) * chartHeight,
              }
            ]} 
          />
        )}
        
        {/* Veri noktaları */}
        <View style={styles.dataPointsContainer}>
          {data.map((item, index) => {
            const height = ((item.value - min) / range) * chartHeight;
            const isAnomaly = anomalies && anomalies[index]?.isAnomaly;
            
            // Tarih kısaltma - GG/AA formatına dönüştür
            const date = new Date(item.endDate);
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const formattedDate = `${day}/${month}`;
            
            return (
              <View key={index} style={{ alignItems: 'center' }}>
                <View 
                  style={[
                    styles.dataPoint,
                    { 
                      height: barWidth,
                      width: barWidth,
                      bottom: height - barWidth / 2,
                      backgroundColor: isAnomaly ? colors.rose : colors.primary,
                    }
                  ]} 
                />
                {index % 2 === 0 && (
                  <Typo size={10} color={colors.textLighter} style={styles.xAxisLabel}>
                    {formattedDate}
                  </Typo>
                )}
              </View>
            );
          })}
        </View>
        
        {/* Çizgi */}
        <View style={styles.lineContainer}>
          {data.map((item, index) => {
            if (index === 0) return null;
            
            const prevItem = data[index - 1];
            const prevHeight = ((prevItem.value - min) / range) * chartHeight;
            const currHeight = ((item.value - min) / range) * chartHeight;
            
            // İki nokta arasındaki çizginin açısını hesapla
            const angle = Math.atan2(currHeight - prevHeight, barWidth + gap);
            const length = Math.sqrt(Math.pow(currHeight - prevHeight, 2) + Math.pow(barWidth + gap, 2));
            
            const isAnomaly = anomalies && (anomalies[index]?.isAnomaly || anomalies[index - 1]?.isAnomaly);
            
            return (
              <View 
                key={index}
                style={[
                  styles.line,
                  {
                    width: length,
                    left: (index - 1) * (barWidth + gap) + barWidth / 2,
                    bottom: prevHeight,
                    transform: [{ rotate: `${angle}rad` }],
                    backgroundColor: isAnomaly ? colors.rose : colors.primary,
                  }
                ]}
              />
            );
          })}
        </View>
      </View>
    );
  };

  // Kalp atış hızı tabı
  const renderHeartRateTab = () => {
    const heartRateData = getRecentHeartRateData();
    const anomalies = getHeartRateAnomalies();
    
    // Son kayıt
    const latestHeartRate = heartRateData.length > 0 
      ? heartRateData[heartRateData.length - 1].value 
      : null;
    
    // Kalp atış hızı analizi
    const heartRateAnalysis = latestHeartRate 
      ? analyzeHeartRate(latestHeartRate) 
      : null;
    
    return (
      <View style={styles.tabContent}>
        <View style={styles.metricSummary}>
          <View style={styles.iconContainer}>
            <Icons.Heart size={verticalScale(32)} color={colors.rose} weight="fill" />
          </View>
          
          <View style={styles.metricDetails}>
            <Typo size={14} color={colors.textLighter}>Güncel Kalp Atış Hızı</Typo>
            <Typo size={28} fontWeight="800">
              {latestHeartRate ? `${latestHeartRate} BPM` : 'Veri yok'}
            </Typo>
            
            {heartRateAnalysis && (
              <Typo 
                size={12} 
                color={heartRateAnalysis.status === 'normal' ? colors.green : colors.rose}
              >
                {heartRateAnalysis.message}
              </Typo>
            )}
          </View>
        </View>
        
        <Typo size={16} fontWeight="700" style={styles.sectionTitle}>
          7 Günlük Kalp Atış Hızı Trendi
        </Typo>
        
        {renderLineGraph(
          heartRateData, 
          { min: 60, max: 100 }, // Normal kalp atış hızı aralığı
          anomalies
        )}
        
        {/* Anomali açıklamaları */}
        {anomalies && anomalies.some(a => a.isAnomaly) && (
          <View style={styles.anomalyExplanation}>
            <Icons.WarningCircle size={verticalScale(18)} color={colors.rose} weight="fill" />
            <Typo size={12} color={colors.textLighter} style={styles.anomalyText}>
              Kırmızı ile işaretlenen değerler olağandışı kalp atış hızlarını göstermektedir.
              Bu ani değişimler stres, egzersiz, ilaçlar veya tıbbi durumlardan kaynaklanabilir.
            </Typo>
          </View>
        )}
      </View>
    );
  };

  // Kan basıncı tabı
  const renderBloodPressureTab = () => {
    const bloodPressureData = getRecentBloodPressureData();
    
    // Sistolik ve diastolik değerleri için ayrı seriler oluştur
    const systolicData = bloodPressureData.map(item => ({ 
      value: item.systolic, 
      endDate: item.endDate 
    }));
    
    const diastolicData = bloodPressureData.map(item => ({ 
      value: item.diastolic, 
      endDate: item.endDate 
    }));
    
    // Son kayıt
    const latestBP = bloodPressureData.length > 0 
      ? bloodPressureData[bloodPressureData.length - 1] 
      : null;
    
    // Kan basıncı analizi
    const bpAnalysis = latestBP 
      ? analyzeBloodPressure(latestBP.systolic, latestBP.diastolic) 
      : null;
    
    return (
      <View style={styles.tabContent}>
        <View style={styles.metricSummary}>
          <View style={styles.iconContainer}>
            <Icons.Drop size={verticalScale(32)} color={colors.rose} weight="fill" />
          </View>
          
          <View style={styles.metricDetails}>
            <Typo size={14} color={colors.textLighter}>Güncel Kan Basıncı</Typo>
            <Typo size={28} fontWeight="800">
              {latestBP ? `${latestBP.systolic}/${latestBP.diastolic} mmHg` : 'Veri yok'}
            </Typo>
            
            {bpAnalysis && (
              <Typo 
                size={12} 
                color={bpAnalysis.status === 'normal' ? colors.green : colors.rose}
              >
                {bpAnalysis.message}
              </Typo>
            )}
          </View>
        </View>
        
        <Typo size={16} fontWeight="700" style={styles.sectionTitle}>
          7 Günlük Sistolik Kan Basıncı Trendi
        </Typo>
        
        {renderLineGraph(
          systolicData, 
          { min: 90, max: 120 } // Normal sistolik basınç aralığı
        )}
        
        <Typo size={16} fontWeight="700" style={{ ...styles.sectionTitle, marginTop: spacingY._20 }}>
          7 Günlük Diastolik Kan Basıncı Trendi
        </Typo>
        
        {renderLineGraph(
          diastolicData, 
          { min: 60, max: 80 } // Normal diastolik basınç aralığı
        )}
      </View>
    );
  };

  // Kilo tabı
  const renderWeightTab = () => {
    const weightData = getRecentWeightData();
    
    // Son kayıt
    const latestWeight = weightData.length > 0 
      ? weightData[weightData.length - 1].value 
      : null;
    
    return (
      <View style={styles.tabContent}>
        <View style={styles.metricSummary}>
          <View style={styles.iconContainer}>
            <Icons.Scales size={verticalScale(32)} color={colors.primary} weight="fill" />
          </View>
          
          <View style={styles.metricDetails}>
            <Typo size={14} color={colors.textLighter}>Güncel Kilo</Typo>
            <Typo size={28} fontWeight="800">
              {latestWeight ? `${latestWeight.toFixed(1)} kg` : 'Veri yok'}
            </Typo>
          </View>
        </View>
        
        <Typo size={16} fontWeight="700" style={styles.sectionTitle}>
          30 Günlük Kilo Trendi
        </Typo>
        
        {renderLineGraph(weightData)}
        
        {weightData.length >= 3 && (
          <View style={styles.weightChange}>
            <Typo size={14} fontWeight="600">
              Kilo Değişimi: 
            </Typo>
            
            {(() => {
              if (weightData.length < 2) return null;
              
              const firstWeight = weightData[0].value;
              const lastWeight = weightData[weightData.length - 1].value;
              const change = lastWeight - firstWeight;
              const changeAbs = Math.abs(change).toFixed(1);
              
              return (
                <View style={styles.changeContainer}>
                  {change === 0 ? (
                    <Icons.ArrowRight size={verticalScale(16)} color={colors.white} weight="bold" />
                  ) : change > 0 ? (
                    <Icons.ArrowUp size={verticalScale(16)} color={colors.rose} weight="bold" />
                  ) : (
                    <Icons.ArrowDown size={verticalScale(16)} color={colors.green} weight="bold" />
                  )}
                  
                  <Typo 
                    size={14} 
                    fontWeight="600" 
                    color={change === 0 ? colors.white : (change > 0 ? colors.rose : colors.green)}
                  >
                    {change === 0 
                      ? 'Değişim yok' 
                      : `${changeAbs} kg ${change > 0 ? 'artış' : 'azalma'}`}
                  </Typo>
                </View>
              );
            })()}
          </View>
        )}
      </View>
    );
  };

  return (
    <ScreenWrapper>
      <ScrollView 
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <BackButton />
          <Typo size={20} fontWeight="800" style={styles.headerTitle}>
            Sağlık Metrikleri
          </Typo>
          <View style={{ width: verticalScale(32) }} />
        </View>
        
        {/* Tab menü */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'heart' && styles.activeTab]} 
            onPress={() => handleTabChange('heart')}
          >
            <Icons.Heart 
              size={verticalScale(20)} 
              color={activeTab === 'heart' ? colors.rose : colors.textLighter} 
              weight={activeTab === 'heart' ? 'fill' : 'regular'}
            />
            <Typo 
              size={12} 
              fontWeight={activeTab === 'heart' ? '600' : '400'}
              color={activeTab === 'heart' ? colors.white : colors.textLighter}
            >
              Kalp
            </Typo>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'blood-pressure' && styles.activeTab]} 
            onPress={() => handleTabChange('blood-pressure')}
          >
            <Icons.Drop 
              size={verticalScale(20)} 
              color={activeTab === 'blood-pressure' ? colors.rose : colors.textLighter} 
              weight={activeTab === 'blood-pressure' ? 'fill' : 'regular'}
            />
            <Typo 
              size={12} 
              fontWeight={activeTab === 'blood-pressure' ? '600' : '400'}
              color={activeTab === 'blood-pressure' ? colors.white : colors.textLighter}
            >
              Kan Basıncı
            </Typo>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'weight' && styles.activeTab]} 
            onPress={() => handleTabChange('weight')}
          >
            <Icons.Scales 
              size={verticalScale(20)} 
              color={activeTab === 'weight' ? colors.primary : colors.textLighter} 
              weight={activeTab === 'weight' ? 'fill' : 'regular'}
            />
            <Typo 
              size={12} 
              fontWeight={activeTab === 'weight' ? '600' : '400'}
              color={activeTab === 'weight' ? colors.white : colors.textLighter}
            >
              Kilo
            </Typo>
          </TouchableOpacity>
        </View>
        
        {/* Tab içeriği */}
        {activeTab === 'heart' && renderHeartRateTab()}
        {activeTab === 'blood-pressure' && renderBloodPressureTab()}
        {activeTab === 'weight' && renderWeightTab()}
        
        <Button onPress={fetchData} loading={loading} style={styles.refreshButton}>
          <Typo fontWeight="700" color={colors.black} size={16}>
            Verileri Güncelle
          </Typo>
        </Button>
      </ScrollView>
    </ScreenWrapper>
  );
};

export default HealthMetricsScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: spacingX._20,
    paddingTop: spacingY._20,
    paddingBottom: spacingY._40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacingY._20,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: spacingY._20,
    backgroundColor: colors.neutral800,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacingY._10,
    borderRadius: 8,
    flexDirection: 'row',
    gap: spacingX._5,
  },
  activeTab: {
    backgroundColor: colors.neutral700,
  },
  tabContent: {
    flex: 1,
  },
  metricSummary: {
    flexDirection: 'row',
    backgroundColor: colors.neutral800,
    borderRadius: 12,
    padding: spacingY._15,
    marginBottom: spacingY._20,
  },
  iconContainer: {
    marginRight: spacingX._15,
  },
  metricDetails: {
    flex: 1,
  },
  sectionTitle: {
    marginBottom: spacingY._15,
  },
  chartContainer: {
    height: 200,
    marginBottom: spacingY._30,
    marginLeft: 25, // Y-ekseni etiketleri için yer
  },
  yAxisLines: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 200,
  },
  yAxisLabels: {
    position: 'absolute',
    left: -25,
    top: 0,
    height: 200,
    justifyContent: 'space-between',
  },
  axisLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.neutral700,
  },
  normalRange: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 255, 0, 0.05)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(0, 255, 0, 0.2)',
  },
  dataPointsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 200,
  },
  dataPoint: {
    position: 'absolute',
    borderRadius: 5,
  },
  lineContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 200,
  },
  line: {
    position: 'absolute',
    height: 2,
    transformOrigin: 'left',
  },
  xAxisLabel: {
    marginTop: 5,
  },
  refreshButton: {
    marginTop: spacingY._20,
  },
  emptyChartContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral800,
    borderRadius: 8,
  },
  emptyChartText: {
    marginTop: spacingY._10,
    textAlign: 'center',
  },
  anomalyExplanation: {
    flexDirection: 'row',
    backgroundColor: colors.neutral800,
    borderRadius: 8,
    padding: spacingY._10,
    paddingHorizontal: spacingX._15,
    marginTop: -spacingY._15,
    marginBottom: spacingY._20,
  },
  anomalyText: {
    flex: 1,
    marginLeft: spacingX._10,
  },
  weightChange: {
    flexDirection: 'row',
    backgroundColor: colors.neutral800,
    borderRadius: 8,
    padding: spacingY._15,
    paddingHorizontal: spacingX._15,
    marginTop: -spacingY._15,
    marginBottom: spacingY._20,
    alignItems: 'center',
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacingX._10,
    gap: spacingX._5,
  },
}); 