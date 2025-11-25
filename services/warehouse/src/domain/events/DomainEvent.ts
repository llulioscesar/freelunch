/**
 * Base class for Domain Events
 */
import { randomUUID } from 'crypto';

export abstract class DomainEvent {
  public readonly eventId: string;
  public readonly occurredAt: Date;

  constructor() {
    this.eventId = randomUUID();
    this.occurredAt = new Date();
  }

  abstract get eventName(): string;

  abstract toPrimitives(): Record<string, unknown>;

  toJSON(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      eventName: this.eventName,
      occurredAt: this.occurredAt.toISOString(),
      data: this.toPrimitives(),
    };
  }
}
