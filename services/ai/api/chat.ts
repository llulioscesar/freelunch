import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildSystemContext } from '../src/context';
import { buildChatSystemPrompt, buildChatPrompt } from '../src/prompts/chat';
import { generateContent } from '../src/clients/gemini';
import { withCors } from '../src/middleware/cors';
import { ChatRequest, ChatResponse } from '../src/types';
import { randomUUID } from 'crypto';

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const startTime = Date.now();
    const body = req.body as ChatRequest;

    if (!body.message || typeof body.message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
      });
    }

    // Build context from other services
    const context = await buildSystemContext();

    // Build prompts
    const systemPrompt = buildChatSystemPrompt(context);
    const fullPrompt = buildChatPrompt(systemPrompt, body.message);

    // Generate response using Gemini
    const aiResponse = await generateContent(fullPrompt);

    const duration = Date.now() - startTime;

    const response: ChatResponse = {
      response: aiResponse,
      conversationId: body.conversationId || randomUUID(),
    };

    return res.status(200).json({
      success: true,
      data: response,
      meta: {
        duration,
      },
    });
  } catch (error) {
    console.error('Error in chat:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}

export default withCors(handler);
