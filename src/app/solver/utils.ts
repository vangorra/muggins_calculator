import { groupBy } from 'lodash';
import { SolverWorkerMessage, SolverWorkerResponse } from '../general_types';
import { MugginsSolver } from './solver';
import { OPERATIONS_ARRAY } from '../const';

/* eslint-disable import/prefer-default-export */
export const runSolverWorkerMain = (data: SolverWorkerMessage) => {
  const solver = new MugginsSolver(data.boardMinNumber, data.boardMaxNumber);
  const equations = solver
    .getEquations(
      data.diceFaces,
      OPERATIONS_ARRAY.filter((o) => data.operators.indexOf(o.id) > -1)
    )
    .map((e) => `${e.total} = ${e.equation}`)
    .sort();
  const resp: SolverWorkerResponse = groupBy(equations, (e) =>
    e.split(/=/)[0].trim()
  );
  return resp;
};
