/**
 * PumpCreated Event - Emitted when a new pump is added to the system.
 */
import { DomainEvent } from './DomainEvent';
import { Stage } from '../value-objects/Stage';
import { Priority } from '../value-objects/Priority';

export interface PumpCreated extends DomainEvent {
    readonly eventType: 'PumpCreated';
    readonly pumpId: string;
    readonly serial: number;
    readonly model: string;
    readonly customer: string;
    readonly po: string;
    readonly stage: Stage;
    readonly priority: Priority;
    readonly value: number;
}

export function pumpCreated(props: Omit<PumpCreated, 'eventType' | 'occurredAt' | 'aggregateId'>): PumpCreated {
    return {
        eventType: 'PumpCreated',
        aggregateId: props.pumpId,
        occurredAt: new Date(),
        ...props,
    };
}
