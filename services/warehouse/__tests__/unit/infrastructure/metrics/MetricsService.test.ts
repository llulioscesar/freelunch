import { MetricsService, MetricType } from '../../../../src/infrastructure/metrics/MetricsService';

describe('MetricsService', () => {
  let metrics: MetricsService;

  beforeEach(() => {
    metrics = MetricsService.getInstance();
    metrics.reset();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = MetricsService.getInstance();
      const instance2 = MetricsService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('increment', () => {
    it('should create counter metric', () => {
      metrics.increment('test_counter');
      const summary = metrics.getSummary();
      expect(summary.counters).toBe(1);
      expect(summary.totalMetrics).toBe(1);
    });

    it('should increment existing counter', () => {
      metrics.increment('test_counter');
      metrics.increment('test_counter');
      metrics.increment('test_counter', {}, 5);
      const summary = metrics.getSummary();
      expect(summary.counters).toBe(1); // Still one metric
    });

    it('should support labels', () => {
      metrics.increment('requests', { method: 'GET', path: '/api' });
      metrics.increment('requests', { method: 'POST', path: '/api' });
      const summary = metrics.getSummary();
      expect(summary.counters).toBe(2); // Two different label combinations
    });
  });

  describe('gauge', () => {
    it('should set gauge metric', () => {
      metrics.gauge('memory_usage', 1024);
      const summary = metrics.getSummary();
      expect(summary.gauges).toBe(1);
    });

    it('should overwrite gauge value', () => {
      metrics.gauge('memory_usage', 1024);
      metrics.gauge('memory_usage', 2048);
      const summary = metrics.getSummary();
      expect(summary.gauges).toBe(1); // Still one metric
    });
  });

  describe('observe', () => {
    it('should create histogram metric', () => {
      metrics.observe('request_duration', 0.5);
      const summary = metrics.getSummary();
      expect(summary.histograms).toBe(1);
    });

    it('should update histogram with multiple observations', () => {
      metrics.observe('request_duration', 0.1);
      metrics.observe('request_duration', 0.5);
      metrics.observe('request_duration', 1.0);
      const summary = metrics.getSummary();
      expect(summary.histograms).toBe(1); // Still one metric
    });
  });

  describe('exportPrometheus', () => {
    it('should format metrics in prometheus format', () => {
      metrics.increment('http_requests_total', { method: 'GET' });
      metrics.gauge('active_connections', 10);

      const output = metrics.exportPrometheus();

      expect(output).toContain('# HELP http_requests_total');
      expect(output).toContain('# TYPE http_requests_total counter');
      expect(output).toContain('http_requests_total');
      expect(output).toContain('# TYPE active_connections gauge');
      expect(output).toContain('active_connections 10');
    });

    it('should format histogram metrics correctly', () => {
      metrics.observe('request_duration', 0.05);

      const output = metrics.exportPrometheus();

      expect(output).toContain('# TYPE request_duration histogram');
      expect(output).toContain('request_duration_bucket');
      expect(output).toContain('request_duration_sum');
      expect(output).toContain('request_duration_count');
    });
  });

  describe('exportJSON', () => {
    it('should return metrics as JSON object', () => {
      metrics.increment('test_counter');
      metrics.gauge('test_gauge', 42);

      const json = metrics.exportJSON();

      expect(Object.keys(json).length).toBe(2);
      expect(json['test_counter']).toBeDefined();
      expect(json['test_gauge']).toBeDefined();
    });

    it('should include histogram details in JSON', () => {
      metrics.observe('test_histogram', 0.5);

      const json = metrics.exportJSON();

      expect(json['test_histogram'].type).toBe(MetricType.HISTOGRAM);
      expect(json['test_histogram'].sum).toBeDefined();
      expect(json['test_histogram'].count).toBe(1);
      expect(json['test_histogram'].avg).toBe(0.5);
    });
  });

  describe('reset', () => {
    it('should clear all metrics', () => {
      metrics.increment('counter1');
      metrics.increment('counter2');
      metrics.gauge('gauge1', 100);

      metrics.reset();

      expect(metrics.getSummary().totalMetrics).toBe(0);
    });
  });

  describe('getSummary', () => {
    it('should return correct counts by type', () => {
      metrics.increment('counter1');
      metrics.increment('counter2');
      metrics.gauge('gauge1', 100);
      metrics.gauge('gauge2', 200);
      metrics.observe('histogram1', 0.5);

      const summary = metrics.getSummary();

      expect(summary.totalMetrics).toBe(5);
      expect(summary.counters).toBe(2);
      expect(summary.gauges).toBe(2);
      expect(summary.histograms).toBe(1);
    });
  });

  describe('business metrics - HTTP', () => {
    it('should record HTTP request metrics', () => {
      metrics.recordHttpRequest('GET', '/api/inventory', 200, 0.05);

      const summary = metrics.getSummary();
      expect(summary.totalMetrics).toBeGreaterThan(0);
    });
  });

  describe('business metrics - Database', () => {
    it('should record database query metrics', () => {
      metrics.recordDatabaseQuery('SELECT', 0.01);
      metrics.recordDatabaseQuery('INSERT', 0.02, true); // with error

      const summary = metrics.getSummary();
      expect(summary.totalMetrics).toBeGreaterThan(0);
    });
  });

  describe('business metrics - Cache', () => {
    it('should record cache hit', () => {
      metrics.recordCacheOperation('hit', 0.001);

      const summary = metrics.getSummary();
      expect(summary.totalMetrics).toBeGreaterThan(0);
    });

    it('should record cache miss', () => {
      metrics.recordCacheOperation('miss', 0.002);

      const summary = metrics.getSummary();
      expect(summary.totalMetrics).toBeGreaterThan(0);
    });

    it('should calculate hit rate', () => {
      metrics.recordCacheOperation('hit', 0.001);
      metrics.recordCacheOperation('hit', 0.001);
      metrics.recordCacheOperation('miss', 0.002);

      const summary = metrics.getSummary();
      expect(summary.gauges).toBeGreaterThan(0); // hit rate is a gauge
    });
  });

  describe('business metrics - Events', () => {
    it('should record event published', () => {
      metrics.recordEventPublished('IngredientsReserved', 'stream:kitchen:responses');

      const summary = metrics.getSummary();
      expect(summary.counters).toBeGreaterThan(0);
    });

    it('should record event consumed', () => {
      metrics.recordEventConsumed('IngredientsRequested', 'stream:warehouse:requests', 'warehouse-service', 0.05);
      metrics.recordEventConsumed('IngredientsRequested', 'stream:warehouse:requests', 'warehouse-service', 0.05, true); // with error

      const summary = metrics.getSummary();
      expect(summary.totalMetrics).toBeGreaterThan(0);
    });
  });

  describe('business metrics - Use Case', () => {
    it('should record use case execution', () => {
      metrics.recordUseCaseExecution('ProcessIngredientRequest', 0.1, true);
      metrics.recordUseCaseExecution('ProcessIngredientRequest', 0.2, false); // failure

      const summary = metrics.getSummary();
      expect(summary.totalMetrics).toBeGreaterThan(0);
    });
  });

  describe('business metrics - Inventory', () => {
    it('should record inventory check', () => {
      metrics.recordInventoryCheck('tomato', true);
      metrics.recordInventoryCheck('cheese', false); // unavailable

      const summary = metrics.getSummary();
      expect(summary.counters).toBeGreaterThan(0);
    });

    it('should record inventory updated', () => {
      metrics.recordInventoryUpdated('tomato', 10);

      const summary = metrics.getSummary();
      expect(summary.gauges).toBeGreaterThan(0);
    });

    it('should record ingredients reserved', () => {
      metrics.recordIngredientsReserved('plate-123', 5);

      const summary = metrics.getSummary();
      expect(summary.counters).toBeGreaterThan(0);
    });

    it('should record ingredients unavailable', () => {
      metrics.recordIngredientsUnavailable('plate-123', 'out_of_stock');

      const summary = metrics.getSummary();
      expect(summary.counters).toBeGreaterThan(0);
    });
  });

  describe('business metrics - Market', () => {
    it('should record market purchase', () => {
      metrics.recordMarketPurchase('tomato', 5, 3);
      metrics.recordMarketPurchase('cheese', 2, 0); // empty result

      const summary = metrics.getSummary();
      expect(summary.counters).toBeGreaterThan(0);
    });

    it('should record market purchase latency', () => {
      metrics.recordMarketPurchaseLatency('tomato', 0.5);

      const summary = metrics.getSummary();
      expect(summary.histograms).toBeGreaterThan(0);
    });

    it('should record market purchase error', () => {
      metrics.recordMarketPurchaseError('tomato', 'timeout');

      const summary = metrics.getSummary();
      expect(summary.counters).toBeGreaterThan(0);
    });
  });

  describe('business metrics - Request Processing', () => {
    it('should record ingredient request processed', () => {
      metrics.recordIngredientRequestProcessed(true, 0.1);
      metrics.recordIngredientRequestProcessed(false, 0.2);

      const summary = metrics.getSummary();
      expect(summary.totalMetrics).toBeGreaterThan(0);
    });
  });

  describe('health metrics', () => {
    it('should record health check', () => {
      metrics.recordHealthCheck('redis', true, 0.01);
      metrics.recordHealthCheck('database', false, 0.02);

      const summary = metrics.getSummary();
      expect(summary.gauges).toBeGreaterThan(0);
    });

    it('should record service health', () => {
      metrics.recordServiceHealth(true);
      metrics.recordServiceHealth(false);

      const summary = metrics.getSummary();
      expect(summary.gauges).toBeGreaterThan(0);
    });
  });
});
