import { describe, it, expect, beforeEach } from 'vitest';
import { PumpRepository } from './PumpRepository';
import { InMemoryAdapter } from '../adapters/InMemoryAdapter';
import { Pump } from '../../../domain/production/entities/Pump';

describe('PumpRepository', () => {
    let adapter: InMemoryAdapter;
    let repo: PumpRepository;

    beforeEach(() => {
        adapter = new InMemoryAdapter();
        repo = new PumpRepository(adapter);
    });

    describe('save and find', () => {
        it('should save and retrieve a pump by id', async () => {
            const pump = Pump.create({
                id: 'pump-001',
                serial: 1234,
                po: 'PO2025-0001',
                customer: 'United Rentals',
                model: 'DD6-SAFE',
                priority: 'Normal',
                value: 25000,
            });

            await repo.save(pump);
            const found = await repo.findById('pump-001');

            expect(found).not.toBeNull();
            expect(found?.serial).toBe(1234);
            expect(found?.stage).toBe('QUEUE');
        });

        it('should return null for non-existent pump', async () => {
            const found = await repo.findById('nonexistent');
            expect(found).toBeNull();
        });
    });

    describe('findBySerial', () => {
        it('should find pump by serial number', async () => {
            const pump = Pump.create({
                id: 'pump-001',
                serial: 1234,
                po: 'PO2025-0001',
                customer: 'United Rentals',
                model: 'DD6-SAFE',
                priority: 'Normal',
                value: 25000,
            });

            await repo.save(pump);
            const found = await repo.findBySerial(1234);

            expect(found).not.toBeNull();
            expect(found?.id).toBe('pump-001');
        });
    });

    describe('findByStage', () => {
        it('should find pumps by stage', async () => {
            const pump1 = Pump.create({
                id: 'pump-001',
                serial: 1001,
                po: 'PO2025-0001',
                customer: 'United Rentals',
                model: 'DD6-SAFE',
                priority: 'Normal',
                value: 25000,
            });

            const pump2 = new Pump({
                id: 'pump-002',
                serial: 1002,
                po: 'PO2025-0001',
                customer: 'United Rentals',
                model: 'DD6-SAFE',
                stage: 'FABRICATION',
                priority: 'Normal',
                last_update: new Date().toISOString(),
                value: 25000,
            });

            await repo.saveMany([pump1, pump2]);

            const inQueue = await repo.findByStage('QUEUE');
            const inFab = await repo.findByStage('FABRICATION');

            expect(inQueue.length).toBe(1);
            expect(inFab.length).toBe(1);
            expect(inQueue[0].id).toBe('pump-001');
            expect(inFab[0].id).toBe('pump-002');
        });
    });

    describe('saveMany', () => {
        it('should save multiple pumps', async () => {
            const pumps = [
                Pump.create({
                    id: 'pump-001',
                    serial: 1001,
                    po: 'PO2025-0001',
                    customer: 'United Rentals',
                    model: 'DD6-SAFE',
                    priority: 'Normal',
                    value: 25000,
                }),
                Pump.create({
                    id: 'pump-002',
                    serial: 1002,
                    po: 'PO2025-0001',
                    customer: 'United Rentals',
                    model: 'DD8-SAFE',
                    priority: 'High',
                    value: 35000,
                }),
            ];

            await repo.saveMany(pumps);
            const all = await repo.findAll();

            expect(all.length).toBe(2);
        });
    });

    describe('getNextSerial', () => {
        it('should return 1000 when no pumps exist', async () => {
            const next = await repo.getNextSerial();
            expect(next).toBe(1000);
        });

        it('should return max + 1', async () => {
            await repo.save(
                Pump.create({
                    id: 'pump-001',
                    serial: 1234,
                    po: 'PO2025-0001',
                    customer: 'United Rentals',
                    model: 'DD6-SAFE',
                    priority: 'Normal',
                    value: 25000,
                })
            );

            const next = await repo.getNextSerial();
            expect(next).toBe(1235);
        });
    });

    describe('countByStage', () => {
        it('should count pumps by stage', async () => {
            const pump1 = Pump.create({
                id: 'pump-001',
                serial: 1001,
                po: 'PO2025-0001',
                customer: 'United Rentals',
                model: 'DD6-SAFE',
                priority: 'Normal',
                value: 25000,
            });

            const pump2 = new Pump({
                id: 'pump-002',
                serial: 1002,
                po: 'PO2025-0001',
                customer: 'United Rentals',
                model: 'DD6-SAFE',
                stage: 'FABRICATION',
                priority: 'Normal',
                last_update: new Date().toISOString(),
                value: 25000,
            });

            await repo.saveMany([pump1, pump2]);

            const counts = await repo.countByStage();

            expect(counts.get('QUEUE')).toBe(1);
            expect(counts.get('FABRICATION')).toBe(1);
            expect(counts.get('CLOSED')).toBe(0);
        });
    });

    describe('delete', () => {
        it('should remove a pump', async () => {
            const pump = Pump.create({
                id: 'pump-001',
                serial: 1234,
                po: 'PO2025-0001',
                customer: 'United Rentals',
                model: 'DD6-SAFE',
                priority: 'Normal',
                value: 25000,
            });

            await repo.save(pump);
            await repo.delete('pump-001');

            const found = await repo.findById('pump-001');
            expect(found).toBeNull();
        });
    });

    describe('legacy data migration', () => {
        it('should handle POWDER COAT (with space) from legacy data', async () => {
            // Simulate legacy data with space in stage name
            await adapter.set('pumps', 'legacy-pump', {
                id: 'legacy-pump',
                serial: 5678,
                po: 'PO-LEGACY',
                customer: 'Old Customer',
                model: 'DD6-SAFE',
                stage: 'POWDER COAT', // Legacy format with space
                priority: 'Normal',
                last_update: new Date().toISOString(),
                value: 20000,
            });

            const pump = await repo.findById('legacy-pump');

            expect(pump).not.toBeNull();
            expect(pump?.stage).toBe('POWDER_COAT'); // Normalized with underscore
        });
    });
});
