/**
 * PurchaseOrder Aggregate Root
 *
 * Represents a customer's order containing line items.
 * Invariants:
 * 1. PO number is unique (enforced by repository, not aggregate)
 * 2. At least one line item required
 * 3. Total value = sum(line.quantity * line.valueEach)
 */
import { Entity } from '../../shared/Entity';
import { LineItem, LineItemProps } from './LineItem';
import { Pump, PumpProps } from '../../production/entities/Pump';
import { nanoid } from 'nanoid';

export interface PurchaseOrderProps {
    readonly po: string;
    readonly customer: string;
    readonly dateReceived?: string; // ISO string
    readonly promiseDate?: string; // ISO string
    readonly lines: LineItemProps[];
}

export class PurchaseOrder extends Entity<string> {
    readonly po: string;
    readonly customer: string;
    readonly dateReceived: string;
    readonly promiseDate?: string;
    private _lines: LineItem[];

    constructor(props: PurchaseOrderProps) {
        super(props.po); // PO number is the identity

        if (!props.po.trim()) {
            throw new Error('PurchaseOrder po cannot be empty');
        }
        if (!props.customer.trim()) {
            throw new Error('PurchaseOrder customer cannot be empty');
        }
        if (!props.lines || props.lines.length === 0) {
            throw new Error('PurchaseOrder must have at least one line item');
        }

        this.po = props.po;
        this.customer = props.customer;
        this.dateReceived = props.dateReceived ?? new Date().toISOString();
        this.promiseDate = props.promiseDate;
        this._lines = props.lines.map((l) => new LineItem(l));
    }

    /**
     * Get all line items (immutable copy).
     */
    get lines(): readonly LineItem[] {
        return this._lines;
    }

    /**
     * Calculate total value of all line items.
     */
    totalValue(): number {
        return this._lines.reduce((sum, line) => sum + line.totalValue(), 0);
    }

    /**
     * Calculate total quantity of pumps to be created.
     */
    totalQuantity(): number {
        return this._lines.reduce((sum, line) => sum + line.quantity, 0);
    }

    /**
     * Expand line items into individual Pump records.
     * Each pump gets a unique ID and serial number.
     */
    expandToPumps(serialStart: number): Pump[] {
        const pumps: Pump[] = [];
        let serialCounter = serialStart;

        for (const line of this._lines) {
            for (let i = 0; i < line.quantity; i++) {
                const pumpProps: Omit<PumpProps, 'stage' | 'last_update'> = {
                    id: nanoid(),
                    serial: serialCounter++,
                    po: this.po,
                    customer: this.customer,
                    model: line.model,
                    priority: line.priority,
                    powder_color: line.color,
                    value: line.valueEach,
                    promiseDate: line.promiseDate ?? this.promiseDate,
                };
                pumps.push(Pump.create(pumpProps));
            }
        }

        return pumps;
    }

    /**
     * Serialize to plain object.
     */
    toProps(): PurchaseOrderProps {
        return {
            po: this.po,
            customer: this.customer,
            dateReceived: this.dateReceived,
            promiseDate: this.promiseDate,
            lines: this._lines.map((l) => l.toProps()),
        };
    }
}
