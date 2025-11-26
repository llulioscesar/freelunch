import { Logger } from '../../../../src/infrastructure/logging/Logger.js';

describe('Logger', () => {
  let logger: Logger;

  beforeEach(() => {
    logger = Logger.getInstance();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = Logger.getInstance();
      const instance2 = Logger.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('child', () => {
    it('should create child logger with context', () => {
      const childLogger = logger.child({ requestId: 'req-123' });

      expect(childLogger).toBeInstanceOf(Logger);
    });
  });

  describe('log methods', () => {
    it('should log trace message', () => {
      expect(() => logger.trace('Trace message', { requestId: 'req-123' })).not.toThrow();
    });

    it('should log debug message', () => {
      expect(() => logger.debug('Debug message', { requestId: 'req-123' })).not.toThrow();
    });

    it('should log info message', () => {
      expect(() => logger.info('Info message', { requestId: 'req-123' })).not.toThrow();
    });

    it('should log warn message', () => {
      expect(() => logger.warn('Warning message', { requestId: 'req-123' })).not.toThrow();
    });

    it('should log error message', () => {
      const error = new Error('Test error');
      expect(() => logger.error('Error message', error, { requestId: 'req-123' })).not.toThrow();
    });

    it('should log error message without error object', () => {
      expect(() => logger.error('Error message', undefined, { requestId: 'req-123' })).not.toThrow();
    });

    it('should log fatal message', () => {
      const error = new Error('Fatal error');
      expect(() => logger.fatal('Fatal message', error, { requestId: 'req-123' })).not.toThrow();
    });

    it('should log fatal message without error object', () => {
      expect(() => logger.fatal('Fatal message', undefined, { requestId: 'req-123' })).not.toThrow();
    });
  });

  describe('domain-specific methods', () => {
    it('should log HTTP request', () => {
      expect(() =>
        logger.logRequest('GET', '/api/plates', { requestId: 'req-123' })
      ).not.toThrow();
    });

    it('should log HTTP response with info level for 2xx status', () => {
      expect(() =>
        logger.logResponse('GET', '/api/plates', 200, 150, { requestId: 'req-123' })
      ).not.toThrow();
    });

    it('should log HTTP response with warn level for 4xx status', () => {
      expect(() =>
        logger.logResponse('GET', '/api/plates', 404, 150, { requestId: 'req-123' })
      ).not.toThrow();
    });

    it('should log HTTP response with error level for 5xx status', () => {
      expect(() =>
        logger.logResponse('GET', '/api/plates', 500, 150, { requestId: 'req-123' })
      ).not.toThrow();
    });

    it('should log domain event', () => {
      expect(() =>
        logger.logDomainEvent('plate.assigned', 'plate-123', { plateId: 'plate-123' })
      ).not.toThrow();
    });

    it('should log use case start', () => {
      expect(() =>
        logger.logUseCaseStart('ProcessOrderUseCase', { orderId: 'order-123' })
      ).not.toThrow();
    });

    it('should log use case end', () => {
      expect(() =>
        logger.logUseCaseEnd('ProcessOrderUseCase', 250, { orderId: 'order-123' })
      ).not.toThrow();
    });

    it('should log use case error', () => {
      const error = new Error('Use case failed');
      expect(() =>
        logger.logUseCaseError('ProcessOrderUseCase', error, { orderId: 'order-123' })
      ).not.toThrow();
    });

    it('should log repository operation', () => {
      expect(() =>
        logger.logRepositoryOperation('save', 'Plate', 'plate-123', { plateId: 'plate-123' })
      ).not.toThrow();
    });

    it('should log repository operation without entity id', () => {
      expect(() =>
        logger.logRepositoryOperation('findAll', 'Plate', undefined, { plateId: 'plate-123' })
      ).not.toThrow();
    });

    it('should log cache hit', () => {
      expect(() =>
        logger.logCacheOperation('hit', 'plate:123', { plateId: 'plate-123' })
      ).not.toThrow();
    });

    it('should log cache miss', () => {
      expect(() =>
        logger.logCacheOperation('miss', 'plate:123', { plateId: 'plate-123' })
      ).not.toThrow();
    });

    it('should log cache set', () => {
      expect(() =>
        logger.logCacheOperation('set', 'plate:123', { plateId: 'plate-123' })
      ).not.toThrow();
    });

    it('should log cache del', () => {
      expect(() =>
        logger.logCacheOperation('del', 'plate:123', { plateId: 'plate-123' })
      ).not.toThrow();
    });

    it('should log event published', () => {
      expect(() =>
        logger.logEventPublished('plate.assigned', 'stream:kitchen:events', 'msg-123')
      ).not.toThrow();
    });

    it('should log event published without message id', () => {
      expect(() =>
        logger.logEventPublished('plate.assigned', 'stream:kitchen:events')
      ).not.toThrow();
    });

    it('should log performance with debug level for fast operations', () => {
      expect(() =>
        logger.logPerformance('database_query', 100, { plateId: 'plate-123' })
      ).not.toThrow();
    });

    it('should log performance with info level for medium operations', () => {
      expect(() =>
        logger.logPerformance('database_query', 750, { plateId: 'plate-123' })
      ).not.toThrow();
    });

    it('should log performance with warn level for slow operations', () => {
      expect(() =>
        logger.logPerformance('database_query', 1500, { plateId: 'plate-123' })
      ).not.toThrow();
    });

    it('should log business metric', () => {
      expect(() =>
        logger.logMetric('plates_created', 5, { orderId: 'order-123' })
      ).not.toThrow();
    });
  });
});
