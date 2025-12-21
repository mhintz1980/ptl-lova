/**
 * OrderPlaced Event - Emitted when a new Purchase Order is created.
 */
import { DomainEvent } from '../../production/events/DomainEvent';
import { LineItemProps } from '../entities/LineItem';

export interface OrderPlaced extends DomainEvent {
    readonly eventType: 'OrderPlaced';
    readonly po: string;
    readonly customer: string;
    readonly lines: LineItemProps[];
    readonly promiseDate?: string;
}

export function orderPlaced(
    po: string,
    customer: string,
    lines: LineItemProps[],
    promiseDate?: string
): OrderPlaced {
    return {
        eventType: 'OrderPlaced',
        aggregateId: po,
        occurredAt: new Date(),
        po,
        customer,
        lines,
        promiseDate,
    };
}
