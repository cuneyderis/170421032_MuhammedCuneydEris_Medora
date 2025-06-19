import { ScrollView, View, Alert, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, Footprints, MapPin, Flame, Scales, Drop, ArrowClockwise, ChartBar } from 'phosphor-react-native';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/authContext';

import ScreenWrapper from '../../components/ScreenWrapper';
import Typo from '../../components/Typo';
import { colors } from '../../constants/theme';
import { HealthChart } from '../../components/HealthChart';
import Button from '../../components/Button';
import Loading from '../../components/Loading';

// Theme object oluştur
const theme = {
  colors: {
    primary: colors.primary,
    secondary: colors.secondary,
    background: colors.neutral100,
    success: colors.green,
    warning: colors.rose,
    error: colors.rose,
    info: colors.primaryLight,
    textSecondary: colors.textLighter,
  }
};

// New Google Fit Service
import { googleFitService } from '../../utils/googleFitService';
import { HealthData } from '../../types/health';

// Import styles object dari file lain untuk fallback
const styles = {
  container: {
    flex: 1
  }
};

export default function HealthDataScreen() {
  const { user } = useAuth();
  const [healthData, setHealthData] = useState<HealthData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGoogleFitConnected, setIsGoogleFitConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncDate, setLastSyncDate] = useState<string>('');
  
  // Son 7 günün verilerini getir
  const fetchHealthData = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      setIsLoading(true);
      
      // Yeni basit query kullan - index gerektirmez
      const data = await googleFitService.loadHealthData(user.uid, 7);
      setHealthData(data);
      
      // Son senkronizasyon durumunu kontrol et
      try {
        const syncStatus = await googleFitService.getSyncStatus(user.uid);
        if (syncStatus) {
          setLastSyncDate(syncStatus.lastSyncDate);
          setIsGoogleFitConnected(syncStatus.isConnected);
        }
      } catch (syncError) {
        console.warn('⚠️ Senkronizasyon durumu alınamadı:', syncError);
        // Varsayılan değerler
        setIsGoogleFitConnected(true);
        setLastSyncDate(new Date().toISOString().split('T')[0]);
      }
      
      console.log(`📊 ${data.length} günlük sağlık verisi yüklendi`);
    } catch (error) {
      console.error('❌ Sağlık verileri yüklenemedi:', error);
      Alert.alert('Hata', 'Sağlık verileri yüklenirken bir hata oluştu.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.uid]);

  // Google Fit bağlantısı
  const handleGoogleFitConnection = async () => {
    try {
      setIsLoading(true);
      
      const result = await googleFitService.connect();
      
      if (result.success) {
        setIsGoogleFitConnected(true);
        Alert.alert('Başarılı', 'Google Fit bağlantısı kuruldu! Şimdi veriler senkronize edilecek.');
        
        // Bağlantı başarılı olursa otomatik senkronizasyon yap
        await handleSync();
      } else {
        Alert.alert('Bağlantı Hatası', result.message || 'Google Fit ile bağlantı kurulamadı.');
      }
    } catch (error) {
      console.error('❌ Google Fit bağlantı hatası:', error);
      Alert.alert('Hata', 'Google Fit bağlantısı kurulamadı.');
    } finally {
      setIsLoading(false);
    }
  };

  // Senkronizasyon
  const handleSync = async () => {
    if (!user?.uid) return;
    
    try {
      setIsSyncing(true);
      
      const result = await googleFitService.autoSync(user.uid);
      
      if (result.success) {
        Alert.alert('Başarılı', `${result.syncedDays} günlük veri senkronize edildi.`);
        await fetchHealthData(); // Verileri yenile
      } else {
        Alert.alert('Senkronizasyon Hatası', 'Veriler senkronize edilemedi.');
      }
    } catch (error) {
      console.error('❌ Senkronizasyon hatası:', error);
      Alert.alert('Hata', 'Senkronizasyon sırasında bir hata oluştu.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Manuel senkronizasyon (belirli tarih aralığı)
  const handleManualSync = async () => {
    if (!user?.uid) return;
    
    Alert.alert(
      'Manuel Senkronizasyon',
      'Son 30 günün verilerini senkronize etmek istiyor musunuz?',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Evet', onPress: async () => {
          try {
            setIsSyncing(true);
            
            const endDate = new Date();
            const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            
            const result = await googleFitService.syncHealthData(user.uid!, startDate, endDate);
            
            if (result.success) {
              Alert.alert('Başarılı', `${result.syncedDays} günlük veri senkronize edildi.`);
              await fetchHealthData();
    } else {
              Alert.alert('Hata', 'Senkronizasyon başarısız oldu.');
            }
      } catch (error) {
            console.error('❌ Manuel senkronizasyon hatası:', error);
            Alert.alert('Hata', 'Senkronizasyon sırasında bir hata oluştu.');
          } finally {
            setIsSyncing(false);
          }
        }}
      ]
    );
  };

  // Sayfa yüklendiğinde verileri getir
  useEffect(() => {
    fetchHealthData();
  }, [fetchHealthData]);

  // Google Fit bağlantı durumunu kontrol et
  useEffect(() => {
    const checkGoogleFitConnection = async () => {
      try {
        const connected = googleFitService.getConnectionStatus();
        setIsGoogleFitConnected(connected);
      } catch (error) {
        console.log('❌ Google Fit bağlantı durumu kontrol edilemedi:', error);
      }
    };
    
    checkGoogleFitConnection();
  }, []);

  // Refresh fonksiyonu
  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchHealthData();
  }, [fetchHealthData]);

  // Bugünün verileri
  const todayData = healthData.find(data => data.date === new Date().toISOString().split('T')[0]);
  
  // Grafik için veri hazırlama
  const chartData = {
    heartRate: healthData.map(data => data.heartRate || 0).reverse(),
    steps: healthData.map(data => data.steps || 0).reverse(),
    calories: healthData.map(data => data.calories || 0).reverse(),
  };

  if (isLoading) {
    return (
      <ScreenWrapper>
        <Loading />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={{ padding: 20, paddingBottom: 10 }}>
          <Typo size={28} fontWeight="700" color={theme.colors.primary}>
            Sağlık Verileri
          </Typo>
          <Typo size={16} color={theme.colors.textSecondary} style={{ marginTop: 5 }}>
            Samsung Galaxy Watch 7 & Google Fit
          </Typo>
        </View>

        {/* Google Fit Bağlantı Durumu */}
        <View style={{ 
          margin: 20, 
          padding: 15, 
          backgroundColor: isGoogleFitConnected ? theme.colors.success : theme.colors.warning,
          borderRadius: 12,
          opacity: 0.9
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Typo size={16} fontWeight="600" color="white">
                Google Fit {isGoogleFitConnected ? '✅' : '⚠️'}
              </Typo>
              <Typo size={14} color="white" style={{ marginTop: 2 }}>
                {isGoogleFitConnected 
                  ? `Bağlı • Son senkronizasyon: ${lastSyncDate || 'Henüz senkronize edilmedi'}`
                  : 'Bağlantı kurulmadı'
                }
              </Typo>
            </View>
            
            {!isGoogleFitConnected && (
              <TouchableOpacity 
                onPress={handleGoogleFitConnection}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8
                }}
              >
                <Typo size={14} fontWeight="600" color="white">Bağlan</Typo>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Senkronizasyon Butonları */}
        {isGoogleFitConnected && (
          <View style={{ flexDirection: 'row', paddingHorizontal: 20, marginBottom: 20, gap: 10 }}>
            <TouchableOpacity 
              onPress={handleSync}
              disabled={isSyncing}
              style={{
                flex: 1,
                backgroundColor: theme.colors.primary,
                padding: 12,
                borderRadius: 10,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                opacity: isSyncing ? 0.6 : 1
              }}
            >
              <ArrowClockwise size={16} color="white" />
              <Typo size={14} fontWeight="600" color="white" style={{ marginLeft: 8 }}>
                {isSyncing ? 'Senkronize ediliyor...' : 'Otomatik Senkronizasyon'}
              </Typo>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={handleManualSync}
              disabled={isSyncing}
              style={{
                backgroundColor: theme.colors.secondary,
                padding: 12,
                borderRadius: 10,
                alignItems: 'center',
                opacity: isSyncing ? 0.6 : 1
              }}
            >
              <ChartBar size={16} color="white" />
            </TouchableOpacity>
          </View>
        )}

        {/* Bugünkü Özet */}
        {todayData && (
          <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
            <Typo size={20} fontWeight="600" style={{ marginBottom: 15 }}>
              Bugünkü Veriler
            </Typo>
            
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {/* Kalp Hızı */}
              {todayData.heartRate && (
                <View style={{
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  padding: 15,
                  borderRadius: 12,
                  width: '48%',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.1)'
                }}>
                  <Heart size={24} color={theme.colors.error} />
                  <Typo size={24} fontWeight="700" color={theme.colors.error} style={{ marginTop: 8 }}>
                    {todayData.heartRate}
                  </Typo>
                  <Typo size={12} color={theme.colors.textSecondary}>
                    bpm • Kalp Hızı
                  </Typo>
                </View>
              )}

              {/* Adım */}
              {todayData.steps && (
                <View style={{
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  padding: 15,
                  borderRadius: 12,
                  width: '48%',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.1)'
                }}>
                  <Footprints size={24} color={theme.colors.primary} />
                  <Typo size={24} fontWeight="700" color={theme.colors.primary} style={{ marginTop: 8 }}>
                    {todayData.steps.toLocaleString()}
                  </Typo>
                  <Typo size={12} color={theme.colors.textSecondary}>
                    adım
                  </Typo>
                </View>
              )}

              {/* Kalori */}
              {todayData.calories && (
                <View style={{
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  padding: 15,
                  borderRadius: 12,
                  width: '48%',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.1)'
                }}>
                  <Flame size={24} color={theme.colors.warning} />
                  <Typo size={24} fontWeight="700" color={theme.colors.warning} style={{ marginTop: 8 }}>
                    {Math.round(todayData.calories)}
                  </Typo>
                  <Typo size={12} color={theme.colors.textSecondary}>
                    kcal
                  </Typo>
                </View>
              )}

              {/* Mesafe */}
              {todayData.distance && (
                <View style={{
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  padding: 15,
                  borderRadius: 12,
                  width: '48%',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.1)'
                }}>
                  <MapPin size={24} color={theme.colors.success} />
                  <Typo size={24} fontWeight="700" color={theme.colors.success} style={{ marginTop: 8 }}>
                    {(todayData.distance / 1000).toFixed(1)}
                  </Typo>
                  <Typo size={12} color={theme.colors.textSecondary}>
                    km • Mesafe
            </Typo>
              </View>
              )}

              {/* Kilo */}
              {todayData.weight && (
                <View style={{
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  padding: 15,
                  borderRadius: 12,
                  width: '48%',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.1)'
                }}>
                  <Scales size={24} color={theme.colors.info} />
                  <Typo size={24} fontWeight="700" color={theme.colors.info} style={{ marginTop: 8 }}>
                    {todayData.weight.toFixed(1)}
                  </Typo>
                  <Typo size={12} color={theme.colors.textSecondary}>
                    kg • Kilo
                  </Typo>
            </View>
              )}

              {/* Kan Basıncı */}
              {todayData.bloodPressure && (
                <View style={{
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  padding: 15,
                  borderRadius: 12,
                  width: '48%',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.1)'
                }}>
                  <Drop size={24} color={theme.colors.error} />
                  <Typo size={18} fontWeight="700" color={theme.colors.error} style={{ marginTop: 8 }}>
                    {todayData.bloodPressure.systolic}/{todayData.bloodPressure.diastolic}
                  </Typo>
                  <Typo size={12} color={theme.colors.textSecondary}>
                    mmHg • Kan Basıncı
              </Typo>
                </View>
            )}
            </View>
          </View>
        )}

        {/* Grafikler */}
        {healthData.length > 0 && (
          <View>
            <View style={{ paddingHorizontal: 20 }}>
              <Typo size={20} fontWeight="600" style={{ marginBottom: 15 }}>
                Son 7 Günlük Trendler
              </Typo>
            </View>

            {/* Genel Özet Grafiği */}
            <HealthChart 
              title="Genel Sağlık Özeti"
              data={healthData}
              type="overview"
            />

            {/* Kalp Hızı Grafiği */}
            {healthData.some(data => data.heartRate && data.heartRate > 0) && (
              <HealthChart 
                title="Kalp Hızı Trendi"
                data={healthData}
                type="heartRate"
              />
            )}

            {/* Adım Grafiği */}
            {healthData.some(data => data.steps && data.steps > 0) && (
              <HealthChart 
                title="Günlük Adımlar"
                data={healthData}
                type="steps"
              />
            )}

            {/* Kalori Grafiği */}
            {healthData.some(data => data.calories && data.calories > 0) && (
              <HealthChart 
                title="Kalori Yakma"
                data={healthData}
                type="calories"
              />
            )}

            {/* Mesafe Grafiği */}
            {healthData.some(data => data.distance && data.distance > 0) && (
              <HealthChart 
                title="Günlük Mesafe"
                data={healthData}
                type="distance"
              />
            )}

            {/* Kilo Grafiği */}
            {healthData.some(data => data.weight && data.weight > 0) && (
              <HealthChart 
                title="Kilo Takibi"
                data={healthData}
                type="weight"
              />
            )}

            {/* Uyku Grafiği */}
            {healthData.some(data => data.sleep && data.sleep.duration > 0) && (
              <HealthChart 
                title="Uyku Süresi"
                data={healthData}
                type="sleep"
              />
            )}

            {/* Kan Basıncı Grafiği */}
            {healthData.some(data => data.bloodPressure) && (
              <HealthChart 
                title="Kan Basıncı Takibi"
                data={healthData}
                type="bloodPressure"
              />
            )}
          </View>
        )}

        {/* Veri Yok Mesajı */}
        {healthData.length === 0 && (
          <View style={{ 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: 40,
            marginTop: 50
          }}>
            <Heart size={64} color={theme.colors.textSecondary} />
            <Typo size={18} fontWeight="600" color={theme.colors.textSecondary} style={{ marginTop: 20 }}>
              Henüz sağlık verisi yok
            </Typo>
            <Typo size={14} color={theme.colors.textSecondary} style={{ marginTop: 8, textAlign: 'center' }}>
              Google Fit'e bağlanarak Samsung Galaxy Watch 7'nizden verileri senkronize edin
            </Typo>
            
            {!isGoogleFitConnected && (
              <Button
                onPress={handleGoogleFitConnection}
                style={{ marginTop: 20, paddingHorizontal: 30 }}
              >
                <Typo size={16} fontWeight="600" color="white">
                  Google Fit'e Bağlan
              </Typo>
            </Button>
            )}
          </View>
        )}

        {/* Bottom Padding */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenWrapper>
  );
} 