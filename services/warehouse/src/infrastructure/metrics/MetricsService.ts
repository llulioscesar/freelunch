/**
 * Metrics Service
 * Warehouse Service
 *
 * Prometheus-style metrics service for business and performance monitoring.
 * Stores metrics in-memory and exposes them in Prometheus format.
 */

export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
}

interface Metric {
  name: string;
  type: MetricType;
  help: string;
  labels?: Record<string, string>;
  value: number;
  timestamp: number;
}

interface HistogramBucket {
  le: number; // less than or equal
  count: number;
}

interface HistogramMetric extends Metric {
  buckets: HistogramBucket[];
  sum: number;
  count: number;
}

/**
 * MetricsService - Singleton pattern
 */
export class MetricsService {
  private static instance: MetricsService;
  private metrics: Map<string, Metric | HistogramMetric> = new Map();

  // Default histogram buckets (in seconds): 10ms, 50ms, 100ms, 500ms, 1s, 2s, 5s
  private defaultBuckets = [0.01, 0.05, 0.1, 0.5, 1, 2, 5];

  private constructor() {}

  static getInstance(): MetricsService {
    if (!MetricsService.instance) {
      MetricsService.instance = new MetricsService();
    }
    return MetricsService.instance;
  }

  /**
   * Increment a counter metric
   */
  increment(name: string, labels: Record<string, string> = {}, value: number = 1): void {
    const key = this.buildKey(name, labels);
    const existing = this.metrics.get(key);

    if (existing && existing.type === MetricType.COUNTER) {
      existing.value += value;
      existing.timestamp = Date.now();
    } else {
      this.metrics.set(key, {
        name,
        type: MetricType.COUNTER,
        help: `Counter metric: ${name}`,
        labels,
        value,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Set a gauge metric (absolute value)
   */
  gauge(name: string, value: number, labels: Record<string, string> = {}): void {
    const key = this.buildKey(name, labels);

    this.metrics.set(key, {
      name,
      type: MetricType.GAUGE,
      help: `Gauge metric: ${name}`,
      labels,
      value,
      timestamp: Date.now(),
    });
  }

  /**
   * Observe a value for histogram metric (typically duration)
   */
  observe(name: string, value: number, labels: Record<string, string> = {}): void {
    const key = this.buildKey(name, labels);
    const existing = this.metrics.get(key) as HistogramMetric;

    if (existing && existing.type === MetricType.HISTOGRAM) {
      // Update existing histogram
      existing.sum += value;
      existing.count += 1;
      existing.timestamp = Date.now();

      // Update buckets
      for (const bucket of existing.buckets) {
        if (value <= bucket.le) {
          bucket.count += 1;
        }
      }
    } else {
      // Create new histogram
      const buckets: HistogramBucket[] = this.defaultBuckets.map(le => ({
        le,
        count: value <= le ? 1 : 0,
      }));

      // Add +Inf bucket
      buckets.push({ le: Infinity, count: 1 });

      this.metrics.set(key, {
        name,
        type: MetricType.HISTOGRAM,
        help: `Histogram metric: ${name}`,
        labels,
        value: 0, // Not used for histograms
        buckets,
        sum: value,
        count: 1,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Record HTTP request metrics
   */
  recordHttpRequest(
    method: string,
    endpoint: string,
    statusCode: number,
    durationSeconds: number
  ): void {
    const labels = { method, endpoint, status_code: statusCode.toString() };

    // Total requests
    this.increment('http_requests_total', labels);

    // Request duration
    this.observe('http_request_duration_seconds', durationSeconds, labels);

    // Requests by status code
    this.increment('http_requests_by_status_code', { status_code: statusCode.toString() });
  }

  /**
   * Record database query metrics
   */
  recordDatabaseQuery(operation: string, durationSeconds: number, error?: boolean): void {
    const labels = { operation };

    this.increment('db_queries_total', labels);
    this.observe('db_query_duration_seconds', durationSeconds, labels);

    if (error) {
      this.increment('db_errors_total', labels);
    }
  }

  /**
   * Record cache operation metrics
   */
  recordCacheOperation(operation: 'hit' | 'miss', durationSeconds: number): void {
    if (operation === 'hit') {
      this.increment('cache_hits_total');
    } else {
      this.increment('cache_misses_total');
    }

    this.observe('cache_operation_duration_seconds', durationSeconds, { operation });

    // Calculate and update hit rate
    const hits = this.getMetricValue('cache_hits_total') || 0;
    const misses = this.getMetricValue('cache_misses_total') || 0;
    const total = hits + misses;

    if (total > 0) {
      const hitRate = (hits / total) * 100;
      this.gauge('cache_hit_rate', hitRate);
    }
  }

  /**
   * Record event metrics
   */
  recordEventPublished(eventType: string, streamName: string): void {
    this.increment('events_published_total', { event_type: eventType, stream_name: streamName });
  }

  recordEventConsumed(
    eventType: string,
    streamName: string,
    consumerGroup: string,
    durationSeconds: number,
    error?: boolean
  ): void {
    const labels = { event_type: eventType, stream_name: streamName, consumer_group: consumerGroup };

    this.increment('events_consumed_total', labels);
    this.observe('events_processing_duration_seconds', durationSeconds, labels);

    if (error) {
      this.increment('events_errors_total', labels);
    }
  }

  /**
   * Record use case execution metrics
   */
  recordUseCaseExecution(
    useCaseName: string,
    durationSeconds: number,
    success: boolean
  ): void {
    const labels = { use_case_name: useCaseName, success: success.toString() };

    this.increment('usecase_executions_total', labels);
    this.observe('usecase_duration_seconds', durationSeconds, labels);

    if (!success) {
      this.increment('usecase_errors_total', { use_case_name: useCaseName });
    }
  }

  /**
   * Business Metrics - Inventory
   */
  recordInventoryCheck(ingredientName: string, available: boolean): void {
    this.increment('inventory_checks_total', { ingredient_name: ingredientName });
    if (!available) {
      this.increment('inventory_insufficient_total', { ingredient_name: ingredientName });
    }
  }

  recordInventoryUpdated(ingredientName: string, quantity: number): void {
    this.gauge('inventory_quantity', quantity, { ingredient_name: ingredientName });
  }

  recordIngredientsReserved(plateId: string, ingredientCount: number): void {
    this.increment('ingredients_reserved_total', { plate_id: plateId });
    this.increment('ingredients_reserved_count', {}, ingredientCount);
  }

  recordIngredientsUnavailable(plateId: string, reason: string): void {
    this.increment('ingredients_unavailable_total', { plate_id: plateId, reason });
  }

  /**
   * Business Metrics - Market Purchases
   */
  recordMarketPurchase(ingredientName: string, requested: number, obtained: number): void {
    this.increment('market_purchases_total', { ingredient_name: ingredientName });
    this.increment('market_purchase_requested', { ingredient_name: ingredientName }, requested);
    this.increment('market_purchase_obtained', { ingredient_name: ingredientName }, obtained);

    if (obtained === 0) {
      this.increment('market_purchase_empty_total', { ingredient_name: ingredientName });
    }
  }

  recordMarketPurchaseLatency(ingredientName: string, durationSeconds: number): void {
    this.observe('market_purchase_duration_seconds', durationSeconds, { ingredient_name: ingredientName });
  }

  recordMarketPurchaseError(ingredientName: string, errorType: string): void {
    this.increment('market_purchase_errors_total', { ingredient_name: ingredientName, error_type: errorType });
  }

  /**
   * Business Metrics - Request Processing
   */
  recordIngredientRequestProcessed(success: boolean, durationSeconds: number): void {
    this.increment('ingredient_requests_processed_total', { success: success.toString() });
    this.observe('ingredient_request_duration_seconds', durationSeconds, { success: success.toString() });
  }

  /**
   * Health metrics
   */
  recordHealthCheck(component: string, healthy: boolean, durationSeconds: number): void {
    this.gauge(`${component}_health`, healthy ? 1 : 0);
    this.observe('health_check_duration_seconds', durationSeconds, { component });
  }

  recordServiceHealth(healthy: boolean): void {
    this.gauge('service_health', healthy ? 1 : 0);
  }

  /**
   * Get current value of a metric
   */
  private getMetricValue(name: string, labels: Record<string, string> = {}): number | undefined {
    const key = this.buildKey(name, labels);
    const metric = this.metrics.get(key);
    return metric?.value;
  }

  /**
   * Build unique key for metric with labels
   */
  private buildKey(name: string, labels: Record<string, string>): string {
    if (Object.keys(labels).length === 0) {
      return name;
    }

    const sortedLabels = Object.keys(labels)
      .sort()
      .map(key => `${key}="${labels[key]}"`)
      .join(',');

    return `${name}{${sortedLabels}}`;
  }

  /**
   * Export metrics in Prometheus format
   */
  exportPrometheus(): string {
    const lines: string[] = [];
    const groupedMetrics = this.groupMetricsByName();

    for (const [name, metrics] of groupedMetrics.entries()) {
      const firstMetric = metrics[0];

      // Write HELP and TYPE
      lines.push(`# HELP ${name} ${firstMetric.help}`);
      lines.push(`# TYPE ${name} ${firstMetric.type}`);

      for (const metric of metrics) {
        if (metric.type === MetricType.HISTOGRAM) {
          const histogram = metric as HistogramMetric;

          // Write buckets
          for (const bucket of histogram.buckets) {
            const labels = this.formatLabels({ ...metric.labels, le: bucket.le.toString() });
            lines.push(`${name}_bucket${labels} ${bucket.count}`);
          }

          // Write sum and count
          const labels = this.formatLabels(metric.labels);
          lines.push(`${name}_sum${labels} ${histogram.sum}`);
          lines.push(`${name}_count${labels} ${histogram.count}`);
        } else {
          // Counter or Gauge
          const labels = this.formatLabels(metric.labels);
          lines.push(`${name}${labels} ${metric.value}`);
        }
      }

      lines.push(''); // Empty line between metrics
    }

    return lines.join('\n');
  }

  /**
   * Export metrics as JSON (for custom dashboards)
   */
  exportJSON(): Record<string, any> {
    const result: Record<string, any> = {};

    for (const [key, metric] of this.metrics.entries()) {
      if (metric.type === MetricType.HISTOGRAM) {
        const histogram = metric as HistogramMetric;
        result[key] = {
          type: metric.type,
          labels: metric.labels,
          sum: histogram.sum,
          count: histogram.count,
          avg: histogram.count > 0 ? histogram.sum / histogram.count : 0,
          buckets: histogram.buckets,
        };
      } else {
        result[key] = {
          type: metric.type,
          labels: metric.labels,
          value: metric.value,
        };
      }
    }

    return result;
  }

  /**
   * Group metrics by name (without labels)
   */
  private groupMetricsByName(): Map<string, (Metric | HistogramMetric)[]> {
    const grouped = new Map<string, (Metric | HistogramMetric)[]>();

    for (const metric of this.metrics.values()) {
      const existing = grouped.get(metric.name) || [];
      existing.push(metric);
      grouped.set(metric.name, existing);
    }

    return grouped;
  }

  /**
   * Format labels for Prometheus output
   */
  private formatLabels(labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) {
      return '';
    }

    const formatted = Object.keys(labels)
      .sort()
      .map(key => `${key}="${labels[key]}"`)
      .join(',');

    return `{${formatted}}`;
  }

  /**
   * Reset all metrics (useful for testing)
   */
  reset(): void {
    this.metrics.clear();
  }

  /**
   * Get summary statistics
   */
  getSummary(): {
    totalMetrics: number;
    counters: number;
    gauges: number;
    histograms: number;
  } {
    let counters = 0;
    let gauges = 0;
    let histograms = 0;

    for (const metric of this.metrics.values()) {
      switch (metric.type) {
        case MetricType.COUNTER:
          counters++;
          break;
        case MetricType.GAUGE:
          gauges++;
          break;
        case MetricType.HISTOGRAM:
          histograms++;
          break;
      }
    }

    return {
      totalMetrics: this.metrics.size,
      counters,
      gauges,
      histograms,
    };
  }
}

// Export singleton instance
export const metricsService = MetricsService.getInstance();
