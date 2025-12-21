/**
 * LineItem Value Object - Represents a single line on a Purchase Order.
 */
import { Priority } from '../../production/value-objects/Priority';

export interface LineItemProps {
    readonly model: string;
    readonly quantity: number;
    readonly color?: string;
    readonly promiseDate?: string; // ISO string
    readonly valueEach?: number;
    readonly priority?: Priority;
}

export class LineItem {
    readonly model: string;
    readonly quantity: number;
    readonly color?: string;
    readonly promiseDate?: string;
    readonly valueEach: number;
    readonly priority: Priority;

    constructor(props: LineItemProps) {
        if (props.quantity < 1) {
            throw new Error('LineItem quantity must be at least 1');
        }
        if (!props.model.trim()) {
            throw new Error('LineItem model cannot be empty');
        }

        this.model = props.model;
        this.quantity = props.quantity;
        this.color = props.color;
        this.promiseDate = props.promiseDate;
        this.valueEach = props.valueEach ?? 0;
        this.priority = props.priority ?? 'Normal';
    }

    /**
     * Total value for this line item.
     */
    totalValue(): number {
        return this.quantity * this.valueEach;
    }

    /**
     * Serialize to plain object.
     */
    toProps(): LineItemProps {
        return {
            model: this.model,
            quantity: this.quantity,
            color: this.color,
            promiseDate: this.promiseDate,
            valueEach: this.valueEach,
            priority: this.priority,
        };
    }
}
