/**
 * PumpStageMoved Event - Emitted when a pump transitions between stages.
 */
import { DomainEvent } from './DomainEvent';
import { Stage } from '../value-objects/Stage';

export interface PumpStageMoved extends DomainEvent {
    readonly eventType: 'PumpStageMoved';
    readonly pumpId: string;
    readonly fromStage: Stage | null;
    readonly toStage: Stage;
}

export function pumpStageMoved(
    pumpId: string,
    fromStage: Stage | null,
    toStage: Stage
): PumpStageMoved {
    return {
        eventType: 'PumpStageMoved',
        aggregateId: pumpId,
        occurredAt: new Date(),
        pumpId,
        fromStage,
        toStage,
    };
}
