/**
 * OrderRepository - Concrete implementation of IOrderRepository.
 */
import { IOrderRepository } from '../../../domain/sales/repository';
import { PurchaseOrder, PurchaseOrderProps } from '../../../domain/sales/entities/PurchaseOrder';
import { DataAdapter } from '../adapters/DataAdapter';

const COLLECTION = 'orders';

export class OrderRepository implements IOrderRepository {
    constructor(private readonly adapter: DataAdapter) { }

    async findByPo(po: string): Promise<PurchaseOrder | null> {
        const data = await this.adapter.get<PurchaseOrderProps>(COLLECTION, po);
        if (!data) {
            return null;
        }
        return new PurchaseOrder(data);
    }

    async findByCustomer(customer: string): Promise<PurchaseOrder[]> {
        const all = await this.adapter.query<PurchaseOrderProps>(
            COLLECTION,
            'customer',
            customer
        );
        return all.map((data) => new PurchaseOrder(data));
    }

    async findAll(limit?: number): Promise<PurchaseOrder[]> {
        const all = await this.adapter.getAll<PurchaseOrderProps>(COLLECTION);
        const orders = all.map((data) => new PurchaseOrder(data));
        return limit ? orders.slice(0, limit) : orders;
    }

    async save(order: PurchaseOrder): Promise<void> {
        await this.adapter.set(COLLECTION, order.po, order.toProps());
    }

    async delete(po: string): Promise<void> {
        await this.adapter.delete(COLLECTION, po);
    }

    async exists(po: string): Promise<boolean> {
        return this.adapter.exists(COLLECTION, po);
    }
}
