/**
 * SchedulePumpCommand - Command to assign a scheduled production window to a pump.
 */
export interface SchedulePumpCommand {
    readonly type: 'SchedulePump';
    readonly pumpId: string;
    readonly scheduledStart: string; // ISO string
    readonly scheduledEnd: string; // ISO string
}

export function schedulePumpCommand(
    pumpId: string,
    scheduledStart: string,
    scheduledEnd: string
): SchedulePumpCommand {
    return {
        type: 'SchedulePump',
        pumpId,
        scheduledStart,
        scheduledEnd,
    };
}

/**
 * ClearScheduleCommand - Command to remove scheduled dates from a pump.
 */
export interface ClearScheduleCommand {
    readonly type: 'ClearSchedule';
    readonly pumpId: string;
}

export function clearScheduleCommand(pumpId: string): ClearScheduleCommand {
    return {
        type: 'ClearSchedule',
        pumpId,
    };
}
