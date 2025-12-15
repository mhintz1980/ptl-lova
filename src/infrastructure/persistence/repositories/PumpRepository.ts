/**
 * PumpRepository - Concrete implementation of IPumpRepository.
 *
 * Uses DataAdapter for persistence and MigrationAdapter for legacy data handling.
 */
import { IPumpRepository } from '../../../domain/production/repository';
import { Pump, PumpProps } from '../../../domain/production/entities/Pump';
import { Stage, STAGES } from '../../../domain/production/value-objects/Stage';
import { DataAdapter } from '../adapters/DataAdapter';
import { migrateLegacyPump, LegacyPump } from '../MigrationAdapter';

const COLLECTION = 'pumps';

export class PumpRepository implements IPumpRepository {
    constructor(private readonly adapter: DataAdapter) { }

    async findById(id: string): Promise<Pump | null> {
        const data = await this.adapter.get<LegacyPump | PumpProps>(COLLECTION, id);
        if (!data) {
            return null;
        }
        return this.toPump(data);
    }

    async findBySerial(serial: number): Promise<Pump | null> {
        const all = await this.adapter.query<LegacyPump | PumpProps>(
            COLLECTION,
            'serial',
            serial
        );
        if (all.length === 0) {
            return null;
        }
        return this.toPump(all[0]);
    }

    async findByStage(stage: Stage): Promise<Pump[]> {
        const all = await this.findAll();
        return all.filter((p) => p.stage === stage);
    }

    async findByPo(po: string): Promise<Pump[]> {
        const all = await this.adapter.query<LegacyPump | PumpProps>(COLLECTION, 'po', po);
        return all.map((data) => this.toPump(data));
    }

    async findByCustomer(customer: string): Promise<Pump[]> {
        const all = await this.adapter.query<LegacyPump | PumpProps>(
            COLLECTION,
            'customer',
            customer
        );
        return all.map((data) => this.toPump(data));
    }

    async findAll(limit?: number): Promise<Pump[]> {
        const all = await this.adapter.getAll<LegacyPump | PumpProps>(COLLECTION);
        const pumps = all.map((data) => this.toPump(data));
        return limit ? pumps.slice(0, limit) : pumps;
    }

    async save(pump: Pump): Promise<void> {
        await this.adapter.set(COLLECTION, pump.id, pump.toProps());
    }

    async saveMany(pumps: Pump[]): Promise<void> {
        const items = pumps.map((p) => ({ id: p.id, data: p.toProps() }));
        await this.adapter.setMany(COLLECTION, items);
    }

    async delete(id: string): Promise<void> {
        await this.adapter.delete(COLLECTION, id);
    }

    async getNextSerial(): Promise<number> {
        const all = await this.findAll();
        if (all.length === 0) {
            return 1000; // Start from 1000
        }
        const maxSerial = Math.max(...all.map((p) => p.serial));
        return maxSerial + 1;
    }

    async countByStage(): Promise<Map<Stage, number>> {
        const counts = new Map<Stage, number>();

        // Initialize all stages to 0
        for (const stage of STAGES) {
            counts.set(stage, 0);
        }

        const all = await this.findAll();
        for (const pump of all) {
            const current = counts.get(pump.stage) ?? 0;
            counts.set(pump.stage, current + 1);
        }

        return counts;
    }

    /**
     * Convert stored data to Pump entity.
     * Handles both legacy and new formats.
     */
    private toPump(data: LegacyPump | PumpProps): Pump {
        // Check if data needs migration (has space in stage name)
        const needsMigration =
            typeof (data as LegacyPump).stage === 'string' &&
            (data as LegacyPump).stage.includes(' ');

        const props = needsMigration
            ? migrateLegacyPump(data as LegacyPump)
            : (data as PumpProps);

        return new Pump(props);
    }
}
