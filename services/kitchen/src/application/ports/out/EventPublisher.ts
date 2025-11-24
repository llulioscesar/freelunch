/**
 * Port: EventPublisher
 * Interface for publishing domain events (Hexagonal Architecture)
 */
import { DomainEvent } from '../../../domain/events/DomainEvent';

export interface EventPublisher {
  /**
   * Publish a domain event to the event stream
   */
  publish(event: DomainEvent): Promise<void>;

  /**
   * Publish multiple domain events
   */
  publishBatch(events: DomainEvent[]): Promise<void>;
}
