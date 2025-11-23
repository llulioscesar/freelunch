/**
 * Adapter: QStash Event Publisher
 * Implements the EventPublisher interface using Upstash QStash
 */
import { Client } from '@upstash/qstash';
import { EventPublisher } from '../../../application/ports/out/EventPublisher';
import { DomainEvent } from '../../../domain/events/DomainEvent';
import { OrderCreatedEvent } from '../../../domain/events/OrderCreatedEvent';

export class QStashEventPublisher implements EventPublisher {
  private client: Client;
  private kitchenServiceUrl: string;

  constructor() {
    this.client = new Client({
      token: process.env.QSTASH_TOKEN || '',
    });
    this.kitchenServiceUrl = process.env.KITCHEN_SERVICE_URL || '';
  }

  async publish(event: DomainEvent): Promise<void> {
    try {
      // Route events to appropriate services
      if (event instanceof OrderCreatedEvent) {
        await this.publishOrderCreatedEvent(event);
      }
      // Add more event types as needed

      console.log(`Event published: ${event.eventName()}`);
    } catch (error) {
      console.error(`Failed to publish event: ${event.eventName()}`, error);
      throw error;
    }
  }

  async publishBatch(events: DomainEvent[]): Promise<void> {
    const promises = events.map(event => this.publish(event));
    await Promise.allSettled(promises);
  }

  private async publishOrderCreatedEvent(event: OrderCreatedEvent): Promise<void> {
    if (!this.kitchenServiceUrl) {
      console.warn('Kitchen service URL not configured, skipping event publish');
      return;
    }

    await this.client.publishJSON({
      url: `${this.kitchenServiceUrl}/api/prepare`,
      body: event.toPrimitives(),
      retries: 3,
      delay: 0,
    });
  }
}