/**
 * Port: EventPublisher
 * Interface for publishing domain events
 */
import { DomainEvent } from '../../../domain/events/DomainEvent';

export interface EventPublisher {
  /**
   * Publish a domain event
   */
  publish(event: DomainEvent): Promise<void>;

  /**
   * Publish multiple domain events
   */
  publishAll(events: DomainEvent[]): Promise<void>;
}
