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
      includes(solverWorkerMessage.operators, o.id)
    ),
  });

  const resultsWithEquations = solver.calculateSolutions().map((solution) => ({
    ...solution,
    equation: `${solution.total} = ${solution.equation}`,
  }));

  const data = Object.entries(
    groupBy(resultsWithEquations, (item) => item.total)
  ).map(([total, results]) => ({
    total,
    results,
  }));

  return { data };
}
