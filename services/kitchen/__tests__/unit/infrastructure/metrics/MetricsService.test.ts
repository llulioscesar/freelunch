import { MetricsService, MetricType } from '../../../../src/infrastructure/metrics/MetricsService.js';

describe('MetricsService', () => {
  let metricsService: MetricsService;

  beforeEach(() => {
    metricsService = MetricsService.getInstance();
    metricsService.reset();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = MetricsService.getInstance();
      const instance2 = MetricsService.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('increment', () => {
    it('should increment counter metric', () => {
      metricsService.increment('test_counter');

      const metrics = metricsService.exportJSON();
      expect(metrics['test_counter'].value).toBe(1);
      expect(metrics['test_counter'].type).toBe(MetricType.COUNTER);
    });

    it('should increment counter by custom value', () => {
      metricsService.increment('test_counter', {}, 5);

      const metrics = metricsService.exportJSON();
      expect(metrics['test_counter'].value).toBe(5);
    });

    it('should increment existing counter', () => {
      metricsService.increment('test_counter');
      metricsService.increment('test_counter');

      const metrics = metricsService.exportJSON();
      expect(metrics['test_counter'].value).toBe(2);
    });

    it('should handle counter with labels', () => {
      metricsService.increment('test_counter', { label1: 'value1' });

      const metrics = metricsService.exportJSON();
      expect(metrics['test_counter{label1="value1"}'].value).toBe(1);
    });
  });

  describe('gauge', () => {
    it('should set gauge metric', () => {
      metricsService.gauge('test_gauge', 42);

      const metrics = metricsService.exportJSON();
      expect(metrics['test_gauge'].value).toBe(42);
      expect(metrics['test_gauge'].type).toBe(MetricType.GAUGE);
    });

    it('should update gauge value', () => {
      metricsService.gauge('test_gauge', 10);
      metricsService.gauge('test_gauge', 20);

      const metrics = metricsService.exportJSON();
      expect(metrics['test_gauge'].value).toBe(20);
    });

    it('should handle gauge with labels', () => {
      metricsService.gauge('test_gauge', 100, { status: 'success' });

      const metrics = metricsService.exportJSON();
      expect(metrics['test_gauge{status="success"}'].value).toBe(100);
    });
  });

  describe('observe', () => {
    it('should create histogram metric', () => {
      metricsService.observe('test_histogram', 0.5);

      const metrics = metricsService.exportJSON();
      expect(metrics['test_histogram'].type).toBe(MetricType.HISTOGRAM);
      expect(metrics['test_histogram'].sum).toBe(0.5);
      expect(metrics['test_histogram'].count).toBe(1);
    });

    it('should update histogram with multiple observations', () => {
      metricsService.observe('test_histogram', 0.1);
      metricsService.observe('test_histogram', 0.2);
      metricsService.observe('test_histogram', 0.3);

      const metrics = metricsService.exportJSON();
      expect(metrics['test_histogram'].sum).toBeCloseTo(0.6);
      expect(metrics['test_histogram'].count).toBe(3);
      expect(metrics['test_histogram'].avg).toBeCloseTo(0.2);
    });
  });

  describe('recordHttpRequest', () => {
    it('should record HTTP request metrics', () => {
      metricsService.recordHttpRequest('GET', '/api/plates', 200, 0.15);

      const metrics = metricsService.exportJSON();
      expect(metrics['http_requests_total{endpoint="/api/plates",method="GET",status_code="200"}'].value).toBe(1);
    });
  });

  describe('recordDatabaseQuery', () => {
    it('should record database query metrics', () => {
      metricsService.recordDatabaseQuery('plate_save', 0.05);

      const metrics = metricsService.exportJSON();
      expect(metrics['db_queries_total{operation="plate_save"}'].value).toBe(1);
    });

    it('should record database error', () => {
      metricsService.recordDatabaseQuery('plate_save', 0.05, true);

      const metrics = metricsService.exportJSON();
      expect(metrics['db_errors_total{operation="plate_save"}'].value).toBe(1);
    });
  });

  describe('recordCacheOperation', () => {
    it('should record cache hit', () => {
      metricsService.recordCacheOperation('hit', 0.001);

      const metrics = metricsService.exportJSON();
      expect(metrics['cache_hits_total'].value).toBe(1);
    });

    it('should record cache miss', () => {
      metricsService.recordCacheOperation('miss', 0.001);

      const metrics = metricsService.exportJSON();
      expect(metrics['cache_misses_total'].value).toBe(1);
    });

    it('should calculate cache hit rate', () => {
      metricsService.recordCacheOperation('hit', 0.001);
      metricsService.recordCacheOperation('hit', 0.001);
      metricsService.recordCacheOperation('miss', 0.001);

      const metrics = metricsService.exportJSON();
      expect(metrics['cache_hit_rate'].value).toBeCloseTo(66.67, 1);
    });
  });

  describe('recordEventPublished', () => {
    it('should record event published metrics', () => {
      metricsService.recordEventPublished('plate.assigned', 'stream:kitchen:events');

      const metrics = metricsService.exportJSON();
      expect(
        metrics['events_published_total{event_type="plate.assigned",stream_name="stream:kitchen:events"}'].value
      ).toBe(1);
    });
  });

  describe('recordEventConsumed', () => {
    it('should record event consumed metrics', () => {
      metricsService.recordEventConsumed('plate.assigned', 'stream:kitchen:events', 'kitchen-service', 0.1);

      const metrics = metricsService.exportJSON();
      expect(
        metrics[
          'events_consumed_total{consumer_group="kitchen-service",event_type="plate.assigned",stream_name="stream:kitchen:events"}'
        ].value
      ).toBe(1);
    });

    it('should record event error', () => {
      metricsService.recordEventConsumed('plate.assigned', 'stream:kitchen:events', 'kitchen-service', 0.1, true);

      const metrics = metricsService.exportJSON();
      expect(
        metrics[
          'events_errors_total{consumer_group="kitchen-service",event_type="plate.assigned",stream_name="stream:kitchen:events"}'
        ].value
      ).toBe(1);
    });
  });

  describe('recordUseCaseExecution', () => {
    it('should record successful use case execution', () => {
      metricsService.recordUseCaseExecution('ProcessOrderUseCase', 0.2, true);

      const metrics = metricsService.exportJSON();
      expect(metrics['usecase_executions_total{success="true",use_case_name="ProcessOrderUseCase"}'].value).toBe(1);
    });

    it('should record failed use case execution', () => {
      metricsService.recordUseCaseExecution('ProcessOrderUseCase', 0.2, false);

      const metrics = metricsService.exportJSON();
      expect(metrics['usecase_errors_total{use_case_name="ProcessOrderUseCase"}'].value).toBe(1);
    });
  });

  describe('business metrics - plates', () => {
    it('should record plate created', () => {
      metricsService.recordPlateCreated('order-123');

      const metrics = metricsService.exportJSON();
      expect(metrics['plates_created_total'].value).toBe(1);
      expect(metrics['plates_created_by_order{order_id="order-123"}'].value).toBe(1);
    });

    it('should record plate assigned', () => {
      metricsService.recordPlateAssigned('recipe-abc', 'Tomato Salad');

      const metrics = metricsService.exportJSON();
      expect(metrics['plates_assigned_total'].value).toBe(1);
    });

    it('should record plate ready', () => {
      metricsService.recordPlateReady('recipe-abc', 'Tomato Salad', 120);

      const metrics = metricsService.exportJSON();
      expect(metrics['plates_ready_total'].value).toBe(1);
    });

    it('should record plate failed', () => {
      metricsService.recordPlateFailed('ingredients unavailable');

      const metrics = metricsService.exportJSON();
      expect(metrics['plates_failed_total{reason="ingredients unavailable"}'].value).toBe(1);
    });

    it('should record plates by status', () => {
      metricsService.recordPlatesByStatus('PENDING', 5);

      const metrics = metricsService.exportJSON();
      expect(metrics['plates_by_status{status="PENDING"}'].value).toBe(5);
    });
  });

  describe('business metrics - recipes', () => {
    it('should record recipe usage', () => {
      metricsService.recordRecipeUsage('recipe-abc', 'Tomato Salad');

      const metrics = metricsService.exportJSON();
      expect(metrics['recipe_usage_total{recipe_id="recipe-abc",recipe_name="Tomato Salad"}'].value).toBe(1);
    });

    it('should record recipe availability', () => {
      metricsService.recordRecipeAvailability('recipe-abc', 'Tomato Salad', true);

      const metrics = metricsService.exportJSON();
      expect(metrics['recipe_availability{recipe_id="recipe-abc",recipe_name="Tomato Salad"}'].value).toBe(1);
    });
  });

  describe('business metrics - ingredients', () => {
    it('should record ingredients requested', () => {
      metricsService.recordIngredientsRequested('plate-123', 'recipe-abc', 3);

      const metrics = metricsService.exportJSON();
      expect(metrics['ingredients_requests_total'].value).toBe(1);
      expect(metrics['ingredients_requested_count'].value).toBe(3);
    });

    it('should record ingredients available', () => {
      metricsService.recordIngredientsAvailable('plate-123', 'recipe-abc');

      const metrics = metricsService.exportJSON();
      expect(metrics['ingredients_available_total'].value).toBe(1);
    });

    it('should record ingredients unavailable', () => {
      metricsService.recordIngredientsUnavailable('plate-123', 'recipe-abc', 'out of stock');

      const metrics = metricsService.exportJSON();
      expect(metrics['ingredients_unavailable_total{reason="out of stock"}'].value).toBe(1);
    });
  });

  describe('health metrics', () => {
    it('should record health check', () => {
      metricsService.recordHealthCheck('database', true, 0.05);

      const metrics = metricsService.exportJSON();
      expect(metrics['database_health'].value).toBe(1);
    });

    it('should record service health', () => {
      metricsService.recordServiceHealth(true);

      const metrics = metricsService.exportJSON();
      expect(metrics['service_health'].value).toBe(1);
    });
  });

  describe('exportPrometheus', () => {
    it('should export metrics in Prometheus format', () => {
      metricsService.increment('test_counter');
      metricsService.gauge('test_gauge', 42);

      const prometheus = metricsService.exportPrometheus();

      expect(prometheus).toContain('# HELP test_counter');
      expect(prometheus).toContain('# TYPE test_counter counter');
      expect(prometheus).toContain('test_counter 1');
      expect(prometheus).toContain('# HELP test_gauge');
      expect(prometheus).toContain('# TYPE test_gauge gauge');
      expect(prometheus).toContain('test_gauge 42');
    });

    it('should export histogram in Prometheus format', () => {
      metricsService.observe('test_histogram', 0.5);

      const prometheus = metricsService.exportPrometheus();

      expect(prometheus).toContain('# TYPE test_histogram histogram');
      expect(prometheus).toContain('test_histogram_bucket');
      expect(prometheus).toContain('test_histogram_sum');
      expect(prometheus).toContain('test_histogram_count');
    });
  });

  describe('getSummary', () => {
    it('should return metrics summary', () => {
      metricsService.increment('counter1');
      metricsService.gauge('gauge1', 10);
      metricsService.observe('histogram1', 0.5);

      const summary = metricsService.getSummary();

      expect(summary.totalMetrics).toBe(3);
      expect(summary.counters).toBe(1);
      expect(summary.gauges).toBe(1);
      expect(summary.histograms).toBe(1);
    });
  });

  describe('reset', () => {
    it('should reset all metrics', () => {
      metricsService.increment('test_counter');
      metricsService.gauge('test_gauge', 42);

      metricsService.reset();

      const summary = metricsService.getSummary();
      expect(summary.totalMetrics).toBe(0);
    });
  });
});
