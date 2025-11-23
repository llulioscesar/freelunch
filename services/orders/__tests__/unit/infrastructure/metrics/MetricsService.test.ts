/**
 * Unit Tests: MetricsService
 */
import { MetricsService, MetricType } from '../../../../src/infrastructure/metrics/MetricsService';

describe('MetricsService', () => {
  let metricsService: MetricsService;

  beforeEach(() => {
    metricsService = MetricsService.getInstance();
    // Clear metrics between tests
    (metricsService as any).metrics.clear();
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
      metricsService.increment('http_requests_total', { method: 'GET' });

      const metrics = (metricsService as any).metrics;
      const key = Array.from(metrics.keys())[0];
      const metric = metrics.get(key);

      expect(metric.name).toBe('http_requests_total');
      expect(metric.type).toBe(MetricType.COUNTER);
      expect(metric.value).toBe(1);
      expect(metric.labels).toEqual({ method: 'GET' });
    });

    it('should increment existing counter', () => {
      metricsService.increment('http_requests_total', { method: 'GET' });
      metricsService.increment('http_requests_total', { method: 'GET' });

      const metrics = (metricsService as any).metrics;
      const key = Array.from(metrics.keys())[0];
      const metric = metrics.get(key);

      expect(metric.value).toBe(2);
    });

    it('should increment by custom value', () => {
      metricsService.increment('items_processed', {}, 5);

      const metrics = (metricsService as any).metrics;
      const key = Array.from(metrics.keys())[0];
      const metric = metrics.get(key);

      expect(metric.value).toBe(5);
    });
  });

  describe('gauge', () => {
    it('should set gauge metric', () => {
      metricsService.gauge('memory_usage_bytes', 1024000);

      const metrics = (metricsService as any).metrics;
      const key = Array.from(metrics.keys())[0];
      const metric = metrics.get(key);

      expect(metric.name).toBe('memory_usage_bytes');
      expect(metric.type).toBe(MetricType.GAUGE);
      expect(metric.value).toBe(1024000);
    });

    it('should update gauge value', () => {
      metricsService.gauge('cpu_usage', 50);
      metricsService.gauge('cpu_usage', 75);

      const metrics = (metricsService as any).metrics;
      const key = Array.from(metrics.keys())[0];
      const metric = metrics.get(key);

      expect(metric.value).toBe(75);
    });
  });

  describe('observe', () => {
    it('should create histogram metric', () => {
      metricsService.observe('http_request_duration_seconds', 0.15);

      const metrics = (metricsService as any).metrics;
      const key = Array.from(metrics.keys())[0];
      const metric = metrics.get(key);

      expect(metric.name).toBe('http_request_duration_seconds');
      expect(metric.type).toBe(MetricType.HISTOGRAM);
      expect(metric.sum).toBe(0.15);
      expect(metric.count).toBe(1);
    });

    it('should update existing histogram', () => {
      metricsService.observe('request_duration', 0.1);
      metricsService.observe('request_duration', 0.2);

      const metrics = (metricsService as any).metrics;
      const key = Array.from(metrics.keys())[0];
      const metric = metrics.get(key);

      expect(metric.sum).toBeCloseTo(0.3, 10);
      expect(metric.count).toBe(2);
    });
  });
});
