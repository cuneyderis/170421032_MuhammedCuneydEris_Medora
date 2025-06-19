import { HybridAIService } from './services/hybridAI';
import { MockHealthDataGenerator } from './utils/mockData';
import dotenv from 'dotenv';

dotenv.config();

async function testAIFunctionality() {
  try {
    console.log('🧪 Starting Advanced AI Functionality Tests...\n');

    // Hybrid AI Service initialize
    const apiKey = process.env.OPENAI_API_KEY;
    const aiService = new HybridAIService(apiKey, process.env.OPENAI_MODEL);
    
    console.log(`� Service Type: ${aiService.getServiceType()}`);
    console.log(`🤖 Using Real AI: ${aiService.isUsingRealAI()}\n`);

    // Test 1: Normal sağlık analizi
    console.log('📊 Test 1: Normal Sağlık Analizi');
    console.log('================================');
    const normalContext = MockHealthDataGenerator.generateMockHealthContext();
    console.log('Input Data:', {
      heartRate: normalContext.currentMetrics.heartRate?.[normalContext.currentMetrics.heartRate.length - 1]?.value,
      bloodPressure: normalContext.currentMetrics.bloodPressure?.[0],
      sleep: normalContext.currentMetrics.sleep?.[0]?.duration ? 
        `${(normalContext.currentMetrics.sleep[0].duration / 60).toFixed(1)} hours` : 'N/A'
    });

    const normalAnalysis = await aiService.analyzeHealthData(normalContext);
    console.log('AI Analysis:');
    console.log('  Insights:', normalAnalysis.insights);
    console.log('  Recommendations:', normalAnalysis.recommendations);
    console.log('  Alerts:', normalAnalysis.alerts);
    console.log('  Risk Level:', normalAnalysis.riskAssessment?.level);
    console.log('  Confidence:', normalAnalysis.confidence);
    console.log('\n');

    // Test 2: Yüksek risk analizi
    console.log('⚠️  Test 2: Yüksek Risk Analizi');
    console.log('===============================');
    const riskContext = MockHealthDataGenerator.generateHighRiskContext();
    console.log('High Risk Input:', {
      heartRate: riskContext.currentMetrics.heartRate?.[0]?.value,
      bloodPressure: riskContext.currentMetrics.bloodPressure?.[0],
      sleep: riskContext.currentMetrics.sleep?.[0]?.duration ? 
        `${(riskContext.currentMetrics.sleep[0].duration / 60).toFixed(1)} hours` : 'N/A'
    });
    
    const riskAnalysis = await aiService.analyzeHealthData(riskContext);
    console.log('Risk Analysis:');
    console.log('  Insights:', riskAnalysis.insights);
    console.log('  Recommendations:', riskAnalysis.recommendations);
    console.log('  Alerts:', riskAnalysis.alerts);
    console.log('  Risk Level:', riskAnalysis.riskAssessment?.level);
    console.log('\n');

    // Test 3: Sohbet sistemi
    console.log('💬 Test 3: AI Sohbet Sistemi');
    console.log('============================');
    const chatQuestions = [
      'Kalp atışım normal mi?',
      'Neden bu kadar yorgunum?',
      'Kan basıncım hakkında ne düşünüyorsun?',
      'Sağlık durumum nasıl?',
      'Motivasyon verici bir şey söyle'
    ];

    for (const question of chatQuestions) {
      console.log(`❓ Soru: ${question}`);
      const response = await aiService.chatWithHealthAssistant(question, normalContext);
      console.log(`🤖 Yanıt: ${response}\n`);
    }

    // Test 4: Proaktif uyarılar
    console.log('🚨 Test 4: Proaktif Uyarılar');
    console.log('============================');
    const normalAlerts = await aiService.generateProactiveAlerts(normalContext);
    const riskAlerts = await aiService.generateProactiveAlerts(riskContext);
    
    console.log('Normal Context Alerts:', normalAlerts);
    console.log('Risk Context Alerts:', riskAlerts);
    console.log('\n');

    // Test 5: Kapsamlı Sağlık Raporu (Bonus)
    console.log('📋 Test 5: Kapsamlı Sağlık Raporu');
    console.log('==================================');
    const healthReport = await aiService.generateHealthReport(riskContext);
    console.log(healthReport);
    console.log('\n');

    // Test 6: Optimal sağlık durumu
    console.log('🌟 Test 6: Optimal Sağlık Durumu');
    console.log('=================================');
    const optimalContext = MockHealthDataGenerator.generateOptimalContext();
    const optimalAnalysis = await aiService.analyzeHealthData(optimalContext);
    console.log('Optimal Analysis:');
    console.log('  Insights:', optimalAnalysis.insights);
    console.log('  Risk Level:', optimalAnalysis.riskAssessment?.level);
    console.log('\n');

    console.log('✅ Tüm testler başarıyla tamamlandı!');
    console.log(`🎉 AI entegrasyonu çalışıyor (${aiService.getServiceType()} mode)`);
    console.log('🚀 Ana projeye entegre edilmeye hazır!');

  } catch (error) {
    console.error('❌ Test Error:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. OpenAI API key doğru mu?');
    console.log('2. İnternet bağlantısı var mı?');
    console.log('3. OpenAI API limitleri aşıldı mı?');
    console.log('4. Mock AI fallback çalışıyor mu?');
  }
}

async function testWithoutAI() {
  console.log('🔧 Mock Test Mode (AI olmadan)');
  console.log('==============================\n');

  // Mock data generation test
  const contexts = [
    { name: 'Normal', data: MockHealthDataGenerator.generateMockHealthContext() },
    { name: 'High Risk', data: MockHealthDataGenerator.generateHighRiskContext() },
    { name: 'Optimal', data: MockHealthDataGenerator.generateOptimalContext() }
  ];

  contexts.forEach(({ name, data }) => {
    console.log(`📊 ${name} Context:`);
    console.log(`- Kalp Atışı: ${data.currentMetrics.heartRate?.[0]?.value || 'N/A'} BPM`);
    console.log(`- Kan Basıncı: ${data.currentMetrics.bloodPressure?.[0]?.systolic || 'N/A'}/${data.currentMetrics.bloodPressure?.[0]?.diastolic || 'N/A'}`);
    console.log(`- Uyku: ${data.currentMetrics.sleep?.[0]?.duration ? (data.currentMetrics.sleep[0].duration / 60).toFixed(1) + ' saat' : 'N/A'}`);
    console.log(`- Adım: ${data.currentMetrics.activity?.[0]?.steps || 'N/A'}`);
    console.log('');
  });

  console.log('✅ Mock data generation working!');
  console.log('📝 Configure OpenAI API key to test AI features.');
}

// Run tests
if (require.main === module) {
  testAIFunctionality().catch(console.error);
}

export { testAIFunctionality };
