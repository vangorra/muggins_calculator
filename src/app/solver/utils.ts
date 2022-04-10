import { groupBy, includes } from 'lodash';
import { SolverWorkerMessage, SolverWorkerResponse } from '../general_types';
import { MugginsSolver, OPERATIONS } from './solver';

/* eslint-disable import/prefer-default-export */
export function runSolverWorkerMain(
  solverWorkerMessage: SolverWorkerMessage
): SolverWorkerResponse {
  const solver = new MugginsSolver({
    minTotal: solverWorkerMessage.boardMinNumber,
    maxTotal: solverWorkerMessage.boardMaxNumber,
    faces: solverWorkerMessage.diceFaces,
    operations: OPERATIONS.filter((o) =>
      includes(solverWorkerMessage.operations, o.id)
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
