/**
 * API Endpoint: Metrics
 *
 * Exposes Prometheus-compatible metrics for monitoring and observability.
 *
 * Usage:
 * - GET /api/metrics - Returns metrics in Prometheus format
 * - GET /api/metrics?format=json - Returns metrics in JSON format
 *
 * Integration:
 * - Grafana Cloud: Configure Prometheus data source pointing to this endpoint
 * - Datadog: Use Prometheus integration
 * - Custom scraper: Poll this endpoint every 30-60 seconds
 */
import { VercelRequest, VercelResponse } from '@vercel/node';
import { metricsService } from '../src/infrastructure/metrics/MetricsService';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const format = req.query.format as string;

    if (format === 'json') {
      // JSON format for custom dashboards
      const metrics = metricsService.exportJSON();
      const summary = metricsService.getSummary();

      return res.status(200).json({
        metrics,
        summary,
        timestamp: new Date().toISOString(),
      });
    } else {
      // Prometheus format (default)
      const prometheusMetrics = metricsService.exportPrometheus();

      // Add custom metadata
      const metadata = [
        '# Metrics for Orders Service',
        `# Generated at: ${new Date().toISOString()}`,
        '# Format: Prometheus text-based exposition format',
        '',
      ].join('\n');

      return res
        .status(200)
        .setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
        .send(metadata + prometheusMetrics);
    }
  } catch (error: any) {
    return res.status(500).json({
      error: 'Failed to export metrics',
      message: error.message,
    });
  }
}
