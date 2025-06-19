import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { HealthAIService } from './services/healthAI';
import { MockHealthDataGenerator } from './utils/mockData';
import { ChatMessage } from './types/health';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// AI Service instance
let aiService: HealthAIService;

try {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required');
  }
  aiService = new HealthAIService(apiKey, process.env.OPENAI_MODEL);
  console.log('✅ AI Service initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize AI Service:', error);
  process.exit(1);
}

// Routes

/**
 * Faz 1: Sağlık verisi analizi endpoint
 */
app.post('/api/analyze-health', async (req, res) => {
  try {
    const { useCase = 'normal' } = req.body;
    
    // Test verisi oluştur
    let context;
    switch (useCase) {
      case 'high-risk':
        context = MockHealthDataGenerator.generateHighRiskContext();
        break;
      case 'optimal':
        context = MockHealthDataGenerator.generateOptimalContext();
        break;
      default:
        context = MockHealthDataGenerator.generateMockHealthContext();
    }

    const analysis = await aiService.analyzeHealthData(context);
    
    res.json({
      success: true,
      data: {
        context,
        analysis
      }
    });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Analiz sırasında hata oluştu'
    });
  }
});

/**
 * Faz 2: Sohbet endpoint
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { message, useCase = 'normal', chatHistory = [] } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Mesaj gerekli'
      });
    }

    // Test verisi oluştur
    let context;
    switch (useCase) {
      case 'high-risk':
        context = MockHealthDataGenerator.generateHighRiskContext();
        break;
      case 'optimal':
        context = MockHealthDataGenerator.generateOptimalContext();
        break;
      default:
        context = MockHealthDataGenerator.generateMockHealthContext();
    }

    const response = await aiService.chatWithHealthAssistant(
      message, 
      context, 
      chatHistory
    );
    
    res.json({
      success: true,
      data: {
        message: response,
        context
      }
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Sohbet yanıtı alınamadı'
    });
  }
});

/**
 * Proaktif uyarılar endpoint
 */
app.post('/api/alerts', async (req, res) => {
  try {
    const { useCase = 'normal' } = req.body;
    
    let context;
    switch (useCase) {
      case 'high-risk':
        context = MockHealthDataGenerator.generateHighRiskContext();
        break;
      case 'optimal':
        context = MockHealthDataGenerator.generateOptimalContext();
        break;
      default:
        context = MockHealthDataGenerator.generateMockHealthContext();
    }

    const alerts = await aiService.generateProactiveAlerts(context);
    
    res.json({
      success: true,
      data: {
        alerts,
        context
      }
    });
  } catch (error) {
    console.error('Alerts error:', error);
    res.status(500).json({
      success: false,
      error: 'Uyarılar oluşturulamadı'
    });
  }
});

/**
 * Test endpoint - AI olmadan
 */
app.get('/api/test', (req, res) => {
  const mockData = MockHealthDataGenerator.generateMockHealthContext();
  res.json({
    success: true,
    message: 'AI Prototype API çalışıyor!',
    data: mockData
  });
});

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Medora AI Prototype'
  });
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Medora AI Prototype Server running on port ${port}`);
  console.log(`📍 Health check: http://localhost:${port}/health`);
  console.log(`🧪 Test endpoint: http://localhost:${port}/api/test`);
  console.log(`🤖 AI Analysis: http://localhost:${port}/api/analyze-health`);
  console.log(`💬 AI Chat: http://localhost:${port}/api/chat`);
});

export default app;
