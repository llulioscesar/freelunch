/**
 * Port (Output): Event Publisher
 *
 * Interface for publishing domain events to external message brokers or event buses.
 * This is a port in the Hexagonal Architecture - the adapter (QStashEventPublisher)
 * implements this interface.
 *
 * Following the Dependency Inversion Principle:
 * - The Application layer defines the interface (this port)
 * - The Infrastructure layer implements it (adapter)
 */
import { DomainEvent } from '../../../domain/events/DomainEvent';

export interface EventPublisher {
  /**
   * Publish a single domain event
   * @param event - The domain event to publish
   * @throws Error if publishing fails
   */
  publish(event: DomainEvent): Promise<void>;

  /**
   * Publish multiple domain events in batch
   * @param events - Array of domain events to publish
   * @throws Error if publishing fails
   */
  publishBatch(events: DomainEvent[]): Promise<void>;
}
