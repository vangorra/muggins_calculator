import { groupBy } from 'lodash';
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

export type SolverWorkerResponseDataArray = {
  total: string;
  results: CalculateResult[];
}[];

export interface SolverWorkerResponse {
  readonly data: SolverWorkerResponseDataArray;
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

  const data = Object.entries(
    groupBy(solver.calculateSolutions(), (item) => item.total)
  ).map(([total, results]) => ({
    total,
    results,
  }));

  return { data };
}
