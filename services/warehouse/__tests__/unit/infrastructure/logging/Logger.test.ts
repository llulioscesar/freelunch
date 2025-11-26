import { Logger, logger } from '../../../../src/infrastructure/logging/Logger';

describe('Logger', () => {
  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = Logger.getInstance();
      const instance2 = Logger.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('exported logger', () => {
    it('should be a Logger instance', () => {
      expect(logger).toBeInstanceOf(Logger);
    });
  });

  describe('log methods', () => {
    it('should have info method', () => {
      expect(typeof logger.info).toBe('function');
      // Should not throw
      logger.info('test info message');
    });

    it('should have debug method', () => {
      expect(typeof logger.debug).toBe('function');
      logger.debug('test debug message');
    });

    it('should have warn method', () => {
      expect(typeof logger.warn).toBe('function');
      logger.warn('test warn message');
    });

    it('should have error method', () => {
      expect(typeof logger.error).toBe('function');
      logger.error('test error message', new Error('test error'));
    });

    it('should accept context object', () => {
      logger.info('test with context', {
        requestId: 'req-123',
        ingredientName: 'tomato',
        plateId: 'plate-456',
      });
    });
  });

  describe('specialized log methods', () => {
    it('should have logEventPublished method', () => {
      expect(typeof logger.logEventPublished).toBe('function');
      logger.logEventPublished('test.event', 'stream:test', 'msg-123', {
        aggregateId: 'agg-456',
      });
    });

    it('should have logDomainEvent method', () => {
      expect(typeof logger.logDomainEvent).toBe('function');
      logger.logDomainEvent('test.event', 'agg-123', {
        requestId: 'req-456',
      });
    });

    it('should have logRequest method', () => {
      expect(typeof logger.logRequest).toBe('function');
      logger.logRequest('GET', '/api/test', {
        requestId: 'req-123',
      });
    });

    it('should have logResponse method', () => {
      expect(typeof logger.logResponse).toBe('function');
      logger.logResponse('GET', '/api/test', 200, 50, {
        requestId: 'req-123',
      });
    });

    it('should have logUseCaseStart method', () => {
      expect(typeof logger.logUseCaseStart).toBe('function');
      logger.logUseCaseStart('ProcessIngredientRequest', {
        plateId: 'plate-123',
      });
    });

    it('should have logUseCaseEnd method', () => {
      expect(typeof logger.logUseCaseEnd).toBe('function');
      logger.logUseCaseEnd('ProcessIngredientRequest', 100, {
        plateId: 'plate-123',
      });
    });
  });

  describe('child logger', () => {
    it('should create child logger with context', () => {
      const childLogger = logger.child({
        requestId: 'req-123',
        orderId: 'order-456',
      });

      expect(childLogger).toBeInstanceOf(Logger);
      childLogger.info('child logger message');
    });
  });
});
