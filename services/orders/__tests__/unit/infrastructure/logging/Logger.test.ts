/**
 * Unit Tests: Logger
 */
// Mock pino module FIRST before imports
jest.mock('pino', () => {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    fatal: jest.fn(),
    child: jest.fn().mockReturnThis(),
  };

  const pinoMock = jest.fn(() => mockLogger);
  pinoMock.stdSerializers = {
    err: jest.fn(),
    req: jest.fn(),
    res: jest.fn(),
  };
  return pinoMock;
});

import { Logger } from '../../../../src/infrastructure/logging/Logger';
import pino from 'pino';

// Get the mocked logger for assertions
const mockPinoLogger = (pino as jest.MockedFunction<typeof pino>)();

describe('Logger', () => {
  let logger: Logger;

  beforeEach(() => {
    jest.clearAllMocks();
    logger = Logger.getInstance();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = Logger.getInstance();
      const instance2 = Logger.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('basic logging methods', () => {
    it('should log info messages', () => {
      logger.info('Test message', { key: 'value' });

      expect(mockPinoLogger.info).toHaveBeenCalled();
    });

    it('should log error messages with error object', () => {
      const error = new Error('Test error');
      logger.error('Error occurred', error, { orderId: '123' });

      expect(mockPinoLogger.error).toHaveBeenCalled();
    });

    it('should log error messages without error object', () => {
      logger.error('Error occurred', undefined, { orderId: '123' });

      expect(mockPinoLogger.error).toHaveBeenCalled();
    });

    it('should log fatal messages with error', () => {
      const error = new Error('Fatal error');
      logger.fatal('Fatal error occurred', error);

      expect(mockPinoLogger.fatal).toHaveBeenCalled();
    });

    it('should log fatal messages without error', () => {
      logger.fatal('Fatal error occurred');

      expect(mockPinoLogger.fatal).toHaveBeenCalled();
    });

    it('should log trace messages', () => {
      logger.trace('Trace message', { detail: 'value' });

      expect(mockPinoLogger.trace).toHaveBeenCalled();
    });

    it('should log warn messages', () => {
      logger.warn('Warning message', { key: 'value' });

      expect(mockPinoLogger.warn).toHaveBeenCalled();
    });

    it('should log debug messages', () => {
      logger.debug('Debug message', { key: 'value' });

      expect(mockPinoLogger.debug).toHaveBeenCalled();
    });
  });

  describe('logRequest', () => {
    it('should log HTTP requests', () => {
      logger.logRequest('POST', '/api/orders', {
        requestId: 'req-123',
        userId: 'user-456',
      });

      expect(mockPinoLogger.info).toHaveBeenCalled();
    });
  });

  describe('logResponse', () => {
    it('should log HTTP responses', () => {
      logger.logResponse('POST', '/api/orders', 201, 150, {
        requestId: 'req-123',
      });

      expect(mockPinoLogger.info).toHaveBeenCalled();
    });

    it('should log error responses', () => {
      logger.logResponse('GET', '/api/orders', 500, 200, {
        requestId: 'req-456',
      });

      expect(mockPinoLogger.error).toHaveBeenCalled();
    });
  });

  describe('logUseCaseStart', () => {
    it('should log use case start', () => {
      logger.logUseCaseStart('CreateOrder', { quantity: 5 });

      expect(mockPinoLogger.debug).toHaveBeenCalled();
    });
  });

  describe('logUseCaseEnd', () => {
    it('should log use case end', () => {
      logger.logUseCaseEnd('CreateOrder', 100, { orderId: '123' });

      expect(mockPinoLogger.debug).toHaveBeenCalled();
    });
  });

  describe('logUseCaseError', () => {
    it('should log use case errors', () => {
      const error = new Error('Use case error');
      logger.logUseCaseError('CreateOrder', error, { quantity: 5 });

      expect(mockPinoLogger.error).toHaveBeenCalled();
    });
  });

  describe('logDomainEvent', () => {
    it('should log domain events', () => {
      logger.logDomainEvent('order.created', 'ORD-123', { quantity: 5 });

      expect(mockPinoLogger.info).toHaveBeenCalled();
    });
  });

  describe('logEventPublished', () => {
    it('should log published events', () => {
      logger.logEventPublished('order.created', 'redis-stream', 'msg-123', {
        orderId: 'ORD-123',
      });

      expect(mockPinoLogger.info).toHaveBeenCalled();
    });
  });

  describe('logRepositoryOperation', () => {
    it('should log repository operations', () => {
      logger.logRepositoryOperation('save', 'Order', 50, { orderId: 'ORD-123' });

      expect(mockPinoLogger.debug).toHaveBeenCalled();
    });
  });

  describe('logCacheOperation', () => {
    it('should log cache operations', () => {
      logger.logCacheOperation('hit', 'order:123', { ttl: 300 });

      expect(mockPinoLogger.debug).toHaveBeenCalled();
    });
  });

  describe('child logger', () => {
    it('should create child logger with context', () => {
      const childLogger = logger.child({ requestId: 'req-123' });

      expect(childLogger).toBeDefined();
      expect(mockPinoLogger.child).toHaveBeenCalledWith({ requestId: 'req-123' });
    });
  });
});
