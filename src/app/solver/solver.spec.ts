import {MugginsSolver} from "./solver";
import {ALL_OPERATIONS} from "../const";

describe("Solver", () => {
  it("Test", () => {
    const solver = new MugginsSolver(1, 36);
    const equations = solver.getEquations(
      [
        4,
        5,
        6,
      ],
      ALL_OPERATIONS
    );

    expect(equations).toEqual(JSON.parse(`
      [
        {
          "total": 15,
          "equation": "((4 + 5) + 6)"
        },
        {
          "total": 3,
          "equation": "((4 + 5) - 6)"
        },
        {
          "total": 5,
          "equation": "((4 - 5) + 6)"
        },
        {
          "total": 1,
          "equation": "((4 - 5) ^ 6)"
        },
        {
          "total": 26,
          "equation": "((4 x 5) + 6)"
        },
        {
          "total": 14,
          "equation": "((4 x 5) - 6)"
        },
        {
          "total": 15,
          "equation": "(4 + (5 + 6))"
        },
        {
          "total": 3,
          "equation": "(4 + (5 - 6))"
        },
        {
          "total": 5,
          "equation": "(4 - (5 - 6))"
        },
        {
          "total": 34,
          "equation": "(4 + (5 x 6))"
        },
        {
          "total": 15,
          "equation": "((4 + 6) + 5)"
        },
        {
          "total": 5,
          "equation": "((4 + 6) - 5)"
        },
        {
          "total": 2,
          "equation": "((4 + 6) / 5)"
        },
        {
          "total": 3,
          "equation": "((4 - 6) + 5)"
        },
        {
          "total": 29,
          "equation": "((4 x 6) + 5)"
        },
        {
          "total": 19,
          "equation": "((4 x 6) - 5)"
        },
        {
          "total": 15,
          "equation": "(4 + (6 + 5))"
        },
        {
          "total": 5,
          "equation": "(4 + (6 - 5))"
        },
        {
          "total": 3,
          "equation": "(4 - (6 - 5))"
        },
        {
          "total": 4,
          "equation": "(4 x (6 - 5))"
        },
        {
          "total": 4,
          "equation": "(4 / (6 - 5))"
        },
        {
          "total": 4,
          "equation": "(4 ^ (6 - 5))"
        },
        {
          "total": 34,
          "equation": "(4 + (6 x 5))"
        },
        {
          "total": 15,
          "equation": "((5 + 4) + 6)"
        },
        {
          "total": 3,
          "equation": "((5 + 4) - 6)"
        },
        {
          "total": 7,
          "equation": "((5 - 4) + 6)"
        },
        {
          "total": 6,
          "equation": "((5 - 4) x 6)"
        },
        {
          "total": 1,
          "equation": "((5 - 4) ^ 6)"
        },
        {
          "total": 26,
          "equation": "((5 x 4) + 6)"
        },
        {
          "total": 14,
          "equation": "((5 x 4) - 6)"
        },
        {
          "total": 15,
          "equation": "(5 + (4 + 6))"
        },
        {
          "total": 3,
          "equation": "(5 + (4 - 6))"
        },
        {
          "total": 7,
          "equation": "(5 - (4 - 6))"
        },
        {
          "total": 29,
          "equation": "(5 + (4 x 6))"
        },
        {
          "total": 15,
          "equation": "((5 + 6) + 4)"
        },
        {
          "total": 7,
          "equation": "((5 + 6) - 4)"
        },
        {
          "total": 3,
          "equation": "((5 - 6) + 4)"
        },
        {
          "total": 1,
          "equation": "((5 - 6) ^ 4)"
        },
        {
          "total": 34,
          "equation": "((5 x 6) + 4)"
        },
        {
          "total": 26,
          "equation": "((5 x 6) - 4)"
        },
        {
          "total": 15,
          "equation": "(5 + (6 + 4))"
        },
        {
          "total": 7,
          "equation": "(5 + (6 - 4))"
        },
        {
          "total": 3,
          "equation": "(5 - (6 - 4))"
        },
        {
          "total": 10,
          "equation": "(5 x (6 - 4))"
        },
        {
          "total": 25,
          "equation": "(5 ^ (6 - 4))"
        },
        {
          "total": 29,
          "equation": "(5 + (6 x 4))"
        },
        {
          "total": 15,
          "equation": "((6 + 4) + 5)"
        },
        {
          "total": 5,
          "equation": "((6 + 4) - 5)"
        },
        {
          "total": 2,
          "equation": "((6 + 4) / 5)"
        },
        {
          "total": 7,
          "equation": "((6 - 4) + 5)"
        },
        {
          "total": 10,
          "equation": "((6 - 4) x 5)"
        },
        {
          "total": 32,
          "equation": "((6 - 4) ^ 5)"
        },
        {
          "total": 29,
          "equation": "((6 x 4) + 5)"
        },
        {
          "total": 19,
          "equation": "((6 x 4) - 5)"
        },
        {
          "total": 15,
          "equation": "(6 + (4 + 5))"
        },
        {
          "total": 5,
          "equation": "(6 + (4 - 5))"
        },
        {
          "total": 7,
          "equation": "(6 - (4 - 5))"
        },
        {
          "total": 26,
          "equation": "(6 + (4 x 5))"
        },
        {
          "total": 15,
          "equation": "((6 + 5) + 4)"
        },
        {
          "total": 7,
          "equation": "((6 + 5) - 4)"
        },
        {
          "total": 5,
          "equation": "((6 - 5) + 4)"
        },
        {
          "total": 4,
          "equation": "((6 - 5) x 4)"
        },
        {
          "total": 1,
          "equation": "((6 - 5) ^ 4)"
        },
        {
          "total": 34,
          "equation": "((6 x 5) + 4)"
        },
        {
          "total": 26,
          "equation": "((6 x 5) - 4)"
        },
        {
          "total": 15,
          "equation": "(6 + (5 + 4))"
        },
        {
          "total": 7,
          "equation": "(6 + (5 - 4))"
        },
        {
          "total": 5,
          "equation": "(6 - (5 - 4))"
        },
        {
          "total": 6,
          "equation": "(6 x (5 - 4))"
        },
        {
          "total": 6,
          "equation": "(6 / (5 - 4))"
        },
        {
          "total": 6,
          "equation": "(6 ^ (5 - 4))"
        },
        {
          "total": 26,
          "equation": "(6 + (5 x 4))"
        }
      ]
    `));
  });
});
