/**
 * MovePumpStageCommand - Command to transition a pump to a new stage.
 */
import { Stage } from '../../domain/production/value-objects/Stage';

export interface MovePumpStageCommand {
    readonly type: 'MovePumpStage';
    readonly pumpId: string;
    readonly toStage: Stage;
}

export function movePumpStageCommand(pumpId: string, toStage: Stage): MovePumpStageCommand {
    return {
        type: 'MovePumpStage',
        pumpId,
        toStage,
    };
}
