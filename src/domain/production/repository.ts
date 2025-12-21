/**
 * IPumpRepository - Repository interface for Pump aggregate.
 *
 * Domain layer defines the interface (port).
 * Infrastructure layer provides implementations (adapters).
 */
import { Pump } from './entities/Pump';
import { Stage } from './value-objects/Stage';

export interface IPumpRepository {
    /**
     * Find a pump by its unique ID.
     */
    findById(id: string): Promise<Pump | null>;

    /**
     * Find a pump by its serial number.
     */
    findBySerial(serial: number): Promise<Pump | null>;

    /**
     * Find all pumps in a specific stage.
     */
    findByStage(stage: Stage): Promise<Pump[]>;

    /**
     * Find all pumps for a given purchase order.
     */
    findByPo(po: string): Promise<Pump[]>;

    /**
     * Find all pumps for a given customer.
     */
    findByCustomer(customer: string): Promise<Pump[]>;

    /**
     * Get all pumps (with optional limit).
     */
    findAll(limit?: number): Promise<Pump[]>;

    /**
     * Save a pump (insert or update).
     */
    save(pump: Pump): Promise<void>;

    /**
     * Save multiple pumps in a batch.
     */
    saveMany(pumps: Pump[]): Promise<void>;

    /**
     * Delete a pump by ID.
     */
    delete(id: string): Promise<void>;

    /**
     * Get the next available serial number.
     */
    getNextSerial(): Promise<number>;

    /**
     * Count pumps by stage (for WIP calculations).
     */
    countByStage(): Promise<Map<Stage, number>>;
}
