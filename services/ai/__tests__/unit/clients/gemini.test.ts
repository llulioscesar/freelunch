// Mock the Google Generative AI module
const mockGenerateContent = jest.fn();
const mockGetGenerativeModel = jest.fn().mockReturnValue({
  generateContent: mockGenerateContent,
});

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: mockGetGenerativeModel,
  })),
}));

import { generateContent, generateJSON } from '../../../src/clients/gemini';

describe('Gemini Client', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, GEMINI_API_KEY: 'test-api-key' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('generateContent', () => {
    it('should return text response from Gemini', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: jest.fn().mockReturnValue('Test response'),
        },
      });

      const result = await generateContent('Test prompt');
      expect(result).toBe('Test response');
    });
  });

  describe('generateJSON', () => {
    it('should parse JSON from response', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: jest.fn().mockReturnValue('{"key": "value"}'),
        },
      });

      const result = await generateJSON<{ key: string }>('Test prompt');
      expect(result).toEqual({ key: 'value' });
    });

    it('should handle JSON in markdown code blocks', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: jest.fn().mockReturnValue('```json\n{"key": "value"}\n```'),
        },
      });

      const result = await generateJSON<{ key: string }>('Test prompt');
      expect(result).toEqual({ key: 'value' });
    });

    it('should return null for invalid JSON', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: jest.fn().mockReturnValue('not valid json'),
        },
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = await generateJSON('Test prompt');
      expect(result).toBeNull();
      consoleSpy.mockRestore();
    });
  });
});
