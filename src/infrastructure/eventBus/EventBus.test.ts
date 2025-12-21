import { describe, it, expect, beforeEach } from 'vitest';
import { EventBus, getEventBus, resetEventBus } from './EventBus';
import { DomainEvent } from '../../domain/production/events/DomainEvent';

describe('EventBus', () => {
    let eventBus: EventBus;

    beforeEach(() => {
        eventBus = new EventBus();
    });

    describe('subscribe and publish', () => {
        it('should deliver events to subscribers', async () => {
            const events: DomainEvent[] = [];
            eventBus.subscribe('TestEvent', (e) => {
                events.push(e);
            });

            await eventBus.publish({
                eventType: 'TestEvent',
                aggregateId: '123',
                occurredAt: new Date(),
            });

            expect(events.length).toBe(1);
            expect(events[0].aggregateId).toBe('123');
        });

        it('should deliver to multiple subscribers', async () => {
            let count1 = 0;
            let count2 = 0;

            eventBus.subscribe('TestEvent', () => {
                count1++;
            });
            eventBus.subscribe('TestEvent', () => {
                count2++;
            });

            await eventBus.publish({
                eventType: 'TestEvent',
                aggregateId: '123',
                occurredAt: new Date(),
            });

            expect(count1).toBe(1);
            expect(count2).toBe(1);
        });

        it('should not deliver to wrong event type subscribers', async () => {
            let called = false;
            eventBus.subscribe('OtherEvent', () => {
                called = true;
            });

            await eventBus.publish({
                eventType: 'TestEvent',
                aggregateId: '123',
                occurredAt: new Date(),
            });

            expect(called).toBe(false);
        });
    });

    describe('subscribeAll', () => {
        it('should receive all events regardless of type', async () => {
            const events: DomainEvent[] = [];
            eventBus.subscribeAll((e) => {
                events.push(e);
            });

            await eventBus.publish({
                eventType: 'TypeA',
                aggregateId: '1',
                occurredAt: new Date(),
            });
            await eventBus.publish({
                eventType: 'TypeB',
                aggregateId: '2',
                occurredAt: new Date(),
            });

            expect(events.length).toBe(2);
        });
    });

    describe('unsubscribe', () => {
        it('should stop receiving events after unsubscribe', async () => {
            let count = 0;
            const unsubscribe = eventBus.subscribe('TestEvent', () => {
                count++;
            });

            await eventBus.publish({
                eventType: 'TestEvent',
                aggregateId: '1',
                occurredAt: new Date(),
            });
            expect(count).toBe(1);

            unsubscribe();

            await eventBus.publish({
                eventType: 'TestEvent',
                aggregateId: '2',
                occurredAt: new Date(),
            });
            expect(count).toBe(1); // unchanged
        });
    });

    describe('publishAll', () => {
        it('should publish multiple events in order', async () => {
            const ids: string[] = [];
            eventBus.subscribeAll((e) => {
                ids.push(e.aggregateId);
            });

            await eventBus.publishAll([
                { eventType: 'A', aggregateId: '1', occurredAt: new Date() },
                { eventType: 'B', aggregateId: '2', occurredAt: new Date() },
                { eventType: 'C', aggregateId: '3', occurredAt: new Date() },
            ]);

            expect(ids).toEqual(['1', '2', '3']);
        });
    });

    describe('handlerCount', () => {
        it('should return correct handler count', () => {
            eventBus.subscribe('TestEvent', () => { });
            eventBus.subscribe('TestEvent', () => { });
            eventBus.subscribeAll(() => { });

            // 2 specific + 1 global
            expect(eventBus.handlerCount('TestEvent')).toBe(3);
        });
    });

    describe('clear', () => {
        it('should remove all handlers', async () => {
            let called = false;
            eventBus.subscribe('TestEvent', () => {
                called = true;
            });
            eventBus.subscribeAll(() => {
                called = true;
            });

            eventBus.clear();

            await eventBus.publish({
                eventType: 'TestEvent',
                aggregateId: '1',
                occurredAt: new Date(),
            });

            expect(called).toBe(false);
        });
    });

    describe('singleton', () => {
        it('should return same instance', () => {
            resetEventBus();
            const bus1 = getEventBus();
            const bus2 = getEventBus();
            expect(bus1).toBe(bus2);
        });

        it('should reset properly', () => {
            const bus1 = getEventBus();
            resetEventBus();
            const bus2 = getEventBus();
            expect(bus1).not.toBe(bus2);
        });
    });
});
