/// <reference lib="webworker" />

// Default type of `self` is `WorkerGlobalScope & typeof globalThis`
// https://github.com/microsoft/TypeScript/issues/14877
import {groupBy} from "lodash";
import {ALL_OPERATIONS} from "../const";
import {MugginsSolver} from "./solver";
import {SolverWorkerResponse} from "../general_types";

declare let self: ServiceWorkerGlobalScope;

self.addEventListener('message', (message => {
  const { data } = message;
  const solver = new MugginsSolver(data.boardMinNumber, data.boardMaxNumber);
  const equations = solver
    .getEquations(
      data.selectedDieFaces,
      ALL_OPERATIONS.filter(o => data.selectedOperators.indexOf(o.operator) > -1)
    )
    .map(e => `${e.total} = ${e.equation}`)
    .sort()
  ;

  const resp: SolverWorkerResponse = groupBy(equations, e => e.split(/=/)[0].trim());
  postMessage(resp);
}));
