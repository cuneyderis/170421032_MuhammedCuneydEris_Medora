import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { colors } from '../constants/theme';
import { HealthData } from '../types/health';

const screenWidth = Dimensions.get('window').width;
const chartWidth = screenWidth - 64; // Container padding (32) + chart margin (32)

interface HealthChartProps {
  data: HealthData[];
  type: 'steps' | 'calories' | 'heartRate' | 'distance' | 'sleep' | 'weight' | 'bloodPressure' | 'overview';
  title: string;
}

const chartConfig = {
  backgroundColor: 'rgba(0,0,0,0.3)',
  backgroundGradientFrom: 'rgba(0,0,0,0.4)',
  backgroundGradientTo: 'rgba(0,0,0,0.2)',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(${hexToRgb(colors.primary)}, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.9})`,
  style: {
    borderRadius: 12,
  },
  propsForDots: {
    r: '4',
    strokeWidth: '2',
    stroke: colors.primary,
  },
  paddingRight: 40,
};

// Helper function to convert hex to rgb
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0,0,0';
  return `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`;
}

export const HealthChart: React.FC<HealthChartProps> = ({ data, type, title }) => {
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Veri bulunamadı</Text>
      </View>
    );
  }

  const renderStepsChart = () => {
    const chartData = {
      labels: data.slice(-7).map(d => new Date(d.date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })),
      datasets: [{
        data: data.slice(-7).map(d => d.steps || 0),
        color: (opacity = 1) => `rgba(${hexToRgb(colors.primary)}, ${Math.min(opacity + 0.2, 1)})`,
        strokeWidth: 3,
      }],
    };

    return (
      <LineChart
        data={chartData}
        width={chartWidth}
        height={200}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
      />
    );
  };

  const renderCaloriesChart = () => {
    const chartData = {
      labels: data.slice(-7).map(d => new Date(d.date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })),
      datasets: [{
        data: data.slice(-7).map(d => d.calories || 0),
        color: (opacity = 1) => `rgba(${hexToRgb(colors.orange)}, ${opacity})`,
      }],
    };

    return (
      <BarChart
        data={chartData}
        width={chartWidth}
        height={200}
        yAxisLabel=""
        yAxisSuffix=""
        chartConfig={{
          ...chartConfig,
          color: (opacity = 1) => `rgba(${hexToRgb(colors.orange)}, ${Math.min(opacity + 0.3, 1)})`,
        }}
        style={styles.chart}
      />
    );
  };

  const renderHeartRateChart = () => {
    const chartData = {
      labels: data.slice(-7).map(d => new Date(d.date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })),
      datasets: [{
        data: data.slice(-7).map(d => d.heartRate || 0),
        color: (opacity = 1) => `rgba(${hexToRgb(colors.rose)}, ${Math.min(opacity + 0.2, 1)})`,
        strokeWidth: 3,
      }],
    };

    return (
      <LineChart
        data={chartData}
        width={chartWidth}
        height={200}
        chartConfig={{
          ...chartConfig,
          color: (opacity = 1) => `rgba(${hexToRgb(colors.rose)}, ${Math.min(opacity + 0.2, 1)})`,
        }}
        bezier
        style={styles.chart}
      />
    );
  };

  const renderDistanceChart = () => {
    const chartData = {
      labels: data.slice(-7).map(d => new Date(d.date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })),
      datasets: [{
        data: data.slice(-7).map(d => d.distance || 0),
        color: (opacity = 1) => `rgba(${hexToRgb(colors.green)}, ${opacity})`,
      }],
    };

    return (
      <BarChart
        data={chartData}
        width={chartWidth}
        height={200}
        yAxisLabel=""
        yAxisSuffix=""
        chartConfig={{
          ...chartConfig,
          color: (opacity = 1) => `rgba(${hexToRgb(colors.green)}, ${Math.min(opacity + 0.3, 1)})`,
        }}
        style={styles.chart}
      />
    );
  };

  const renderSleepChart = () => {
    const chartData = {
      labels: data.slice(-7).map(d => new Date(d.date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })),
      datasets: [{
        data: data.slice(-7).map(d => d.sleep?.duration || 0),
        color: (opacity = 1) => `rgba(${hexToRgb(colors.purple)}, ${Math.min(opacity + 0.2, 1)})`,
        strokeWidth: 3,
      }],
    };

    return (
      <LineChart
        data={chartData}
        width={chartWidth}
        height={200}
        chartConfig={{
          ...chartConfig,
          color: (opacity = 1) => `rgba(${hexToRgb(colors.purple)}, ${Math.min(opacity + 0.2, 1)})`,
        }}
        bezier
        style={styles.chart}
      />
    );
  };

  const renderWeightChart = () => {
    const chartData = {
      labels: data.slice(-7).map(d => new Date(d.date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })),
      datasets: [{
        data: data.slice(-7).map(d => d.weight || 0),
        color: (opacity = 1) => `rgba(${hexToRgb(colors.blue)}, ${Math.min(opacity + 0.2, 1)})`,
        strokeWidth: 3,
      }],
    };

    return (
      <LineChart
        data={chartData}
        width={chartWidth}
        height={200}
        chartConfig={{
          ...chartConfig,
          color: (opacity = 1) => `rgba(${hexToRgb(colors.blue)}, ${Math.min(opacity + 0.2, 1)})`,
        }}
        bezier
        style={styles.chart}
      />
    );
  };

  const renderBloodPressureChart = () => {
    const systolicData = data.slice(-7).map(d => d.bloodPressure?.systolic || 0);
    const diastolicData = data.slice(-7).map(d => d.bloodPressure?.diastolic || 0);
    
    const chartData = {
      labels: data.slice(-7).map(d => new Date(d.date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })),
      datasets: [
        {
          data: systolicData,
          color: (opacity = 1) => `rgba(${hexToRgb(colors.rose)}, ${Math.min(opacity + 0.2, 1)})`,
          strokeWidth: 3,
        },
        {
          data: diastolicData,
          color: (opacity = 1) => `rgba(${hexToRgb(colors.blue)}, ${Math.min(opacity + 0.2, 1)})`,
          strokeWidth: 3,
        },
      ],
    };

    return (
      <LineChart
        data={chartData}
        width={chartWidth}
        height={200}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
      />
    );
  };

  const renderOverviewChart = () => {
    const latest = data[data.length - 1];
    const totalSteps = latest.steps || 0;
    const totalCalories = latest.calories || 0;
    const heartRate = latest.heartRate || 0;

    // Daha anlamlı hedef yüzdeleri hesapla
    const stepsGoal = 10000; // Günlük adım hedefi
    const caloriesGoal = 2000; // Günlük kalori hedefi
    const heartRateNormal = 70; // Normal dinlenme kalp hızı

    const stepsPercentage = Math.min(Math.round((totalSteps / stepsGoal) * 100), 100);
    const caloriesPercentage = Math.min(Math.round((totalCalories / caloriesGoal) * 100), 100);
    const heartRateScore = Math.max(30, Math.min(100, 100 - Math.abs(heartRate - heartRateNormal)));

    const pieData = [
      {
        name: `Adım: ${totalSteps.toLocaleString()}`,
        population: stepsPercentage,
        color: colors.primary,
        legendFontColor: 'rgba(255,255,255,0.9)',
        legendFontSize: 12,
      },
      {
        name: `Kalori: ${Math.round(totalCalories)} kcal`,
        population: caloriesPercentage,
        color: colors.orange,
        legendFontColor: 'rgba(255,255,255,0.9)',
        legendFontSize: 12,
      },
      {
        name: `Kalp: ${heartRate} bpm`,
        population: heartRateScore,
        color: colors.rose,
        legendFontColor: 'rgba(255,255,255,0.9)',
        legendFontSize: 12,
      },
    ];

    return (
      <View>
        <PieChart
          data={pieData}
          width={chartWidth}
          height={220}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          style={styles.chart}
          hasLegend={true}
        />
        
        {/* Açıklayıcı bilgi ekle */}
        <View style={styles.overviewExplanation}>
          <Text style={styles.explanationTitle}>Değerler nasıl hesaplanıyor?</Text>
          <Text style={styles.explanationText}>
            • Adım: Günlük {stepsGoal.toLocaleString()} adım hedefine göre tamamlanma oranı
          </Text>
          <Text style={styles.explanationText}>
            • Kalori: Günlük {caloriesGoal} kcal hedefine göre tamamlanma oranı
          </Text>
          <Text style={styles.explanationText}>
            • Kalp Hızı: Normal dinlenme kalp hızına ({heartRateNormal} bpm) göre sağlık skoru
          </Text>
        </View>
      </View>
    );
  };

  const renderChart = () => {
    switch (type) {
      case 'steps':
        return renderStepsChart();
      case 'calories':
        return renderCaloriesChart();
      case 'heartRate':
        return renderHeartRateChart();
      case 'distance':
        return renderDistanceChart();
      case 'sleep':
        return renderSleepChart();
      case 'weight':
        return renderWeightChart();
      case 'bloodPressure':
        return renderBloodPressureChart();
      case 'overview':
        return renderOverviewChart();
      default:
        return renderStepsChart();
    }
  };

  const getStats = () => {
    const latest = data[data.length - 1];
    const previous = data[data.length - 2];
    
    switch (type) {
      case 'steps':
        return {
          current: latest.steps || 0,
          change: previous ? (latest.steps || 0) - (previous.steps || 0) : 0,
          unit: 'adım',
        };
      case 'calories':
        return {
          current: latest.calories || 0,
          change: previous ? (latest.calories || 0) - (previous.calories || 0) : 0,
          unit: 'kcal',
        };
      case 'heartRate':
        return {
          current: latest.heartRate || 0,
          change: previous ? (latest.heartRate || 0) - (previous.heartRate || 0) : 0,
          unit: 'bpm',
        };
      case 'distance':
        return {
          current: latest.distance || 0,
          change: previous ? (latest.distance || 0) - (previous.distance || 0) : 0,
          unit: 'km',
        };
      case 'sleep':
        return {
          current: latest.sleep?.duration || 0,
          change: previous ? (latest.sleep?.duration || 0) - (previous.sleep?.duration || 0) : 0,
          unit: 'saat',
        };
      case 'weight':
        return {
          current: latest.weight || 0,
          change: previous ? (latest.weight || 0) - (previous.weight || 0) : 0,
          unit: 'kg',
        };
      default:
        return { current: 0, change: 0, unit: '' };
    }
  };

  const stats = getStats();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {type !== 'overview' && type !== 'bloodPressure' && (
          <View style={styles.statsContainer}>
            <Text style={styles.currentValue}>
              {stats.current.toLocaleString('tr-TR')} {stats.unit}
            </Text>
            <Text style={[
              styles.changeValue,
              { color: stats.change >= 0 ? colors.green : colors.rose }
            ]}>
              {stats.change >= 0 ? '+' : ''}{stats.change.toLocaleString('tr-TR')}
            </Text>
          </View>
        )}
      </View>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {renderChart()}
      </ScrollView>
      
      {type === 'bloodPressure' && (
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: colors.rose }]} />
            <Text style={styles.legendText}>Sistolik</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: colors.blue }]} />
            <Text style={styles.legendText}>Diyastolik</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    flex: 1,
  },
  statsContainer: {
    alignItems: 'flex-end',
  },
  currentValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  changeValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  chart: {
    marginVertical: 4,
    borderRadius: 12,
  },
  emptyContainer: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  emptyText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  overviewExplanation: {
    padding: 16,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
}); 