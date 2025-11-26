import { GoogleGenerativeAI, FunctionCallingMode } from '@google/generative-ai';
import { toolDefinitions } from '../tools/definitions';
import { executeTool } from '../tools/executor';

let genAI: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

export async function generateContent(prompt: string): Promise<string> {
  const client = getClient();
  const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function generateWithTools(systemPrompt: string, userMessage: string): Promise<string> {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: 'gemini-2.0-flash',
    tools: [{ functionDeclarations: toolDefinitions }],
    toolConfig: {
      functionCallingConfig: {
        mode: FunctionCallingMode.AUTO,
      },
    },
  });

  const chat = model.startChat({
    history: [
      {
        role: 'user',
        parts: [{ text: systemPrompt }],
      },
      {
        role: 'model',
        parts: [{ text: 'Entendido. Estoy listo para ayudar con el sistema FreeLunch.' }],
      },
    ],
  });

  let response = await chat.sendMessage(userMessage);
  let candidate = response.response.candidates?.[0];

  // Handle tool calls in a loop (max 5 iterations to prevent infinite loops)
  let iterations = 0;
  const maxIterations = 5;

  while (candidate && iterations < maxIterations) {
    const functionCalls = candidate.content.parts.filter((part) => 'functionCall' in part);

    if (functionCalls.length === 0) {
      // No more function calls, return the text response
      break;
    }

    // Execute all function calls
    const functionResults = await Promise.all(
      functionCalls.map(async (part) => {
        if ('functionCall' in part && part.functionCall) {
          const functionCall = part.functionCall;
          const name = functionCall.name;
          const args = functionCall.args || {};
          const result = await executeTool(name, args as Record<string, unknown>);
          return {
            functionResponse: {
              name,
              response: result,
            },
          };
        }
        return null;
      })
    );

    // Filter out nulls and send results back to the model
    const validResults = functionResults.filter((r) => r !== null);

    if (validResults.length > 0) {
      response = await chat.sendMessage(validResults);
      candidate = response.response.candidates?.[0];
    } else {
      break;
    }

    iterations++;
  }

  // Extract text from the final response
  const textParts = candidate?.content.parts.filter((part) => 'text' in part) || [];
  return textParts.map((part) => ('text' in part ? part.text : '')).join('');
}

export async function generateJSON<T>(prompt: string): Promise<T | null> {
  const text = await generateContent(prompt);

  try {
    // Extract JSON from response (handles markdown code blocks)
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) ||
                      text.match(/```\s*([\s\S]*?)\s*```/) ||
                      text.match(/(\{[\s\S]*\})/);

    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    return JSON.parse(text);
  } catch (error) {
    console.error('Error parsing Gemini response as JSON:', error);
    console.error('Raw response:', text);
    return null;
  }
}
