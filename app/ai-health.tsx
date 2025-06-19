import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { HealthAnalysisCard, HealthChatAssistant, QuickHealthTips, EmergencyGuide } from '@/components/AIHealthComponents';
import { HealthContext } from '@/types/health';
import { initializeAI } from '@/services/hybridAI';

// AI'yi başlat
const ai = initializeAI();

export default function AIHealthScreen() {
  // Örnek sağlık verisi
  const [healthData] = useState<HealthContext>({
    vitals: {
      heartRate: 75,
      bloodPressure: {
        systolic: 120,
        diastolic: 80
      },
      temperature: 36.5,
      weight: 70,
      height: 175
    },
    symptoms: [
      {
        name: 'Hafif baş ağrısı',
        severity: 3,
        duration: '2 saat'
      },
      {
        name: 'Yorgunluk',
        severity: 5,
        duration: '1 gün'
      }
    ],
    activities: [
      {
        type: 'Yürüyüş',
        duration: 30,
        calories: 150,
        intensity: 'medium'
      },
      {
        type: 'Yoga',
        duration: 20,
        calories: 80,
        intensity: 'low'
      }
    ],
    demographics: {
      age: 30,
      gender: 'male',
      conditions: ['Migren'],
      medications: ['Aspirin']
    }
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>🤖 AI Sağlık Asistanı</Text>
        <Text style={styles.headerSubtitle}>Yapay zeka destekli sağlık analizi ve danışmanlığı</Text>
        
        {/* Sağlık Analizi */}
        <HealthAnalysisCard healthData={healthData} />
        
        {/* Hızlı İpuçları */}
        <QuickHealthTips />
        
        {/* Acil Durum Rehberi */}
        <EmergencyGuide />
        
        {/* AI Sohbet */}
        <View style={styles.chatSection}>
          <HealthChatAssistant userContext={healthData} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  chatSection: {
    marginTop: 16,
    height: 500,
  },
});
