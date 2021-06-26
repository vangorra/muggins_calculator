import { MugginsSolver } from "./solver";
import {ALL_OPERATIONS} from "../const";

describe("Solver", () => {
  test("Test", () => {
    const solver = new MugginsSolver(1, 36);
    const equations = solver.getEquations(
      [
        4,
        5,
        6,
      ],
      ALL_OPERATIONS
    );

    expect(equations).toMatchInlineSnapshot(`
Array [
  Object {
    "equation": "((4 + 5) + 6)",
    "total": 15,
  },
  Object {
    "equation": "((4 + 5) - 6)",
    "total": 3,
  },
  Object {
    "equation": "((4 - 5) + 6)",
    "total": 5,
  },
  Object {
    "equation": "((4 x 5) + 6)",
    "total": 26,
  },
  Object {
    "equation": "((4 x 5) - 6)",
    "total": 14,
  },
  Object {
    "equation": "(4 + (5 + 6))",
    "total": 15,
  },
  Object {
    "equation": "(4 + (5 - 6))",
    "total": 3,
  },
  Object {
    "equation": "(4 - (5 - 6))",
    "total": 5,
  },
  Object {
    "equation": "(4 + (5 x 6))",
    "total": 34,
  },
  Object {
    "equation": "((4 + 6) + 5)",
    "total": 15,
  },
  Object {
    "equation": "((4 + 6) - 5)",
    "total": 5,
  },
  Object {
    "equation": "((4 + 6) / 5)",
    "total": 2,
  },
  Object {
    "equation": "((4 + 6) ^ 5)",
    "total": 2,
  },
  Object {
    "equation": "((4 - 6) + 5)",
    "total": 3,
  },
  Object {
    "equation": "((4 x 6) + 5)",
    "total": 29,
  },
  Object {
    "equation": "((4 x 6) - 5)",
    "total": 19,
  },
  Object {
    "equation": "(4 + (6 + 5))",
    "total": 15,
  },
  Object {
    "equation": "(4 + (6 - 5))",
    "total": 5,
  },
  Object {
    "equation": "(4 - (6 - 5))",
    "total": 3,
  },
  Object {
    "equation": "(4 x (6 - 5))",
    "total": 4,
  },
  Object {
    "equation": "(4 / (6 - 5))",
    "total": 4,
  },
  Object {
    "equation": "(4 ^ (6 - 5))",
    "total": 4,
  },
  Object {
    "equation": "(4 + (6 x 5))",
    "total": 34,
  },
  Object {
    "equation": "((5 + 4) + 6)",
    "total": 15,
  },
  Object {
    "equation": "((5 + 4) - 6)",
    "total": 3,
  },
  Object {
    "equation": "((5 - 4) + 6)",
    "total": 7,
  },
  Object {
    "equation": "((5 - 4) x 6)",
    "total": 6,
  },
  Object {
    "equation": "((5 x 4) + 6)",
    "total": 26,
  },
  Object {
    "equation": "((5 x 4) - 6)",
    "total": 14,
  },
  Object {
    "equation": "(5 + (4 + 6))",
    "total": 15,
  },
  Object {
    "equation": "(5 + (4 - 6))",
    "total": 3,
  },
  Object {
    "equation": "(5 - (4 - 6))",
    "total": 7,
  },
  Object {
    "equation": "(5 + (4 x 6))",
    "total": 29,
  },
  Object {
    "equation": "((5 + 6) + 4)",
    "total": 15,
  },
  Object {
    "equation": "((5 + 6) - 4)",
    "total": 7,
  },
  Object {
    "equation": "((5 - 6) + 4)",
    "total": 3,
  },
  Object {
    "equation": "((5 x 6) + 4)",
    "total": 34,
  },
  Object {
    "equation": "((5 x 6) - 4)",
    "total": 26,
  },
  Object {
    "equation": "(5 + (6 + 4))",
    "total": 15,
  },
  Object {
    "equation": "(5 + (6 - 4))",
    "total": 7,
  },
  Object {
    "equation": "(5 - (6 - 4))",
    "total": 3,
  },
  Object {
    "equation": "(5 x (6 - 4))",
    "total": 10,
  },
  Object {
    "equation": "(5 + (6 x 4))",
    "total": 29,
  },
  Object {
    "equation": "((6 + 4) + 5)",
    "total": 15,
  },
  Object {
    "equation": "((6 + 4) - 5)",
    "total": 5,
  },
  Object {
    "equation": "((6 + 4) / 5)",
    "total": 2,
  },
  Object {
    "equation": "((6 + 4) ^ 5)",
    "total": 2,
  },
  Object {
    "equation": "((6 - 4) + 5)",
    "total": 7,
  },
  Object {
    "equation": "((6 - 4) x 5)",
    "total": 10,
  },
  Object {
    "equation": "((6 x 4) + 5)",
    "total": 29,
  },
  Object {
    "equation": "((6 x 4) - 5)",
    "total": 19,
  },
  Object {
    "equation": "(6 + (4 + 5))",
    "total": 15,
  },
  Object {
    "equation": "(6 + (4 - 5))",
    "total": 5,
  },
  Object {
    "equation": "(6 - (4 - 5))",
    "total": 7,
  },
  Object {
    "equation": "(6 + (4 x 5))",
    "total": 26,
  },
  Object {
    "equation": "((6 + 5) + 4)",
    "total": 15,
  },
  Object {
    "equation": "((6 + 5) - 4)",
    "total": 7,
  },
  Object {
    "equation": "((6 - 5) + 4)",
    "total": 5,
  },
  Object {
    "equation": "((6 - 5) x 4)",
    "total": 4,
  },
  Object {
    "equation": "((6 x 5) + 4)",
    "total": 34,
  },
  Object {
    "equation": "((6 x 5) - 4)",
    "total": 26,
  },
  Object {
    "equation": "(6 + (5 + 4))",
    "total": 15,
  },
  Object {
    "equation": "(6 + (5 - 4))",
    "total": 7,
  },
  Object {
    "equation": "(6 - (5 - 4))",
    "total": 5,
  },
  Object {
    "equation": "(6 x (5 - 4))",
    "total": 6,
  },
  Object {
    "equation": "(6 / (5 - 4))",
    "total": 6,
  },
  Object {
    "equation": "(6 ^ (5 - 4))",
    "total": 6,
  },
  Object {
    "equation": "(6 + (5 x 4))",
    "total": 26,
  },
]
`);

    expect(equations).toMatchInlineSnapshot(`
Array [
  Object {
    "equation": "((4 + 5) + 6)",
    "total": 15,
  },
  Object {
    "equation": "((4 + 5) - 6)",
    "total": 3,
  },
  Object {
    "equation": "((4 - 5) + 6)",
    "total": 5,
  },
  Object {
    "equation": "((4 x 5) + 6)",
    "total": 26,
  },
  Object {
    "equation": "((4 x 5) - 6)",
    "total": 14,
  },
  Object {
    "equation": "(4 + (5 + 6))",
    "total": 15,
  },
  Object {
    "equation": "(4 + (5 - 6))",
    "total": 3,
  },
  Object {
    "equation": "(4 - (5 - 6))",
    "total": 5,
  },
  Object {
    "equation": "(4 + (5 x 6))",
    "total": 34,
  },
  Object {
    "equation": "((4 + 6) + 5)",
    "total": 15,
  },
  Object {
    "equation": "((4 + 6) - 5)",
    "total": 5,
  },
  Object {
    "equation": "((4 + 6) / 5)",
    "total": 2,
  },
  Object {
    "equation": "((4 + 6) ^ 5)",
    "total": 2,
  },
  Object {
    "equation": "((4 - 6) + 5)",
    "total": 3,
  },
  Object {
    "equation": "((4 x 6) + 5)",
    "total": 29,
  },
  Object {
    "equation": "((4 x 6) - 5)",
    "total": 19,
  },
  Object {
    "equation": "(4 + (6 + 5))",
    "total": 15,
  },
  Object {
    "equation": "(4 + (6 - 5))",
    "total": 5,
  },
  Object {
    "equation": "(4 - (6 - 5))",
    "total": 3,
  },
  Object {
    "equation": "(4 x (6 - 5))",
    "total": 4,
  },
  Object {
    "equation": "(4 / (6 - 5))",
    "total": 4,
  },
  Object {
    "equation": "(4 ^ (6 - 5))",
    "total": 4,
  },
  Object {
    "equation": "(4 + (6 x 5))",
    "total": 34,
  },
  Object {
    "equation": "((5 + 4) + 6)",
    "total": 15,
  },
  Object {
    "equation": "((5 + 4) - 6)",
    "total": 3,
  },
  Object {
    "equation": "((5 - 4) + 6)",
    "total": 7,
  },
  Object {
    "equation": "((5 - 4) x 6)",
    "total": 6,
  },
  Object {
    "equation": "((5 x 4) + 6)",
    "total": 26,
  },
  Object {
    "equation": "((5 x 4) - 6)",
    "total": 14,
  },
  Object {
    "equation": "(5 + (4 + 6))",
    "total": 15,
  },
  Object {
    "equation": "(5 + (4 - 6))",
    "total": 3,
  },
  Object {
    "equation": "(5 - (4 - 6))",
    "total": 7,
  },
  Object {
    "equation": "(5 + (4 x 6))",
    "total": 29,
  },
  Object {
    "equation": "((5 + 6) + 4)",
    "total": 15,
  },
  Object {
    "equation": "((5 + 6) - 4)",
    "total": 7,
  },
  Object {
    "equation": "((5 - 6) + 4)",
    "total": 3,
  },
  Object {
    "equation": "((5 x 6) + 4)",
    "total": 34,
  },
  Object {
    "equation": "((5 x 6) - 4)",
    "total": 26,
  },
  Object {
    "equation": "(5 + (6 + 4))",
    "total": 15,
  },
  Object {
    "equation": "(5 + (6 - 4))",
    "total": 7,
  },
  Object {
    "equation": "(5 - (6 - 4))",
    "total": 3,
  },
  Object {
    "equation": "(5 x (6 - 4))",
    "total": 10,
  },
  Object {
    "equation": "(5 + (6 x 4))",
    "total": 29,
  },
  Object {
    "equation": "((6 + 4) + 5)",
    "total": 15,
  },
  Object {
    "equation": "((6 + 4) - 5)",
    "total": 5,
  },
  Object {
    "equation": "((6 + 4) / 5)",
    "total": 2,
  },
  Object {
    "equation": "((6 + 4) ^ 5)",
    "total": 2,
  },
  Object {
    "equation": "((6 - 4) + 5)",
    "total": 7,
  },
  Object {
    "equation": "((6 - 4) x 5)",
    "total": 10,
  },
  Object {
    "equation": "((6 x 4) + 5)",
    "total": 29,
  },
  Object {
    "equation": "((6 x 4) - 5)",
    "total": 19,
  },
  Object {
    "equation": "(6 + (4 + 5))",
    "total": 15,
  },
  Object {
    "equation": "(6 + (4 - 5))",
    "total": 5,
  },
  Object {
    "equation": "(6 - (4 - 5))",
    "total": 7,
  },
  Object {
    "equation": "(6 + (4 x 5))",
    "total": 26,
  },
  Object {
    "equation": "((6 + 5) + 4)",
    "total": 15,
  },
  Object {
    "equation": "((6 + 5) - 4)",
    "total": 7,
  },
  Object {
    "equation": "((6 - 5) + 4)",
    "total": 5,
  },
  Object {
    "equation": "((6 - 5) x 4)",
    "total": 4,
  },
  Object {
    "equation": "((6 x 5) + 4)",
    "total": 34,
  },
  Object {
    "equation": "((6 x 5) - 4)",
    "total": 26,
  },
  Object {
    "equation": "(6 + (5 + 4))",
    "total": 15,
  },
  Object {
    "equation": "(6 + (5 - 4))",
    "total": 7,
  },
  Object {
    "equation": "(6 - (5 - 4))",
    "total": 5,
  },
  Object {
    "equation": "(6 x (5 - 4))",
    "total": 6,
  },
  Object {
    "equation": "(6 / (5 - 4))",
    "total": 6,
  },
  Object {
    "equation": "(6 ^ (5 - 4))",
    "total": 6,
  },
  Object {
    "equation": "(6 + (5 x 4))",
    "total": 26,
  },
]
`);
  });
});
