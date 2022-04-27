import {
  CalculateResult,
  MugginsSolver,
  MugginsSolverConfig,
  OperationEnum,
  OPERATIONS_MAP,
} from './solver';

export interface SolverWorkerMessage
  extends Omit<MugginsSolverConfig, 'operations'> {
  readonly operations: OperationEnum[];
}

export interface SolverWorkerResponse {
  readonly data: CalculateResult[];
}

/* eslint-disable import/prefer-default-export */
export function runSolverWorkerMain(
  solverWorkerMessage: SolverWorkerMessage
): SolverWorkerResponse {
  const solver = new MugginsSolver({
    ...solverWorkerMessage,
    operations: solverWorkerMessage.operations.map(
      (operation) => OPERATIONS_MAP[operation]
    ),
  });

  return {
    data: solver.calculateSolutions(),
  };
}
