import OpenAI from 'openai';
import config from '../config';
import logger from '../utils/logger';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface AnalysisPrompt {
  modelType: string;
  answers: any[];
  knowledgeBase: any[];
}

const generatePrompt = ({ modelType, answers, knowledgeBase }: AnalysisPrompt): string => {
  const knowledgeContent = knowledgeBase.map(k => k.content).join('\n');
  
  return `Based on the following personality test answers and knowledge base, please provide a detailed analysis:

Model Type: ${modelType}

Knowledge Base:
${knowledgeContent}

User Answers:
${JSON.stringify(answers, null, 2)}

Please provide:
1. A detailed analysis of the personality traits
2. Key insights and observations
3. A concise summary (max 200 words)`;
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const analyzeWithRetry = async (prompt: string, retryCount = 0): Promise<string> => {
  try {
    const completion = await openai.chat.completions.create({
      model: config.ai_service.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: config.ai_service.temperature,
      max_tokens: config.ai_service.max_tokens,
    });

    return completion.choices[0].message.content || '';
  } catch (error) {
    if (retryCount < config.ai_service.retry_count) {
      logger.warn(`Retrying AI analysis (attempt ${retryCount + 1})`);
      await sleep(config.ai_service.retry_delay);
      return analyzeWithRetry(prompt, retryCount + 1);
    }
    logger.error('AI analysis failed after retries:', error);
    throw error;
  }
};

export const analyzePersonality = async (data: AnalysisPrompt) => {
  try {
    const prompt = generatePrompt(data);
    const analysis = await analyzeWithRetry(prompt);
    
    // Extract summary from analysis (assuming it's the last part)
    const summaryMatch = analysis.match(/Summary:([\s\S]*?)$/);
    const summary = summaryMatch ? summaryMatch[1].trim() : analysis.slice(-200);

    return {
      analysis,
      summary,
    };
  } catch (error) {
    logger.error('Error in personality analysis:', error);
    throw error;
  }
};

export default {
  analyzePersonality,
}; 