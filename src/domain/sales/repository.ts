/**
 * IOrderRepository - Repository interface for PurchaseOrder aggregate.
 */
import { PurchaseOrder } from './entities/PurchaseOrder';

export interface IOrderRepository {
    /**
     * Find an order by PO number.
     */
    findByPo(po: string): Promise<PurchaseOrder | null>;

    /**
     * Find all orders for a customer.
     */
    findByCustomer(customer: string): Promise<PurchaseOrder[]>;

    /**
     * Get all orders (with optional limit).
     */
    findAll(limit?: number): Promise<PurchaseOrder[]>;

    /**
     * Save an order (insert or update).
     */
    save(order: PurchaseOrder): Promise<void>;

    /**
     * Delete an order by PO number.
     */
    delete(po: string): Promise<void>;

    /**
     * Check if a PO number already exists.
     */
    exists(po: string): Promise<boolean>;
}
