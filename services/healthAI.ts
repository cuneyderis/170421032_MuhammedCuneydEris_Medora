import OpenAI from 'openai';
import { HealthContext, AIHealthResponse, ChatMessage } from '../types/health';

export class HealthAIService {
  private openai: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string = 'gpt-3.5-turbo') {
    this.openai = new OpenAI({
      apiKey: apiKey,
    });
    this.model = model;
  }

  /**
   * Faz 1: Basit sağlık verisi analizi
   */
  async analyzeHealthData(context: HealthContext): Promise<AIHealthResponse> {
    try {
      const prompt = this.buildHealthAnalysisPrompt(context);
      
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'Sen uzman bir sağlık asistanısın. Sağlık verilerini analiz edip basit, anlaşılır öneriler veriyorsun. Tıbbi teşhis koymuyorsun, sadece genel sağlık tavsiyeleri veriyorsun.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
      });

      const response = completion.choices[0]?.message?.content || '';
      return this.parseHealthResponse(response, context);
    } catch (error) {
      console.error('AI Analysis Error:', error);
      throw new Error('Sağlık analizi yapılamadı');
    }
  }

  /**
   * Faz 2: Akıllı sohbet sistemi
   */
  async chatWithHealthAssistant(
    message: string, 
    context: HealthContext,
    chatHistory: ChatMessage[] = []
  ): Promise<string> {
    try {
      const systemPrompt = this.buildChatSystemPrompt(context);
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        ...this.formatChatHistory(chatHistory),
        { role: 'user' as const, content: message }
      ];

      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: messages,
        temperature: 0.4,
        max_tokens: 300,
      });

      return completion.choices[0]?.message?.content || 'Üzgünüm, şu anda yanıtlayamıyorum.';
    } catch (error) {
      console.error('Chat Error:', error);
      throw new Error('Sohbet yanıtı alınamadı');
    }
  }

  /**
   * Proaktif sağlık uyarıları
   */
  async generateProactiveAlerts(context: HealthContext): Promise<string[]> {
    try {
      const prompt = this.buildAlertPrompt(context);
      
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'Sen proaktif bir sağlık asistanısın. Sağlık verilerindeki riskleri tespit edip, önleyici uyarılar veriyorsun.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 200,
      });

      const response = completion.choices[0]?.message?.content || '';
      return this.parseAlerts(response);
    } catch (error) {
      console.error('Alert Generation Error:', error);
      return [];
    }
  }

  /**
   * Sağlık verisi analizi için prompt oluştur
   */
  private buildHealthAnalysisPrompt(context: HealthContext): string {
    const { demographics, vitals, userProfile, currentMetrics } = context;
    
    // Güvenli şekilde veri al
    const age = demographics?.age || userProfile?.age || 30;
    const gender = demographics?.gender || userProfile?.gender || 'bilinmiyor';
    
    let prompt = `Sağlık Profili Analizi:
Kullanıcı: ${age} yaş, ${gender}`;
    
    if (userProfile?.weight && userProfile?.height) {
      const bmi = userProfile.weight / Math.pow(userProfile.height / 100, 2);
      prompt += `\nBMI: ${bmi.toFixed(1)}`;
    }

    // Kalp atışı analizi
    if (currentMetrics?.heartRate && currentMetrics.heartRate.length > 0) {
      const latest = currentMetrics.heartRate[currentMetrics.heartRate.length - 1];
      const avg = currentMetrics.heartRate.reduce((sum, hr) => sum + hr.value, 0) / currentMetrics.heartRate.length;
      prompt += `\nKalp Atışı: Son ölçüm ${latest.value} BPM, Ortalama ${avg.toFixed(0)} BPM`;
    }

    // Kan basıncı analizi
    if (currentMetrics?.bloodPressure && currentMetrics.bloodPressure.length > 0) {
      const latest = currentMetrics.bloodPressure[currentMetrics.bloodPressure.length - 1];
      prompt += `\nKan Basıncı: ${latest.systolic}/${latest.diastolic} mmHg`;
    }

    // Uyku analizi
    if (currentMetrics?.sleep && currentMetrics.sleep.length > 0) {
      const latest = currentMetrics.sleep[currentMetrics.sleep.length - 1];
      const hours = latest.duration / 60;
      prompt += `\nUyku: ${hours.toFixed(1)} saat, Kalite: ${latest.quality || 'bilinmiyor'}`;
    }

    // Aktivite analizi
    if (currentMetrics?.activity && currentMetrics.activity.length > 0) {
      const latest = currentMetrics.activity[currentMetrics.activity.length - 1];
      prompt += `\nAktivite: ${latest.steps} adım, ${latest.calories} kalori`;
    }

    prompt += `\n\nLütfen bu verileri analiz edip:
1. Genel sağlık durumu hakkında 2-3 basit yorum
2. 2-3 pratik öneri
3. Dikkat edilmesi gereken noktalar
4. Pozitif motivasyon mesajı

Tıbbi teşhis koymayın, genel sağlık tavsiyeleri verin.`;

    return prompt;
  }

  /**
   * Sohbet için sistem promptu
   */
  private buildChatSystemPrompt(context: HealthContext): string {
    const { demographics, vitals, userProfile, currentMetrics } = context;
    
    // Güvenli şekilde yaş ve cinsiyet al
    const age = demographics?.age || userProfile?.age || 30;
    const gender = demographics?.gender || userProfile?.gender || 'bilinmiyor';
    
    return `Sen kişisel bir sağlık asistanısın. Kullanıcının sağlık verilerine sahipsin:

Profil: ${age} yaş, ${gender}
Son Ölçümler:
- Kalp atışı: ${vitals?.heartRate || currentMetrics?.heartRate?.[currentMetrics.heartRate.length - 1]?.value || 'Yok'} BPM
- Kan basıncı: ${vitals?.bloodPressure?.systolic || currentMetrics?.bloodPressure?.[currentMetrics.bloodPressure.length - 1]?.systolic || 'Yok'}/${vitals?.bloodPressure?.diastolic || currentMetrics?.bloodPressure?.[currentMetrics.bloodPressure.length - 1]?.diastolic || 'Yok'} mmHg
- Sıcaklık: ${vitals?.temperature || 'Yok'} °C

Kurallar:
- Samimi ve destekleyici ol
- Basit dil kullan
- Tıbbi teşhis koyma
- Gerekirse doktora yönlendir
- Pozitif ve motive edici ol
- Kısa ve net yanıtlar ver (max 2-3 cümle)`;
  }

  /**
   * Uyarı promptu oluştur
   */
  private buildAlertPrompt(context: HealthContext): string {
    const { currentMetrics } = context;
    
    let prompt = `Sağlık verilerindeki potansiyel riskleri analiz et:`;
    
    // Kalp atışı trendleri
    if (currentMetrics?.heartRate && currentMetrics.heartRate.length >= 3) {
      const recent = currentMetrics.heartRate.slice(-3);
      const values = recent.map(hr => hr.value);
      prompt += `\nSon kalp atışları: ${values.join(', ')} BPM`;
    }

    // Uyku kalitesi
    if (currentMetrics?.sleep && currentMetrics.sleep.length >= 3) {
      const recent = currentMetrics.sleep.slice(-3);
      const avgSleep = recent.reduce((sum, s) => sum + s.duration, 0) / (recent.length * 60);
      prompt += `\nOrtalama uyku: ${avgSleep.toFixed(1)} saat`;
    }

    prompt += `\n\nSadece önemli uyarılar ver (varsa):
- Her satır ayrı bir uyarı
- Kısa ve net (max 10 kelime)
- Varsa acil durumları belirt
- Eğer herşey normal ise "Normal" yaz`;

    return prompt;
  }

  /**
   * AI yanıtını parse et
   */
  private parseHealthResponse(response: string, context: HealthContext): AIHealthResponse {
    const lines = response.split('\n').filter(line => line.trim());
    
    const insights: string[] = [];
    const recommendations: string[] = [];
    const alerts: string[] = [];
    
    // Basit parsing - gerçek projede daha gelişmiş olacak
    lines.forEach(line => {
      if (line.includes('öneri') || line.includes('tavsiye')) {
        recommendations.push(line.trim());
      } else if (line.includes('dikkat') || line.includes('uyar')) {
        alerts.push(line.trim());
      } else if (line.trim().length > 10) {
        insights.push(line.trim());
      }
    });

    return {
      insights: insights.slice(0, 3),
      recommendations: recommendations.slice(0, 3),
      alerts: alerts.slice(0, 2),
      confidence: 0.8, // Static for prototype
      riskLevel: 'low', // Default risk level
    };
  }

  /**
   * Uyarıları parse et
   */
  private parseAlerts(response: string): string[] {
    if (response.toLowerCase().includes('normal')) {
      return [];
    }
    
    return response
      .split('\n')
      .filter(line => line.trim() && line.trim() !== '-')
      .map(line => line.replace(/^[-•]\s*/, '').trim())
      .slice(0, 3);
  }

  /**
   * Sohbet geçmişini formatla
   */
  private formatChatHistory(history: ChatMessage[]) {
    return history.slice(-6).map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }
}
