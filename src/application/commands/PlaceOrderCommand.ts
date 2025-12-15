/**
 * PlaceOrderCommand - Command to create a new purchase order.
 */
import { LineItemProps } from '../../domain/sales/entities/LineItem';

export interface PlaceOrderCommand {
    readonly type: 'PlaceOrder';
    readonly po: string;
    readonly customer: string;
    readonly dateReceived?: string; // ISO string
    readonly promiseDate?: string; // ISO string
    readonly lines: LineItemProps[];
}

export function placeOrderCommand(
    po: string,
    customer: string,
    lines: LineItemProps[],
    options?: { dateReceived?: string; promiseDate?: string }
): PlaceOrderCommand {
    return {
        type: 'PlaceOrder',
        po,
        customer,
        lines,
        dateReceived: options?.dateReceived,
        promiseDate: options?.promiseDate,
    };
}
