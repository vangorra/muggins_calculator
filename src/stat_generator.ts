import {cartesianProduct} from 'cartesian-product-multiple-arrays';
import {groupBy} from "lodash";
import {MugginsSolver} from "./app/solver/solver";
import {ALL_OPERATIONS} from "./app/const";

const solver = new MugginsSolver(1, 36);
const aa = cartesianProduct(
  [1, 2, 3, 4, 5, 6],
  [1, 2, 3, 4, 5, 6],
  [1, 2, 3, 4, 5, 6],
);

const bb = aa
  .map(faces => solver.getEquations(
    faces,
    ALL_OPERATIONS
  ))
  .flatMap(a => a)

const data = Object.fromEntries(
  Object.entries(groupBy(bb, i => i.total))
    .map(([total, equationArr]) => [total, equationArr.length])
)

/* eslint-disable no-console */
console.log("data", data);
