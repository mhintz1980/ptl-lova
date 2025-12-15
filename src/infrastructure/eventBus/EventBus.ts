/**
 * EventBus - Simple in-process pub/sub for domain events.
 *
 * Provides loose coupling between domain operations and side effects.
 * Events are delivered synchronously by default.
 */
import { DomainEvent } from '../../domain/production/events/DomainEvent';

export type EventHandler<T extends DomainEvent = DomainEvent> = (event: T) => void | Promise<void>;

export class EventBus {
    private handlers: Map<string, EventHandler[]> = new Map();
    private globalHandlers: EventHandler[] = [];

    /**
     * Subscribe to a specific event type.
     */
    subscribe<T extends DomainEvent>(
        eventType: string,
        handler: EventHandler<T>
    ): () => void {
        if (!this.handlers.has(eventType)) {
            this.handlers.set(eventType, []);
        }
        this.handlers.get(eventType)!.push(handler as EventHandler);

        // Return unsubscribe function
        return () => {
            const handlers = this.handlers.get(eventType);
            if (handlers) {
                const index = handlers.indexOf(handler as EventHandler);
                if (index > -1) {
                    handlers.splice(index, 1);
                }
            }
        };
    }

    /**
     * Subscribe to ALL events (useful for logging, ledger).
     */
    subscribeAll(handler: EventHandler): () => void {
        this.globalHandlers.push(handler);

        return () => {
            const index = this.globalHandlers.indexOf(handler);
            if (index > -1) {
                this.globalHandlers.splice(index, 1);
            }
        };
    }

    /**
     * Publish an event to all subscribed handlers.
     */
    async publish(event: DomainEvent): Promise<void> {
        const handlers = this.handlers.get(event.eventType) ?? [];
        const allHandlers = [...handlers, ...this.globalHandlers];

        for (const handler of allHandlers) {
            await handler(event);
        }
    }

    /**
     * Publish multiple events.
     */
    async publishAll(events: DomainEvent[]): Promise<void> {
        for (const event of events) {
            await this.publish(event);
        }
    }

    /**
     * Clear all handlers (useful for testing).
     */
    clear(): void {
        this.handlers.clear();
        this.globalHandlers = [];
    }

    /**
     * Get count of handlers for a specific event type.
     */
    handlerCount(eventType: string): number {
        return (this.handlers.get(eventType)?.length ?? 0) + this.globalHandlers.length;
    }
}

/**
 * Singleton instance for app-wide event bus.
 */
let eventBusInstance: EventBus | null = null;

export function getEventBus(): EventBus {
    if (!eventBusInstance) {
        eventBusInstance = new EventBus();
    }
    return eventBusInstance;
}

export function resetEventBus(): void {
    if (eventBusInstance) {
        eventBusInstance.clear();
    }
    eventBusInstance = null;
}
