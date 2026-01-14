import { describe, it, expect } from 'vitest';
import { priorityChanged } from './PriorityChanged';

describe('PriorityChanged Event', () => {
    describe('priorityChanged', () => {
        it('should create a PriorityChanged event with correct type', () => {
            const event = priorityChanged('pump-001', 'Normal', 'Rush');

            expect(event.eventType).toBe('PriorityChanged');
            expect(event.aggregateId).toBe('pump-001');
            expect(event.pumpId).toBe('pump-001');
            expect(event.oldPriority).toBe('Normal');
            expect(event.newPriority).toBe('Rush');
            expect(event.occurredAt).toBeInstanceOf(Date);
        });

        it('should serialize to JSON correctly', () => {
            const event = priorityChanged('pump-001', 'Normal', 'Rush');

            const json = JSON.stringify(event);
            const parsed = JSON.parse(json);

            expect(parsed.eventType).toBe('PriorityChanged');
            expect(parsed.pumpId).toBe('pump-001');
            expect(parsed.oldPriority).toBe('Normal');
            expect(parsed.newPriority).toBe('Rush');
            expect(typeof parsed.occurredAt).toBe('string');
        });

        it('should handle different priority values', () => {
            const event = priorityChanged('pump-002', 'Rush', 'Normal');

            expect(event.oldPriority).toBe('Rush');
            expect(event.newPriority).toBe('Normal');
        });
    });
});
