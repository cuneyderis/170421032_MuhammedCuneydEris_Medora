import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import Typo from './Typo';
import { colors, spacingX, spacingY } from '@/constants/theme';
import { TrendAnalysisResult, AnomalyDetectionResult } from '@/utils/healthAnalysis';
import * as Icons from 'phosphor-react-native';
import { verticalScale } from '@/utils/styling';

interface HealthTrendsCardProps {
  title: string;
  data?: number[];
  trendAnalysis?: TrendAnalysisResult;
  anomalyResults?: AnomalyDetectionResult[];
  onPress?: () => void;
  icon: JSX.Element;
  latestValue?: string;
}

const HealthTrendsCard: React.FC<HealthTrendsCardProps> = ({
  title,
  data,
  trendAnalysis,
  anomalyResults,
  onPress,
  icon,
  latestValue,
}) => {
  // Trend için ikon belirleme
  const getTrendIcon = () => {
    if (!trendAnalysis) return null;

    switch (trendAnalysis.trend) {
      case 'increasing':
        return <Icons.ArrowUp size={verticalScale(16)} color={colors.rose} weight="bold" />;
      case 'decreasing':
        return <Icons.ArrowDown size={verticalScale(16)} color={colors.green} weight="bold" />;
      case 'fluctuating':
        return <Icons.ArrowsDownUp size={verticalScale(16)} color={colors.rose} weight="bold" />;
      case 'stable':
        return <Icons.ArrowRight size={verticalScale(16)} color={colors.white} weight="bold" />;
      default:
        return null;
    }
  };

  // En son anomali sonucunu gösterme
  const getLatestAnomaly = () => {
    if (!anomalyResults || anomalyResults.length === 0) return null;
    
    // En son anomali
    const latestAnomaly = anomalyResults[anomalyResults.length - 1];
    
    if (!latestAnomaly.isAnomaly) return null;
    
    return (
      <View style={styles.anomalyContainer}>
        <Icons.WarningCircle size={verticalScale(14)} color={colors.rose} weight="fill" />
        <Typo size={11} color={colors.rose} style={styles.anomalyText}>
          {latestAnomaly.message}
        </Typo>
      </View>
    );
  };

  // Basitçe verinin durumunu miniviziualizasyon olarak gösterme
  const renderMiniVisualization = () => {
    if (!data || data.length < 3) return null;
    
    // Basit bir mini grafik gösterimi
    const values = data.slice(-4); // Son 4 veri
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;
    
    return (
      <View style={styles.miniViz}>
        {values.map((value, index) => {
          const height = ((value - min) / range) * 20 + 5; // 5-25 arasında yükseklik
          
          return (
            <View 
              key={index} 
              style={[
                styles.vizBar, 
                { height, backgroundColor: value > data[0] ? colors.green : colors.rose }
              ]} 
            />
          );
        })}
      </View>
    );
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.iconContainer}>{icon}</View>
      
      <View style={styles.contentContainer}>
        <View style={styles.titleContainer}>
          <Typo size={14} color={colors.textLighter}>{title}</Typo>
          {latestValue && (
            <Typo size={16} fontWeight="600">{latestValue}</Typo>
          )}
        </View>
        
        {renderMiniVisualization()}
        
        {trendAnalysis && (
          <View style={styles.trendContainer}>
            {getTrendIcon()}
            <Typo size={12} color={colors.textLighter} style={styles.trendText}>
              {trendAnalysis.message}
            </Typo>
          </View>
        )}
        
        {getLatestAnomaly()}
      </View>
      
      <Icons.CaretRight size={verticalScale(16)} color={colors.textLighter} />
    </TouchableOpacity>
  );
};

export default HealthTrendsCard;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral800,
    borderRadius: 12,
    padding: spacingY._15,
    paddingHorizontal: spacingX._15,
    marginBottom: spacingY._10,
  },
  iconContainer: {
    marginRight: spacingX._12,
  },
  contentContainer: {
    flex: 1,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacingY._5,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacingY._5,
  },
  trendText: {
    marginLeft: spacingX._5,
  },
  anomalyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacingY._5,
  },
  anomalyText: {
    marginLeft: spacingX._5,
  },
  miniViz: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 25,
    gap: 3,
  },
  vizBar: {
    width: 6,
    borderRadius: 3,
  },
}); 