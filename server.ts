import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy Google GenAI Client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    genAIClient = new GoogleGenAI({ apiKey });
  }
  return genAIClient;
}

// System instructions for Arif Fashion World Wholesale AI Assistant
const WHOLESALE_CRM_SYSTEM_INSTRUCTION = `You are "আরিফ এআই" (Arif AI Assistant) - the dedicated AI Wholesale & CRM Copilot for "Arif Fashion World" (আরিফ ফ্যাশন ওয়ার্ল্ড), a premier B2B Denim & Jeans Manufacturer and Wholesaler located in Dhaka & Tongi, Bangladesh.

Your role and personality:
1. You assist the business owner, wholesale sales managers, and order dispatchers with:
   - Reorder cycle predictions and churn prevention for wholesale retail clients across Bangladesh (e.g., Gazipur, Narayanganj, Sylhet, Chittagong, Mirpur, Tongi).
   - Drafting tailored, professional B2B WhatsApp messages in polite, natural Bengali (Bangla) or English (as requested).
   - Recommending denim models based on client preferences (D-501 Heavy 14.5 oz, D-502 Stretch Indigo 12.5 oz, D-507 Raw Selvedge 15.0 oz, D-600 Regular Fit 12.0 oz).
   - Calculating wholesale pricing, bulk discounts, logistics via Sundarban Courier / SA Paribahan, and payment credit advice.
   - Summarizing customer ledgers, debt collection follow-ups, and sales analytics.

2. Tone:
   - Respectful, business-focused, proactive, and energetic.
   - Uses customary Bangladeshi trade greetings ("আসসালামু আলাইকুম", "ভাই", "ট্রেডার্স") when drafting WhatsApp messages.
   - Always provides actionable, concise answers with formatted bullet points or ready-to-copy WhatsApp messages.`;

// API: Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API: Gemini Multi-turn Chat
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, contextData } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    const ai = getGenAI();

    // Map conversation history into Gemini format
    // Filter to user and model turns
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    // Inject live wholesale CRM context into system prompt if available
    let dynamicSystemInstruction = WHOLESALE_CRM_SYSTEM_INSTRUCTION;
    if (contextData) {
      dynamicSystemInstruction += `\n\nCURRENT LIVE CRM METRICS & CONTEXT:
- Active Wholesale Accounts: ${contextData.activeAccounts || 48}
- High-Value VIP Clients: ${contextData.vipCount || 'Rahim Fashion, Karim Traders, Sakib Jeans'}
- Available Denim Models:
  * D-501 Heavy Denim (14.5 oz): ৳ 570/pc (Best Seller)
  * D-502 Stretch Indigo (12.5 oz): ৳ 620/pc
  * D-507 Raw Selvedge (15.0 oz): ৳ 780/pc (Premium)
  * D-600 Regular Fit (12.0 oz): ৳ 510/pc
- Courier Partners: Sundarban Courier, SA Paribahan, Korotoa Courier Hub.`;
    }

    // Use gemini-2.5-flash as default high quality fast chat model
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction: dynamicSystemInstruction,
        temperature: 0.7,
      },
    });

    const replyText = response.text || 'I could not generate a response at this time.';

    res.json({
      role: 'assistant',
      content: replyText,
    });
  } catch (error: any) {
    console.error('Gemini Chat API Error:', error);
    res.status(500).json({
      error: error.message || 'Failed to communicate with Gemini AI',
    });
  }
});

// Vite middleware in dev or static files in production
async function setupViteOrStatic() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Arif Fashion World CRM Server running on port ${PORT}`);
  });
}

setupViteOrStatic();
