import { describe, it, expect } from 'vitest';
import { PurchaseOrder } from './PurchaseOrder';
import { LineItem } from './LineItem';

describe('LineItem', () => {
    it('should create a valid LineItem', () => {
        const item = new LineItem({
            model: 'DD6-SAFE',
            quantity: 2,
            valueEach: 25000,
        });

        expect(item.model).toBe('DD6-SAFE');
        expect(item.quantity).toBe(2);
        expect(item.priority).toBe('Normal');
    });

    it('should calculate total value', () => {
        const item = new LineItem({
            model: 'DD6-SAFE',
            quantity: 3,
            valueEach: 10000,
        });

        expect(item.totalValue()).toBe(30000);
    });

    it('should throw if quantity is less than 1', () => {
        expect(() => new LineItem({ model: 'DD6-SAFE', quantity: 0 })).toThrow(
            'quantity must be at least 1'
        );
    });

    it('should throw if model is empty', () => {
        expect(() => new LineItem({ model: '', quantity: 1 })).toThrow(
            'model cannot be empty'
        );
    });
});

describe('PurchaseOrder', () => {
    const validProps = {
        po: 'PO2025-0001',
        customer: 'United Rentals',
        lines: [
            { model: 'DD6-SAFE', quantity: 2, valueEach: 25000 },
            { model: 'DD8-SAFE', quantity: 1, valueEach: 35000 },
        ],
    };

    it('should create a valid PurchaseOrder', () => {
        const po = new PurchaseOrder(validProps);

        expect(po.po).toBe('PO2025-0001');
        expect(po.customer).toBe('United Rentals');
        expect(po.lines.length).toBe(2);
    });

    it('should calculate total value', () => {
        const po = new PurchaseOrder(validProps);
        // 2 * 25000 + 1 * 35000 = 85000
        expect(po.totalValue()).toBe(85000);
    });

    it('should calculate total quantity', () => {
        const po = new PurchaseOrder(validProps);
        expect(po.totalQuantity()).toBe(3);
    });

    // Blueprint-required test: 3 lines → expandToPumps returns 3 pumps
    it('should expand to correct number of pumps', () => {
        const po = new PurchaseOrder(validProps);
        const pumps = po.expandToPumps(1000);

        expect(pumps.length).toBe(3); // 2 + 1 from two line items
    });

    it('should assign sequential serial numbers', () => {
        const po = new PurchaseOrder(validProps);
        const pumps = po.expandToPumps(1000);

        expect(pumps[0].serial).toBe(1000);
        expect(pumps[1].serial).toBe(1001);
        expect(pumps[2].serial).toBe(1002);
    });

    it('should create pumps in QUEUE stage', () => {
        const po = new PurchaseOrder(validProps);
        const pumps = po.expandToPumps(1000);

        pumps.forEach((pump) => {
            expect(pump.stage).toBe('QUEUE');
        });
    });

    it('should propagate PO and customer to pumps', () => {
        const po = new PurchaseOrder(validProps);
        const pumps = po.expandToPumps(1000);

        pumps.forEach((pump) => {
            expect(pump.po).toBe('PO2025-0001');
            expect(pump.customer).toBe('United Rentals');
        });
    });

    // Blueprint-required test: empty lines → throws error
    it('should throw if no line items', () => {
        expect(
            () =>
                new PurchaseOrder({
                    po: 'PO2025-0001',
                    customer: 'United Rentals',
                    lines: [],
                })
        ).toThrow('at least one line item');
    });

    it('should throw if po is empty', () => {
        expect(
            () =>
                new PurchaseOrder({
                    ...validProps,
                    po: '',
                })
        ).toThrow('po cannot be empty');
    });

    it('should throw if customer is empty', () => {
        expect(
            () =>
                new PurchaseOrder({
                    ...validProps,
                    customer: '',
                })
        ).toThrow('customer cannot be empty');
    });

    it('should serialize to props', () => {
        const po = new PurchaseOrder(validProps);
        const props = po.toProps();

        expect(props.po).toBe('PO2025-0001');
        expect(props.lines.length).toBe(2);
    });
});
