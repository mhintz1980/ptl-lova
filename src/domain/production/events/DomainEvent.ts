/**
 * Base Domain Event interface.
 * All domain events extend this interface.
 */
export interface DomainEvent {
    readonly eventType: string;
    readonly occurredAt: Date;
    readonly aggregateId: string;
}

/**
 * Helper to create a new domain event with current timestamp.
 */
export function createEvent<T extends DomainEvent>(
    props: Omit<T, 'occurredAt'> & { occurredAt?: Date }
): T {
    return {
        ...props,
        occurredAt: props.occurredAt ?? new Date(),
    } as T;
}
