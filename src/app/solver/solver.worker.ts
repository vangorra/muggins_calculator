import {ALL_OPERATIONS} from "../const";
import {MugginsSolver} from "./solver";
import {groupBy} from "lodash";

export interface SolverWorkerMessage {
  boardMinNumber: number;
  boardMaxNumber: number;
  selectedDieFaces: number[];
  selectedOperators: string[];
}

export interface SolverWorkerResponse {
  [total: number]: string[];
}

addEventListener('message', (message => {
  console.log("On message", message.data);
  const data: SolverWorkerMessage = JSON.parse(message.data);
  const solver = new MugginsSolver(data.boardMinNumber, data.boardMaxNumber);
  const equations = solver
    .getEquations(
      data.selectedDieFaces,
      ALL_OPERATIONS.filter(o => data.selectedOperators.indexOf(o.operator) > -1)
    )
    .map(e => `${e.total()} = ${e.toString()}`)
    .sort()
  ;

  const resp: SolverWorkerResponse = groupBy(equations, e => e.split(/=/)[0].trim());
  // @ts-ignore
  postMessage(JSON.stringify(resp));
}));
