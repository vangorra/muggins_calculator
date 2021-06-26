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

    const strs = equations
      .map(e => e.total() +" = "+ e.toString())
      .sort();
    expect(strs).toMatchInlineSnapshot(`
Array [
  "10 = ((6 - 4) x 5)",
  "10 = (5 x (6 - 4))",
  "14 = ((4 x 5) - 6)",
  "14 = ((5 x 4) - 6)",
  "15 = ((4 + 5) + 6)",
  "15 = ((4 + 6) + 5)",
  "15 = ((5 + 4) + 6)",
  "15 = ((5 + 6) + 4)",
  "15 = ((6 + 4) + 5)",
  "15 = ((6 + 5) + 4)",
  "15 = (4 + (5 + 6))",
  "15 = (4 + (6 + 5))",
  "15 = (5 + (4 + 6))",
  "15 = (5 + (6 + 4))",
  "15 = (6 + (4 + 5))",
  "15 = (6 + (5 + 4))",
  "19 = ((4 x 6) - 5)",
  "19 = ((6 x 4) - 5)",
  "2 = ((4 + 6) / 5)",
  "2 = ((4 + 6) ^ 5)",
  "2 = ((6 + 4) / 5)",
  "2 = ((6 + 4) ^ 5)",
  "26 = ((4 x 5) + 6)",
  "26 = ((5 x 4) + 6)",
  "26 = ((5 x 6) - 4)",
  "26 = ((6 x 5) - 4)",
  "26 = (6 + (4 x 5))",
  "26 = (6 + (5 x 4))",
  "29 = ((4 x 6) + 5)",
  "29 = ((6 x 4) + 5)",
  "29 = (5 + (4 x 6))",
  "29 = (5 + (6 x 4))",
  "3 = ((4 + 5) - 6)",
  "3 = ((4 - 6) + 5)",
  "3 = ((5 + 4) - 6)",
  "3 = ((5 - 6) + 4)",
  "3 = (4 + (5 - 6))",
  "3 = (4 - (6 - 5))",
  "3 = (5 + (4 - 6))",
  "3 = (5 - (6 - 4))",
  "34 = ((5 x 6) + 4)",
  "34 = ((6 x 5) + 4)",
  "34 = (4 + (5 x 6))",
  "34 = (4 + (6 x 5))",
  "4 = ((6 - 5) x 4)",
  "4 = (4 / (6 - 5))",
  "4 = (4 ^ (6 - 5))",
  "4 = (4 x (6 - 5))",
  "5 = ((4 + 6) - 5)",
  "5 = ((4 - 5) + 6)",
  "5 = ((6 + 4) - 5)",
  "5 = ((6 - 5) + 4)",
  "5 = (4 + (6 - 5))",
  "5 = (4 - (5 - 6))",
  "5 = (6 + (4 - 5))",
  "5 = (6 - (5 - 4))",
  "6 = ((5 - 4) x 6)",
  "6 = (6 / (5 - 4))",
  "6 = (6 ^ (5 - 4))",
  "6 = (6 x (5 - 4))",
  "7 = ((5 + 6) - 4)",
  "7 = ((5 - 4) + 6)",
  "7 = ((6 + 5) - 4)",
  "7 = ((6 - 4) + 5)",
  "7 = (5 + (6 - 4))",
  "7 = (5 - (4 - 6))",
  "7 = (6 + (5 - 4))",
  "7 = (6 - (4 - 5))",
]
`);

    expect(equations).toMatchInlineSnapshot(`
Array [
  Equation {
    "num1": Equation {
      "num1": EquationNumber {
        "num": 4,
        "stringCache": "4",
        "totalCache": 4,
      },
      "num2": EquationNumber {
        "num": 5,
        "stringCache": "5",
        "totalCache": 5,
      },
      "operation": Object {
        "name": "Plus",
        "operationFunction": [Function],
        "operator": "+",
      },
      "stringCache": "(4 + 5)",
      "totalCache": 9,
    },
    "num2": EquationNumber {
      "num": 6,
      "stringCache": "6",
      "totalCache": 6,
    },
    "operation": Object {
      "name": "Plus",
      "operationFunction": [Function],
      "operator": "+",
    },
    "stringCache": "((4 + 5) + 6)",
    "totalCache": 15,
  },
  Equation {
    "num1": Equation {
      "num1": EquationNumber {
        "num": 4,
        "stringCache": "4",
        "totalCache": 4,
      },
      "num2": EquationNumber {
        "num": 5,
        "stringCache": "5",
        "totalCache": 5,
      },
      "operation": Object {
        "name": "Plus",
        "operationFunction": [Function],
        "operator": "+",
      },
      "stringCache": "(4 + 5)",
      "totalCache": 9,
    },
    "num2": EquationNumber {
      "num": 6,
      "stringCache": "6",
      "totalCache": 6,
    },
    "operation": Object {
      "name": "Minus",
      "operationFunction": [Function],
      "operator": "-",
    },
    "stringCache": "((4 + 5) - 6)",
    "totalCache": 3,
  },
  Equation {
    "num1": Equation {
      "num1": EquationNumber {
        "num": 4,
        "stringCache": "4",
        "totalCache": 4,
      },
      "num2": EquationNumber {
        "num": 5,
        "stringCache": "5",
        "totalCache": 5,
      },
      "operation": Object {
        "name": "Minus",
        "operationFunction": [Function],
        "operator": "-",
      },
      "stringCache": "(4 - 5)",
      "totalCache": -1,
    },
    "num2": EquationNumber {
      "num": 6,
      "stringCache": "6",
      "totalCache": 6,
    },
    "operation": Object {
      "name": "Plus",
      "operationFunction": [Function],
      "operator": "+",
    },
    "stringCache": "((4 - 5) + 6)",
    "totalCache": 5,
  },
  Equation {
    "num1": Equation {
      "num1": EquationNumber {
        "num": 4,
        "stringCache": "4",
        "totalCache": 4,
      },
      "num2": EquationNumber {
        "num": 5,
        "stringCache": "5",
        "totalCache": 5,
      },
      "operation": Object {
        "name": "Multiply",
        "operationFunction": [Function],
        "operator": "x",
      },
      "stringCache": "(4 x 5)",
      "totalCache": 20,
    },
    "num2": EquationNumber {
      "num": 6,
      "stringCache": "6",
      "totalCache": 6,
    },
    "operation": Object {
      "name": "Plus",
      "operationFunction": [Function],
      "operator": "+",
    },
    "stringCache": "((4 x 5) + 6)",
    "totalCache": 26,
  },
  Equation {
    "num1": Equation {
      "num1": EquationNumber {
        "num": 4,
        "stringCache": "4",
        "totalCache": 4,
      },
      "num2": EquationNumber {
        "num": 5,
        "stringCache": "5",
        "totalCache": 5,
      },
      "operation": Object {
        "name": "Multiply",
        "operationFunction": [Function],
        "operator": "x",
      },
      "stringCache": "(4 x 5)",
      "totalCache": 20,
    },
    "num2": EquationNumber {
      "num": 6,
      "stringCache": "6",
      "totalCache": 6,
    },
    "operation": Object {
      "name": "Minus",
      "operationFunction": [Function],
      "operator": "-",
    },
    "stringCache": "((4 x 5) - 6)",
    "totalCache": 14,
  },
  Equation {
    "num1": EquationNumber {
      "num": 4,
      "stringCache": "4",
      "totalCache": 4,
    },
    "num2": Equation {
      "num1": EquationNumber {
        "num": 5,
        "stringCache": "5",
        "totalCache": 5,
      },
      "num2": EquationNumber {
        "num": 6,
        "stringCache": "6",
        "totalCache": 6,
      },
      "operation": Object {
        "name": "Plus",
        "operationFunction": [Function],
        "operator": "+",
      },
      "stringCache": "(5 + 6)",
      "totalCache": 11,
    },
    "operation": Object {
      "name": "Plus",
      "operationFunction": [Function],
      "operator": "+",
    },
    "stringCache": "(4 + (5 + 6))",
    "totalCache": 15,
  },
  Equation {
    "num1": EquationNumber {
      "num": 4,
      "stringCache": "4",
      "totalCache": 4,
    },
    "num2": Equation {
      "num1": EquationNumber {
        "num": 5,
        "stringCache": "5",
        "totalCache": 5,
      },
      "num2": EquationNumber {
        "num": 6,
        "stringCache": "6",
        "totalCache": 6,
      },
      "operation": Object {
        "name": "Minus",
        "operationFunction": [Function],
        "operator": "-",
      },
      "stringCache": "(5 - 6)",
      "totalCache": -1,
    },
    "operation": Object {
      "name": "Plus",
      "operationFunction": [Function],
      "operator": "+",
    },
    "stringCache": "(4 + (5 - 6))",
    "totalCache": 3,
  },
  Equation {
    "num1": EquationNumber {
      "num": 4,
      "stringCache": "4",
      "totalCache": 4,
    },
    "num2": Equation {
      "num1": EquationNumber {
        "num": 5,
        "stringCache": "5",
        "totalCache": 5,
      },
      "num2": EquationNumber {
        "num": 6,
        "stringCache": "6",
        "totalCache": 6,
      },
      "operation": Object {
        "name": "Minus",
        "operationFunction": [Function],
        "operator": "-",
      },
      "stringCache": "(5 - 6)",
      "totalCache": -1,
    },
    "operation": Object {
      "name": "Minus",
      "operationFunction": [Function],
      "operator": "-",
    },
    "stringCache": "(4 - (5 - 6))",
    "totalCache": 5,
  },
  Equation {
    "num1": EquationNumber {
      "num": 4,
      "stringCache": "4",
      "totalCache": 4,
    },
    "num2": Equation {
      "num1": EquationNumber {
        "num": 5,
        "stringCache": "5",
        "totalCache": 5,
      },
      "num2": EquationNumber {
        "num": 6,
        "stringCache": "6",
        "totalCache": 6,
      },
      "operation": Object {
        "name": "Multiply",
        "operationFunction": [Function],
        "operator": "x",
      },
      "stringCache": "(5 x 6)",
      "totalCache": 30,
    },
    "operation": Object {
      "name": "Plus",
      "operationFunction": [Function],
      "operator": "+",
    },
    "stringCache": "(4 + (5 x 6))",
    "totalCache": 34,
  },
  Equation {
    "num1": Equation {
      "num1": EquationNumber {
        "num": 4,
        "stringCache": "4",
        "totalCache": 4,
      },
      "num2": EquationNumber {
        "num": 6,
        "stringCache": "6",
        "totalCache": 6,
      },
      "operation": Object {
        "name": "Plus",
        "operationFunction": [Function],
        "operator": "+",
      },
      "stringCache": "(4 + 6)",
      "totalCache": 10,
    },
    "num2": EquationNumber {
      "num": 5,
      "stringCache": "5",
      "totalCache": 5,
    },
    "operation": Object {
      "name": "Plus",
      "operationFunction": [Function],
      "operator": "+",
    },
    "stringCache": "((4 + 6) + 5)",
    "totalCache": 15,
  },
  Equation {
    "num1": Equation {
      "num1": EquationNumber {
        "num": 4,
        "stringCache": "4",
        "totalCache": 4,
      },
      "num2": EquationNumber {
        "num": 6,
        "stringCache": "6",
        "totalCache": 6,
      },
      "operation": Object {
        "name": "Plus",
        "operationFunction": [Function],
        "operator": "+",
      },
      "stringCache": "(4 + 6)",
      "totalCache": 10,
    },
    "num2": EquationNumber {
      "num": 5,
      "stringCache": "5",
      "totalCache": 5,
    },
    "operation": Object {
      "name": "Minus",
      "operationFunction": [Function],
      "operator": "-",
    },
    "stringCache": "((4 + 6) - 5)",
    "totalCache": 5,
  },
  Equation {
    "num1": Equation {
      "num1": EquationNumber {
        "num": 4,
        "stringCache": "4",
        "totalCache": 4,
      },
      "num2": EquationNumber {
        "num": 6,
        "stringCache": "6",
        "totalCache": 6,
      },
      "operation": Object {
        "name": "Plus",
        "operationFunction": [Function],
        "operator": "+",
      },
      "stringCache": "(4 + 6)",
      "totalCache": 10,
    },
    "num2": EquationNumber {
      "num": 5,
      "stringCache": "5",
      "totalCache": 5,
    },
    "operation": Object {
      "name": "Divide",
      "operationFunction": [Function],
      "operator": "/",
    },
    "stringCache": "((4 + 6) / 5)",
    "totalCache": 2,
  },
  Equation {
    "num1": Equation {
      "num1": EquationNumber {
        "num": 4,
        "stringCache": "4",
        "totalCache": 4,
      },
      "num2": EquationNumber {
        "num": 6,
        "stringCache": "6",
        "totalCache": 6,
      },
      "operation": Object {
        "name": "Plus",
        "operationFunction": [Function],
        "operator": "+",
      },
      "stringCache": "(4 + 6)",
      "totalCache": 10,
    },
    "num2": EquationNumber {
      "num": 5,
      "stringCache": "5",
      "totalCache": 5,
    },
    "operation": Object {
      "name": "Power",
      "operationFunction": [Function],
      "operator": "^",
    },
    "stringCache": "((4 + 6) ^ 5)",
    "totalCache": 2,
  },
  Equation {
    "num1": Equation {
      "num1": EquationNumber {
        "num": 4,
        "stringCache": "4",
        "totalCache": 4,
      },
      "num2": EquationNumber {
        "num": 6,
        "stringCache": "6",
        "totalCache": 6,
      },
      "operation": Object {
        "name": "Minus",
        "operationFunction": [Function],
        "operator": "-",
      },
      "stringCache": "(4 - 6)",
      "totalCache": -2,
    },
    "num2": EquationNumber {
      "num": 5,
      "stringCache": "5",
      "totalCache": 5,
    },
    "operation": Object {
      "name": "Plus",
      "operationFunction": [Function],
      "operator": "+",
    },
    "stringCache": "((4 - 6) + 5)",
    "totalCache": 3,
  },
  Equation {
    "num1": Equation {
      "num1": EquationNumber {
        "num": 4,
        "stringCache": "4",
        "totalCache": 4,
      },
      "num2": EquationNumber {
        "num": 6,
        "stringCache": "6",
        "totalCache": 6,
      },
      "operation": Object {
        "name": "Multiply",
        "operationFunction": [Function],
        "operator": "x",
      },
      "stringCache": "(4 x 6)",
      "totalCache": 24,
    },
    "num2": EquationNumber {
      "num": 5,
      "stringCache": "5",
      "totalCache": 5,
    },
    "operation": Object {
      "name": "Plus",
      "operationFunction": [Function],
      "operator": "+",
    },
    "stringCache": "((4 x 6) + 5)",
    "totalCache": 29,
  },
  Equation {
    "num1": Equation {
      "num1": EquationNumber {
        "num": 4,
        "stringCache": "4",
        "totalCache": 4,
      },
      "num2": EquationNumber {
        "num": 6,
        "stringCache": "6",
        "totalCache": 6,
      },
      "operation": Object {
        "name": "Multiply",
        "operationFunction": [Function],
        "operator": "x",
      },
      "stringCache": "(4 x 6)",
      "totalCache": 24,
    },
    "num2": EquationNumber {
      "num": 5,
      "stringCache": "5",
      "totalCache": 5,
    },
    "operation": Object {
      "name": "Minus",
      "operationFunction": [Function],
      "operator": "-",
    },
    "stringCache": "((4 x 6) - 5)",
    "totalCache": 19,
  },
  Equation {
    "num1": EquationNumber {
      "num": 4,
      "stringCache": "4",
      "totalCache": 4,
    },
    "num2": Equation {
      "num1": EquationNumber {
        "num": 6,
        "stringCache": "6",
        "totalCache": 6,
      },
      "num2": EquationNumber {
        "num": 5,
        "stringCache": "5",
        "totalCache": 5,
      },
      "operation": Object {
        "name": "Plus",
        "operationFunction": [Function],
        "operator": "+",
      },
      "stringCache": "(6 + 5)",
      "totalCache": 11,
    },
    "operation": Object {
      "name": "Plus",
      "operationFunction": [Function],
      "operator": "+",
    },
    "stringCache": "(4 + (6 + 5))",
    "totalCache": 15,
  },
  Equation {
    "num1": EquationNumber {
      "num": 4,
      "stringCache": "4",
      "totalCache": 4,
    },
    "num2": Equation {
      "num1": EquationNumber {
        "num": 6,
        "stringCache": "6",
        "totalCache": 6,
      },
      "num2": EquationNumber {
        "num": 5,
        "stringCache": "5",
        "totalCache": 5,
      },
      "operation": Object {
        "name": "Minus",
        "operationFunction": [Function],
        "operator": "-",
      },
      "stringCache": "(6 - 5)",
      "totalCache": 1,
    },
    "operation": Object {
      "name": "Plus",
      "operationFunction": [Function],
      "operator": "+",
    },
    "stringCache": "(4 + (6 - 5))",
    "totalCache": 5,
  },
  Equation {
    "num1": EquationNumber {
      "num": 4,
      "stringCache": "4",
      "totalCache": 4,
    },
    "num2": Equation {
      "num1": EquationNumber {
        "num": 6,
        "stringCache": "6",
        "totalCache": 6,
      },
      "num2": EquationNumber {
        "num": 5,
        "stringCache": "5",
        "totalCache": 5,
      },
      "operation": Object {
        "name": "Minus",
        "operationFunction": [Function],
        "operator": "-",
      },
      "stringCache": "(6 - 5)",
      "totalCache": 1,
    },
    "operation": Object {
      "name": "Minus",
      "operationFunction": [Function],
      "operator": "-",
    },
    "stringCache": "(4 - (6 - 5))",
    "totalCache": 3,
  },
  Equation {
    "num1": EquationNumber {
      "num": 4,
      "stringCache": "4",
      "totalCache": 4,
    },
    "num2": Equation {
      "num1": EquationNumber {
        "num": 6,
        "stringCache": "6",
        "totalCache": 6,
      },
      "num2": EquationNumber {
        "num": 5,
        "stringCache": "5",
        "totalCache": 5,
      },
      "operation": Object {
        "name": "Minus",
        "operationFunction": [Function],
        "operator": "-",
      },
      "stringCache": "(6 - 5)",
      "totalCache": 1,
    },
    "operation": Object {
      "name": "Multiply",
      "operationFunction": [Function],
      "operator": "x",
    },
    "stringCache": "(4 x (6 - 5))",
    "totalCache": 4,
  },
  Equation {
    "num1": EquationNumber {
      "num": 4,
      "stringCache": "4",
      "totalCache": 4,
    },
    "num2": Equation {
      "num1": EquationNumber {
        "num": 6,
        "stringCache": "6",
        "totalCache": 6,
      },
      "num2": EquationNumber {
        "num": 5,
        "stringCache": "5",
        "totalCache": 5,
      },
      "operation": Object {
        "name": "Minus",
        "operationFunction": [Function],
        "operator": "-",
      },
      "stringCache": "(6 - 5)",
      "totalCache": 1,
    },
    "operation": Object {
      "name": "Divide",
      "operationFunction": [Function],
      "operator": "/",
    },
    "stringCache": "(4 / (6 - 5))",
    "totalCache": 4,
  },
  Equation {
    "num1": EquationNumber {
      "num": 4,
      "stringCache": "4",
      "totalCache": 4,
    },
    "num2": Equation {
      "num1": EquationNumber {
        "num": 6,
        "stringCache": "6",
        "totalCache": 6,
      },
      "num2": EquationNumber {
        "num": 5,
        "stringCache": "5",
        "totalCache": 5,
      },
      "operation": Object {
        "name": "Minus",
        "operationFunction": [Function],
        "operator": "-",
      },
      "stringCache": "(6 - 5)",
      "totalCache": 1,
    },
    "operation": Object {
      "name": "Power",
      "operationFunction": [Function],
      "operator": "^",
    },
    "stringCache": "(4 ^ (6 - 5))",
    "totalCache": 4,
  },
  Equation {
    "num1": EquationNumber {
      "num": 4,
      "stringCache": "4",
      "totalCache": 4,
    },
    "num2": Equation {
      "num1": EquationNumber {
        "num": 6,
        "stringCache": "6",
        "totalCache": 6,
      },
      "num2": EquationNumber {
        "num": 5,
        "stringCache": "5",
        "totalCache": 5,
      },
      "operation": Object {
        "name": "Multiply",
        "operationFunction": [Function],
        "operator": "x",
      },
      "stringCache": "(6 x 5)",
      "totalCache": 30,
    },
    "operation": Object {
      "name": "Plus",
      "operationFunction": [Function],
      "operator": "+",
    },
    "stringCache": "(4 + (6 x 5))",
    "totalCache": 34,
  },
  Equation {
    "num1": Equation {
      "num1": EquationNumber {
        "num": 5,
        "stringCache": "5",
        "totalCache": 5,
      },
      "num2": EquationNumber {
        "num": 4,
        "stringCache": "4",
        "totalCache": 4,
      },
      "operation": Object {
        "name": "Plus",
        "operationFunction": [Function],
        "operator": "+",
      },
      "stringCache": "(5 + 4)",
      "totalCache": 9,
    },
    "num2": EquationNumber {
      "num": 6,
      "stringCache": "6",
      "totalCache": 6,
    },
    "operation": Object {
      "name": "Plus",
      "operationFunction": [Function],
      "operator": "+",
    },
    "stringCache": "((5 + 4) + 6)",
    "totalCache": 15,
  },
  Equation {
    "num1": Equation {
      "num1": EquationNumber {
        "num": 5,
        "stringCache": "5",
        "totalCache": 5,
      },
      "num2": EquationNumber {
        "num": 4,
        "stringCache": "4",
        "totalCache": 4,
      },
      "operation": Object {
        "name": "Plus",
        "operationFunction": [Function],
        "operator": "+",
      },
      "stringCache": "(5 + 4)",
      "totalCache": 9,
    },
    "num2": EquationNumber {
      "num": 6,
      "stringCache": "6",
      "totalCache": 6,
    },
    "operation": Object {
      "name": "Minus",
      "operationFunction": [Function],
      "operator": "-",
    },
    "stringCache": "((5 + 4) - 6)",
    "totalCache": 3,
  },
  Equation {
    "num1": Equation {
      "num1": EquationNumber {
        "num": 5,
        "stringCache": "5",
        "totalCache": 5,
      },
      "num2": EquationNumber {
        "num": 4,
        "stringCache": "4",
        "totalCache": 4,
      },
      "operation": Object {
        "name": "Minus",
        "operationFunction": [Function],
        "operator": "-",
      },
      "stringCache": "(5 - 4)",
      "totalCache": 1,
    },
    "num2": EquationNumber {
      "num": 6,
      "stringCache": "6",
      "totalCache": 6,
    },
    "operation": Object {
      "name": "Plus",
      "operationFunction": [Function],
      "operator": "+",
    },
    "stringCache": "((5 - 4) + 6)",
    "totalCache": 7,
  },
  Equation {
    "num1": Equation {
      "num1": EquationNumber {
        "num": 5,
        "stringCache": "5",
        "totalCache": 5,
      },
      "num2": EquationNumber {
        "num": 4,
        "stringCache": "4",
        "totalCache": 4,
      },
      "operation": Object {
        "name": "Minus",
        "operationFunction": [Function],
        "operator": "-",
      },
      "stringCache": "(5 - 4)",
      "totalCache": 1,
    },
    "num2": EquationNumber {
      "num": 6,
      "stringCache": "6",
      "totalCache": 6,
    },
    "operation": Object {
      "name": "Multiply",
      "operationFunction": [Function],
      "operator": "x",
    },
    "stringCache": "((5 - 4) x 6)",
    "totalCache": 6,
  },
  Equation {
    "num1": Equation {
      "num1": EquationNumber {
        "num": 5,
        "stringCache": "5",
        "totalCache": 5,
      },
      "num2": EquationNumber {
        "num": 4,
        "stringCache": "4",
        "totalCache": 4,
      },
      "operation": Object {
        "name": "Multiply",
        "operationFunction": [Function],
        "operator": "x",
      },
      "stringCache": "(5 x 4)",
      "totalCache": 20,
    },
    "num2": EquationNumber {
      "num": 6,
      "stringCache": "6",
      "totalCache": 6,
    },
    "operation": Object {
      "name": "Plus",
      "operationFunction": [Function],
      "operator": "+",
    },
    "stringCache": "((5 x 4) + 6)",
    "totalCache": 26,
  },
  Equation {
    "num1": Equation {
      "num1": EquationNumber {
        "num": 5,
        "stringCache": "5",
        "totalCache": 5,
      },
      "num2": EquationNumber {
        "num": 4,
        "stringCache": "4",
        "totalCache": 4,
      },
      "operation": Object {
        "name": "Multiply",
        "operationFunction": [Function],
        "operator": "x",
      },
      "stringCache": "(5 x 4)",
      "totalCache": 20,
    },
    "num2": EquationNumber {
      "num": 6,
      "stringCache": "6",
      "totalCache": 6,
    },
    "operation": Object {
      "name": "Minus",
      "operationFunction": [Function],
      "operator": "-",
    },
    "stringCache": "((5 x 4) - 6)",
    "totalCache": 14,
  },
  Equation {
    "num1": EquationNumber {
      "num": 5,
      "stringCache": "5",
      "totalCache": 5,
    },
    "num2": Equation {
      "num1": EquationNumber {
        "num": 4,
        "stringCache": "4",
        "totalCache": 4,
      },
      "num2": EquationNumber {
        "num": 6,
        "stringCache": "6",
        "totalCache": 6,
      },
      "operation": Object {
        "name": "Plus",
        "operationFunction": [Function],
        "operator": "+",
      },
      "stringCache": "(4 + 6)",
      "totalCache": 10,
    },
    "operation": Object {
      "name": "Plus",
      "operationFunction": [Function],
      "operator": "+",
    },
    "stringCache": "(5 + (4 + 6))",
    "totalCache": 15,
  },
  Equation {
    "num1": EquationNumber {
      "num": 5,
      "stringCache": "5",
      "totalCache": 5,
    },
    "num2": Equation {
      "num1": EquationNumber {
        "num": 4,
        "stringCache": "4",
        "totalCache": 4,
      },
      "num2": EquationNumber {
        "num": 6,
        "stringCache": "6",
        "totalCache": 6,
      },
      "operation": Object {
        "name": "Minus",
        "operationFunction": [Function],
        "operator": "-",
      },
      "stringCache": "(4 - 6)",
      "totalCache": -2,
    },
    "operation": Object {
      "name": "Plus",
      "operationFunction": [Function],
      "operator": "+",
    },
    "stringCache": "(5 + (4 - 6))",
    "totalCache": 3,
  },
  Equation {
    "num1": EquationNumber {
      "num": 5,
      "stringCache": "5",
      "totalCache": 5,
    },
    "num2": Equation {
      "num1": EquationNumber {
        "num": 4,
        "stringCache": "4",
        "totalCache": 4,
      },
      "num2": EquationNumber {
        "num": 6,
        "stringCache": "6",
        "totalCache": 6,
      },
      "operation": Object {
        "name": "Minus",
        "operationFunction": [Function],
        "operator": "-",
      },
      "stringCache": "(4 - 6)",
      "totalCache": -2,
    },
    "operation": Object {
      "name": "Minus",
      "operationFunction": [Function],
      "operator": "-",
    },
    "stringCache": "(5 - (4 - 6))",
    "totalCache": 7,
  },
  Equation {
    "num1": EquationNumber {
      "num": 5,
      "stringCache": "5",
      "totalCache": 5,
    },
    "num2": Equation {
      "num1": EquationNumber {
        "num": 4,
        "stringCache": "4",
        "totalCache": 4,
      },
      "num2": EquationNumber {
        "num": 6,
        "stringCache": "6",
        "totalCache": 6,
      },
      "operation": Object {
        "name": "Multiply",
        "operationFunction": [Function],
        "operator": "x",
      },
      "stringCache": "(4 x 6)",
      "totalCache": 24,
    },
    "operation": Object {
      "name": "Plus",
      "operationFunction": [Function],
      "operator": "+",
    },
    "stringCache": "(5 + (4 x 6))",
    "totalCache": 29,
  },
  Equation {
    "num1": Equation {
      "num1": EquationNumber {
        "num": 5,
        "stringCache": "5",
        "totalCache": 5,
      },
      "num2": EquationNumber {
        "num": 6,
        "stringCache": "6",
        "totalCache": 6,
      },
      "operation": Object {
        "name": "Plus",
        "operationFunction": [Function],
        "operator": "+",
      },
      "stringCache": "(5 + 6)",
      "totalCache": 11,
    },
    "num2": EquationNumber {
      "num": 4,
      "stringCache": "4",
      "totalCache": 4,
    },
    "operation": Object {
      "name": "Plus",
      "operationFunction": [Function],
      "operator": "+",
    },
    "stringCache": "((5 + 6) + 4)",
    "totalCache": 15,
  },
  Equation {
    "num1": Equation {
      "num1": EquationNumber {
        "num": 5,
        "stringCache": "5",
        "totalCache": 5,
      },
      "num2": EquationNumber {
        "num": 6,
        "stringCache": "6",
        "totalCache": 6,
      },
      "operation": Object {
        "name": "Plus",
        "operationFunction": [Function],
        "operator": "+",
      },
      "stringCache": "(5 + 6)",
      "totalCache": 11,
    },
    "num2": EquationNumber {
      "num": 4,
      "stringCache": "4",
      "totalCache": 4,
    },
    "operation": Object {
      "name": "Minus",
      "operationFunction": [Function],
      "operator": "-",
    },
    "stringCache": "((5 + 6) - 4)",
    "totalCache": 7,
  },
  Equation {
    "num1": Equation {
      "num1": EquationNumber {
        "num": 5,
        "stringCache": "5",
        "totalCache": 5,
      },
      "num2": EquationNumber {
        "num": 6,
        "stringCache": "6",
        "totalCache": 6,
      },
      "operation": Object {
        "name": "Minus",
        "operationFunction": [Function],
        "operator": "-",
      },
      "stringCache": "(5 - 6)",
      "totalCache": -1,
    },
    "num2": EquationNumber {
      "num": 4,
      "stringCache": "4",
      "totalCache": 4,
    },
    "operation": Object {
      "name": "Plus",
      "operationFunction": [Function],
      "operator": "+",
    },
    "stringCache": "((5 - 6) + 4)",
    "totalCache": 3,
  },
  Equation {
    "num1": Equation {
      "num1": EquationNumber {
        "num": 5,
        "stringCache": "5",
        "totalCache": 5,
      },
      "num2": EquationNumber {
        "num": 6,
        "stringCache": "6",
        "totalCache": 6,
      },
      "operation": Object {
        "name": "Multiply",
        "operationFunction": [Function],
        "operator": "x",
      },
      "stringCache": "(5 x 6)",
      "totalCache": 30,
    },
    "num2": EquationNumber {
      "num": 4,
      "stringCache": "4",
      "totalCache": 4,
    },
    "operation": Object {
      "name": "Plus",
      "operationFunction": [Function],
      "operator": "+",
    },
    "stringCache": "((5 x 6) + 4)",
    "totalCache": 34,
  },
  Equation {
    "num1": Equation {
      "num1": EquationNumber {
        "num": 5,
        "stringCache": "5",
        "totalCache": 5,
      },
      "num2": EquationNumber {
        "num": 6,
        "stringCache": "6",
        "totalCache": 6,
      },
      "operation": Object {
        "name": "Multiply",
        "operationFunction": [Function],
        "operator": "x",
      },
      "stringCache": "(5 x 6)",
      "totalCache": 30,
    },
    "num2": EquationNumber {
      "num": 4,
      "stringCache": "4",
      "totalCache": 4,
    },
    "operation": Object {
      "name": "Minus",
      "operationFunction": [Function],
      "operator": "-",
    },
    "stringCache": "((5 x 6) - 4)",
    "totalCache": 26,
  },
  Equation {
    "num1": EquationNumber {
      "num": 5,
      "stringCache": "5",
      "totalCache": 5,
    },
    "num2": Equation {
      "num1": EquationNumber {
        "num": 6,
        "stringCache": "6",
        "totalCache": 6,
      },
      "num2": EquationNumber {
        "num": 4,
        "stringCache": "4",
        "totalCache": 4,
      },
      "operation": Object {
        "name": "Plus",
        "operationFunction": [Function],
        "operator": "+",
      },
      "stringCache": "(6 + 4)",
      "totalCache": 10,
    },
    "operation": Object {
      "name": "Plus",
      "operationFunction": [Function],
      "operator": "+",
    },
    "stringCache": "(5 + (6 + 4))",
    "totalCache": 15,
  },
  Equation {
    "num1": EquationNumber {
      "num": 5,
      "stringCache": "5",
      "totalCache": 5,
    },
    "num2": Equation {
      "num1": EquationNumber {
        "num": 6,
        "stringCache": "6",
        "totalCache": 6,
      },
      "num2": EquationNumber {
        "num": 4,
        "stringCache": "4",
        "totalCache": 4,
      },
      "operation": Object {
        "name": "Minus",
        "operationFunction": [Function],
        "operator": "-",
      },
      "stringCache": "(6 - 4)",
      "totalCache": 2,
    },
    "operation": Object {
      "name": "Plus",
      "operationFunction": [Function],
      "operator": "+",
    },
    "stringCache": "(5 + (6 - 4))",
    "totalCache": 7,
  },
  Equation {
    "num1": EquationNumber {
      "num": 5,
      "stringCache": "5",
      "totalCache": 5,
    },
    "num2": Equation {
      "num1": EquationNumber {
        "num": 6,
        "stringCache": "6",
        "totalCache": 6,
      },
      "num2": EquationNumber {
        "num": 4,
        "stringCache": "4",
        "totalCache": 4,
      },
      "operation": Object {
        "name": "Minus",
        "operationFunction": [Function],
        "operator": "-",
      },
      "stringCache": "(6 - 4)",
      "totalCache": 2,
    },
    "operation": Object {
      "name": "Minus",
      "operationFunction": [Function],
      "operator": "-",
    },
    "stringCache": "(5 - (6 - 4))",
    "totalCache": 3,
  },
  Equation {
    "num1": EquationNumber {
      "num": 5,
      "stringCache": "5",
      "totalCache": 5,
    },
    "num2": Equation {
      "num1": EquationNumber {
        "num": 6,
        "stringCache": "6",
        "totalCache": 6,
      },
      "num2": EquationNumber {
        "num": 4,
        "stringCache": "4",
        "totalCache": 4,
      },
      "operation": Object {
        "name": "Minus",
        "operationFunction": [Function],
        "operator": "-",
      },
      "stringCache": "(6 - 4)",
      "totalCache": 2,
    },
    "operation": Object {
      "name": "Multiply",
      "operationFunction": [Function],
      "operator": "x",
    },
    "stringCache": "(5 x (6 - 4))",
    "totalCache": 10,
  },
  Equation {
    "num1": EquationNumber {
      "num": 5,
      "stringCache": "5",
      "totalCache": 5,
    },
    "num2": Equation {
      "num1": EquationNumber {
        "num": 6,
        "stringCache": "6",
        "totalCache": 6,
      },
      "num2": EquationNumber {
        "num": 4,
        "stringCache": "4",
        "totalCache": 4,
      },
      "operation": Object {
        "name": "Multiply",
        "operationFunction": [Function],
        "operator": "x",
      },
      "stringCache": "(6 x 4)",
      "totalCache": 24,
    },
    "operation": Object {
      "name": "Plus",
      "operationFunction": [Function],
      "operator": "+",
    },
    "stringCache": "(5 + (6 x 4))",
    "totalCache": 29,
  },
  Equation {
    "num1": Equation {
      "num1": EquationNumber {
        "num": 6,
        "stringCache": "6",
        "totalCache": 6,
      },
      "num2": EquationNumber {
        "num": 4,
        "stringCache": "4",
        "totalCache": 4,
      },
      "operation": Object {
        "name": "Plus",
        "operationFunction": [Function],
        "operator": "+",
      },
      "stringCache": "(6 + 4)",
      "totalCache": 10,
    },
    "num2": EquationNumber {
      "num": 5,
      "stringCache": "5",
      "totalCache": 5,
    },
    "operation": Object {
      "name": "Plus",
      "operationFunction": [Function],
      "operator": "+",
    },
    "stringCache": "((6 + 4) + 5)",
    "totalCache": 15,
  },
  Equation {
    "num1": Equation {
      "num1": EquationNumber {
        "num": 6,
        "stringCache": "6",
        "totalCache": 6,
      },
      "num2": EquationNumber {
        "num": 4,
        "stringCache": "4",
        "totalCache": 4,
      },
      "operation": Object {
        "name": "Plus",
        "operationFunction": [Function],
        "operator": "+",
      },
      "stringCache": "(6 + 4)",
      "totalCache": 10,
    },
    "num2": EquationNumber {
      "num": 5,
      "stringCache": "5",
      "totalCache": 5,
    },
    "operation": Object {
      "name": "Minus",
      "operationFunction": [Function],
      "operator": "-",
    },
    "stringCache": "((6 + 4) - 5)",
    "totalCache": 5,
  },
  Equation {
    "num1": Equation {
      "num1": EquationNumber {
        "num": 6,
        "stringCache": "6",
        "totalCache": 6,
      },
      "num2": EquationNumber {
        "num": 4,
        "stringCache": "4",
        "totalCache": 4,
      },
      "operation": Object {
        "name": "Plus",
        "operationFunction": [Function],
        "operator": "+",
      },
      "stringCache": "(6 + 4)",
      "totalCache": 10,
    },
    "num2": EquationNumber {
      "num": 5,
      "stringCache": "5",
      "totalCache": 5,
    },
    "operation": Object {
      "name": "Divide",
      "operationFunction": [Function],
      "operator": "/",
    },
    "stringCache": "((6 + 4) / 5)",
    "totalCache": 2,
  },
  Equation {
    "num1": Equation {
      "num1": EquationNumber {
        "num": 6,
        "stringCache": "6",
        "totalCache": 6,
      },
      "num2": EquationNumber {
        "num": 4,
        "stringCache": "4",
        "totalCache": 4,
      },
      "operation": Object {
        "name": "Plus",
        "operationFunction": [Function],
        "operator": "+",
      },
      "stringCache": "(6 + 4)",
      "totalCache": 10,
    },
    "num2": EquationNumber {
      "num": 5,
      "stringCache": "5",
      "totalCache": 5,
    },
    "operation": Object {
      "name": "Power",
      "operationFunction": [Function],
      "operator": "^",
    },
    "stringCache": "((6 + 4) ^ 5)",
    "totalCache": 2,
  },
  Equation {
    "num1": Equation {
      "num1": EquationNumber {
        "num": 6,
        "stringCache": "6",
        "totalCache": 6,
      },
      "num2": EquationNumber {
        "num": 4,
        "stringCache": "4",
        "totalCache": 4,
      },
      "operation": Object {
        "name": "Minus",
        "operationFunction": [Function],
        "operator": "-",
      },
      "stringCache": "(6 - 4)",
      "totalCache": 2,
    },
    "num2": EquationNumber {
      "num": 5,
      "stringCache": "5",
      "totalCache": 5,
    },
    "operation": Object {
      "name": "Plus",
      "operationFunction": [Function],
      "operator": "+",
    },
    "stringCache": "((6 - 4) + 5)",
    "totalCache": 7,
  },
  Equation {
    "num1": Equation {
      "num1": EquationNumber {
        "num": 6,
        "stringCache": "6",
        "totalCache": 6,
      },
      "num2": EquationNumber {
        "num": 4,
        "stringCache": "4",
        "totalCache": 4,
      },
      "operation": Object {
        "name": "Minus",
        "operationFunction": [Function],
        "operator": "-",
      },
      "stringCache": "(6 - 4)",
      "totalCache": 2,
    },
    "num2": EquationNumber {
      "num": 5,
      "stringCache": "5",
      "totalCache": 5,
    },
    "operation": Object {
      "name": "Multiply",
      "operationFunction": [Function],
      "operator": "x",
    },
    "stringCache": "((6 - 4) x 5)",
    "totalCache": 10,
  },
  Equation {
    "num1": Equation {
      "num1": EquationNumber {
        "num": 6,
        "stringCache": "6",
        "totalCache": 6,
      },
      "num2": EquationNumber {
        "num": 4,
        "stringCache": "4",
        "totalCache": 4,
      },
      "operation": Object {
        "name": "Multiply",
        "operationFunction": [Function],
        "operator": "x",
      },
      "stringCache": "(6 x 4)",
      "totalCache": 24,
    },
    "num2": EquationNumber {
      "num": 5,
      "stringCache": "5",
      "totalCache": 5,
    },
    "operation": Object {
      "name": "Plus",
      "operationFunction": [Function],
      "operator": "+",
    },
    "stringCache": "((6 x 4) + 5)",
    "totalCache": 29,
  },
  Equation {
    "num1": Equation {
      "num1": EquationNumber {
        "num": 6,
        "stringCache": "6",
        "totalCache": 6,
      },
      "num2": EquationNumber {
        "num": 4,
        "stringCache": "4",
        "totalCache": 4,
      },
      "operation": Object {
        "name": "Multiply",
        "operationFunction": [Function],
        "operator": "x",
      },
      "stringCache": "(6 x 4)",
      "totalCache": 24,
    },
    "num2": EquationNumber {
      "num": 5,
      "stringCache": "5",
      "totalCache": 5,
    },
    "operation": Object {
      "name": "Minus",
      "operationFunction": [Function],
      "operator": "-",
    },
    "stringCache": "((6 x 4) - 5)",
    "totalCache": 19,
  },
  Equation {
    "num1": EquationNumber {
      "num": 6,
      "stringCache": "6",
      "totalCache": 6,
    },
    "num2": Equation {
      "num1": EquationNumber {
        "num": 4,
        "stringCache": "4",
        "totalCache": 4,
      },
      "num2": EquationNumber {
        "num": 5,
        "stringCache": "5",
        "totalCache": 5,
      },
      "operation": Object {
        "name": "Plus",
        "operationFunction": [Function],
        "operator": "+",
      },
      "stringCache": "(4 + 5)",
      "totalCache": 9,
    },
    "operation": Object {
      "name": "Plus",
      "operationFunction": [Function],
      "operator": "+",
    },
    "stringCache": "(6 + (4 + 5))",
    "totalCache": 15,
  },
  Equation {
    "num1": EquationNumber {
      "num": 6,
      "stringCache": "6",
      "totalCache": 6,
    },
    "num2": Equation {
      "num1": EquationNumber {
        "num": 4,
        "stringCache": "4",
        "totalCache": 4,
      },
      "num2": EquationNumber {
        "num": 5,
        "stringCache": "5",
        "totalCache": 5,
      },
      "operation": Object {
        "name": "Minus",
        "operationFunction": [Function],
        "operator": "-",
      },
      "stringCache": "(4 - 5)",
      "totalCache": -1,
    },
    "operation": Object {
      "name": "Plus",
      "operationFunction": [Function],
      "operator": "+",
    },
    "stringCache": "(6 + (4 - 5))",
    "totalCache": 5,
  },
  Equation {
    "num1": EquationNumber {
      "num": 6,
      "stringCache": "6",
      "totalCache": 6,
    },
    "num2": Equation {
      "num1": EquationNumber {
        "num": 4,
        "stringCache": "4",
        "totalCache": 4,
      },
      "num2": EquationNumber {
        "num": 5,
        "stringCache": "5",
        "totalCache": 5,
      },
      "operation": Object {
        "name": "Minus",
        "operationFunction": [Function],
        "operator": "-",
      },
      "stringCache": "(4 - 5)",
      "totalCache": -1,
    },
    "operation": Object {
      "name": "Minus",
      "operationFunction": [Function],
      "operator": "-",
    },
    "stringCache": "(6 - (4 - 5))",
    "totalCache": 7,
  },
  Equation {
    "num1": EquationNumber {
      "num": 6,
      "stringCache": "6",
      "totalCache": 6,
    },
    "num2": Equation {
      "num1": EquationNumber {
        "num": 4,
        "stringCache": "4",
        "totalCache": 4,
      },
      "num2": EquationNumber {
        "num": 5,
        "stringCache": "5",
        "totalCache": 5,
      },
      "operation": Object {
        "name": "Multiply",
        "operationFunction": [Function],
        "operator": "x",
      },
      "stringCache": "(4 x 5)",
      "totalCache": 20,
    },
    "operation": Object {
      "name": "Plus",
      "operationFunction": [Function],
      "operator": "+",
    },
    "stringCache": "(6 + (4 x 5))",
    "totalCache": 26,
  },
  Equation {
    "num1": Equation {
      "num1": EquationNumber {
        "num": 6,
        "stringCache": "6",
        "totalCache": 6,
      },
      "num2": EquationNumber {
        "num": 5,
        "stringCache": "5",
        "totalCache": 5,
      },
      "operation": Object {
        "name": "Plus",
        "operationFunction": [Function],
        "operator": "+",
      },
      "stringCache": "(6 + 5)",
      "totalCache": 11,
    },
    "num2": EquationNumber {
      "num": 4,
      "stringCache": "4",
      "totalCache": 4,
    },
    "operation": Object {
      "name": "Plus",
      "operationFunction": [Function],
      "operator": "+",
    },
    "stringCache": "((6 + 5) + 4)",
    "totalCache": 15,
  },
  Equation {
    "num1": Equation {
      "num1": EquationNumber {
        "num": 6,
        "stringCache": "6",
        "totalCache": 6,
      },
      "num2": EquationNumber {
        "num": 5,
        "stringCache": "5",
        "totalCache": 5,
      },
      "operation": Object {
        "name": "Plus",
        "operationFunction": [Function],
        "operator": "+",
      },
      "stringCache": "(6 + 5)",
      "totalCache": 11,
    },
    "num2": EquationNumber {
      "num": 4,
      "stringCache": "4",
      "totalCache": 4,
    },
    "operation": Object {
      "name": "Minus",
      "operationFunction": [Function],
      "operator": "-",
    },
    "stringCache": "((6 + 5) - 4)",
    "totalCache": 7,
  },
  Equation {
    "num1": Equation {
      "num1": EquationNumber {
        "num": 6,
        "stringCache": "6",
        "totalCache": 6,
      },
      "num2": EquationNumber {
        "num": 5,
        "stringCache": "5",
        "totalCache": 5,
      },
      "operation": Object {
        "name": "Minus",
        "operationFunction": [Function],
        "operator": "-",
      },
      "stringCache": "(6 - 5)",
      "totalCache": 1,
    },
    "num2": EquationNumber {
      "num": 4,
      "stringCache": "4",
      "totalCache": 4,
    },
    "operation": Object {
      "name": "Plus",
      "operationFunction": [Function],
      "operator": "+",
    },
    "stringCache": "((6 - 5) + 4)",
    "totalCache": 5,
  },
  Equation {
    "num1": Equation {
      "num1": EquationNumber {
        "num": 6,
        "stringCache": "6",
        "totalCache": 6,
      },
      "num2": EquationNumber {
        "num": 5,
        "stringCache": "5",
        "totalCache": 5,
      },
      "operation": Object {
        "name": "Minus",
        "operationFunction": [Function],
        "operator": "-",
      },
      "stringCache": "(6 - 5)",
      "totalCache": 1,
    },
    "num2": EquationNumber {
      "num": 4,
      "stringCache": "4",
      "totalCache": 4,
    },
    "operation": Object {
      "name": "Multiply",
      "operationFunction": [Function],
      "operator": "x",
    },
    "stringCache": "((6 - 5) x 4)",
    "totalCache": 4,
  },
  Equation {
    "num1": Equation {
      "num1": EquationNumber {
        "num": 6,
        "stringCache": "6",
        "totalCache": 6,
      },
      "num2": EquationNumber {
        "num": 5,
        "stringCache": "5",
        "totalCache": 5,
      },
      "operation": Object {
        "name": "Multiply",
        "operationFunction": [Function],
        "operator": "x",
      },
      "stringCache": "(6 x 5)",
      "totalCache": 30,
    },
    "num2": EquationNumber {
      "num": 4,
      "stringCache": "4",
      "totalCache": 4,
    },
    "operation": Object {
      "name": "Plus",
      "operationFunction": [Function],
      "operator": "+",
    },
    "stringCache": "((6 x 5) + 4)",
    "totalCache": 34,
  },
  Equation {
    "num1": Equation {
      "num1": EquationNumber {
        "num": 6,
        "stringCache": "6",
        "totalCache": 6,
      },
      "num2": EquationNumber {
        "num": 5,
        "stringCache": "5",
        "totalCache": 5,
      },
      "operation": Object {
        "name": "Multiply",
        "operationFunction": [Function],
        "operator": "x",
      },
      "stringCache": "(6 x 5)",
      "totalCache": 30,
    },
    "num2": EquationNumber {
      "num": 4,
      "stringCache": "4",
      "totalCache": 4,
    },
    "operation": Object {
      "name": "Minus",
      "operationFunction": [Function],
      "operator": "-",
    },
    "stringCache": "((6 x 5) - 4)",
    "totalCache": 26,
  },
  Equation {
    "num1": EquationNumber {
      "num": 6,
      "stringCache": "6",
      "totalCache": 6,
    },
    "num2": Equation {
      "num1": EquationNumber {
        "num": 5,
        "stringCache": "5",
        "totalCache": 5,
      },
      "num2": EquationNumber {
        "num": 4,
        "stringCache": "4",
        "totalCache": 4,
      },
      "operation": Object {
        "name": "Plus",
        "operationFunction": [Function],
        "operator": "+",
      },
      "stringCache": "(5 + 4)",
      "totalCache": 9,
    },
    "operation": Object {
      "name": "Plus",
      "operationFunction": [Function],
      "operator": "+",
    },
    "stringCache": "(6 + (5 + 4))",
    "totalCache": 15,
  },
  Equation {
    "num1": EquationNumber {
      "num": 6,
      "stringCache": "6",
      "totalCache": 6,
    },
    "num2": Equation {
      "num1": EquationNumber {
        "num": 5,
        "stringCache": "5",
        "totalCache": 5,
      },
      "num2": EquationNumber {
        "num": 4,
        "stringCache": "4",
        "totalCache": 4,
      },
      "operation": Object {
        "name": "Minus",
        "operationFunction": [Function],
        "operator": "-",
      },
      "stringCache": "(5 - 4)",
      "totalCache": 1,
    },
    "operation": Object {
      "name": "Plus",
      "operationFunction": [Function],
      "operator": "+",
    },
    "stringCache": "(6 + (5 - 4))",
    "totalCache": 7,
  },
  Equation {
    "num1": EquationNumber {
      "num": 6,
      "stringCache": "6",
      "totalCache": 6,
    },
    "num2": Equation {
      "num1": EquationNumber {
        "num": 5,
        "stringCache": "5",
        "totalCache": 5,
      },
      "num2": EquationNumber {
        "num": 4,
        "stringCache": "4",
        "totalCache": 4,
      },
      "operation": Object {
        "name": "Minus",
        "operationFunction": [Function],
        "operator": "-",
      },
      "stringCache": "(5 - 4)",
      "totalCache": 1,
    },
    "operation": Object {
      "name": "Minus",
      "operationFunction": [Function],
      "operator": "-",
    },
    "stringCache": "(6 - (5 - 4))",
    "totalCache": 5,
  },
  Equation {
    "num1": EquationNumber {
      "num": 6,
      "stringCache": "6",
      "totalCache": 6,
    },
    "num2": Equation {
      "num1": EquationNumber {
        "num": 5,
        "stringCache": "5",
        "totalCache": 5,
      },
      "num2": EquationNumber {
        "num": 4,
        "stringCache": "4",
        "totalCache": 4,
      },
      "operation": Object {
        "name": "Minus",
        "operationFunction": [Function],
        "operator": "-",
      },
      "stringCache": "(5 - 4)",
      "totalCache": 1,
    },
    "operation": Object {
      "name": "Multiply",
      "operationFunction": [Function],
      "operator": "x",
    },
    "stringCache": "(6 x (5 - 4))",
    "totalCache": 6,
  },
  Equation {
    "num1": EquationNumber {
      "num": 6,
      "stringCache": "6",
      "totalCache": 6,
    },
    "num2": Equation {
      "num1": EquationNumber {
        "num": 5,
        "stringCache": "5",
        "totalCache": 5,
      },
      "num2": EquationNumber {
        "num": 4,
        "stringCache": "4",
        "totalCache": 4,
      },
      "operation": Object {
        "name": "Minus",
        "operationFunction": [Function],
        "operator": "-",
      },
      "stringCache": "(5 - 4)",
      "totalCache": 1,
    },
    "operation": Object {
      "name": "Divide",
      "operationFunction": [Function],
      "operator": "/",
    },
    "stringCache": "(6 / (5 - 4))",
    "totalCache": 6,
  },
  Equation {
    "num1": EquationNumber {
      "num": 6,
      "stringCache": "6",
      "totalCache": 6,
    },
    "num2": Equation {
      "num1": EquationNumber {
        "num": 5,
        "stringCache": "5",
        "totalCache": 5,
      },
      "num2": EquationNumber {
        "num": 4,
        "stringCache": "4",
        "totalCache": 4,
      },
      "operation": Object {
        "name": "Minus",
        "operationFunction": [Function],
        "operator": "-",
      },
      "stringCache": "(5 - 4)",
      "totalCache": 1,
    },
    "operation": Object {
      "name": "Power",
      "operationFunction": [Function],
      "operator": "^",
    },
    "stringCache": "(6 ^ (5 - 4))",
    "totalCache": 6,
  },
  Equation {
    "num1": EquationNumber {
      "num": 6,
      "stringCache": "6",
      "totalCache": 6,
    },
    "num2": Equation {
      "num1": EquationNumber {
        "num": 5,
        "stringCache": "5",
        "totalCache": 5,
      },
      "num2": EquationNumber {
        "num": 4,
        "stringCache": "4",
        "totalCache": 4,
      },
      "operation": Object {
        "name": "Multiply",
        "operationFunction": [Function],
        "operator": "x",
      },
      "stringCache": "(5 x 4)",
      "totalCache": 20,
    },
    "operation": Object {
      "name": "Plus",
      "operationFunction": [Function],
      "operator": "+",
    },
    "stringCache": "(6 + (5 x 4))",
    "totalCache": 26,
  },
]
`);
  });
});
