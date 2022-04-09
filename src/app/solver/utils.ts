import {groupBy, includes} from 'lodash';
import { SolverWorkerMessage, SolverWorkerResponse } from '../general_types';
import {MugginsSolver, OPERATIONS} from './solver';

/* eslint-disable import/prefer-default-export */
export function runSolverWorkerMain(data: SolverWorkerMessage): SolverWorkerResponse {
  const solver = new MugginsSolver({
    minTotal: data.boardMinNumber,
    maxTotal: data.boardMaxNumber,
    faces: data.diceFaces,
    operations: OPERATIONS.filter((o) => includes(data.operators, o.id))
  });

  const resultsWithEquations = solver.calculateSolutions()
    .map(solution => ({
      ...solution,
      equation: `${solution.total} = ${solution.equation}`,
    }))
    .sort((a, b) => {
      if (a.equation < b.equation) {
        return -1;
      }

      if (a.equation > b.equation) {
        return 1;
      }

      return 0;
    });

  return groupBy(resultsWithEquations, item => item.total);
}
