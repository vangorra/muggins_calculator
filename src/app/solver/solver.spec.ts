import { MugginsSolver, OPERATIONS } from './solver';

describe(MugginsSolver.name, () => {
  test('quick return on empty input', () => {
    const solver1 = new MugginsSolver({
      minTotal: 1,
      maxTotal: 36,
      faces: [1],
      operations: OPERATIONS,
    });

    expect(solver1.calculateSolutions()).toEqual([]);

    const solver2 = new MugginsSolver({
      minTotal: 1,
      maxTotal: 36,
      faces: [1, 1, 1],
      operations: [],
    });

    expect(solver2.calculateSolutions()).toEqual([]);
  });

  test(MugginsSolver.prototype.calculateSolutions.name, () => {
    const solver = new MugginsSolver({
      minTotal: 1,
      maxTotal: 36,
      faces: [4, 5, 6],
      operations: OPERATIONS,
    });
    const equations = solver.calculateSolutions();

    expect(equations).toEqual(
      JSON.parse(`
        [
          {
            "total": 1,
            "fullEquation": "1 = 4 ^ 6 % 5",
            "equation": "4 ^ 6 % 5",
            "sortableEquation": "0001 Z 4 ^ 6 % 5"
          },
          {
            "total": 1,
            "fullEquation": "1 = 5 % (4 % 6)",
            "equation": "5 % (4 % 6)",
            "sortableEquation": "0001 Z 5 % X4 % 6Y"
          },
          {
            "total": 1,
            "fullEquation": "1 = 5 % (4 - 6)",
            "equation": "5 % (4 - 6)",
            "sortableEquation": "0001 Z 5 % X4 - 6Y"
          },
          {
            "total": 1,
            "fullEquation": "1 = 5 % (6 % 4)",
            "equation": "5 % (6 % 4)",
            "sortableEquation": "0001 Z 5 % X6 % 4Y"
          },
          {
            "total": 1,
            "fullEquation": "1 = 5 % (6 - 4)",
            "equation": "5 % (6 - 4)",
            "sortableEquation": "0001 Z 5 % X6 - 4Y"
          },
          {
            "total": 1,
            "fullEquation": "1 = 5 - (4 % 6)",
            "equation": "5 - (4 % 6)",
            "sortableEquation": "0001 Z 5 - X4 % 6Y"
          },
          {
            "total": 1,
            "fullEquation": "1 = 5 ^ 4 % 6",
            "equation": "5 ^ 4 % 6",
            "sortableEquation": "0001 Z 5 ^ 4 % 6"
          },
          {
            "total": 1,
            "fullEquation": "1 = 5 ^ 6 % 4",
            "equation": "5 ^ 6 % 4",
            "sortableEquation": "0001 Z 5 ^ 6 % 4"
          },
          {
            "total": 1,
            "fullEquation": "1 = 6 % (5 / 4)",
            "equation": "6 % (5 / 4)",
            "sortableEquation": "0001 Z 6 % X5 / 4Y"
          },
          {
            "total": 1,
            "fullEquation": "1 = 6 ^ 4 % 5",
            "equation": "6 ^ 4 % 5",
            "sortableEquation": "0001 Z 6 ^ 4 % 5"
          },
          {
            "total": 1,
            "fullEquation": "1 = (4 - 5) ^ 6",
            "equation": "(4 - 5) ^ 6",
            "sortableEquation": "0001 Z X4 - 5Y ^ 6"
          },
          {
            "total": 1,
            "fullEquation": "1 = (5 % 4) % 6",
            "equation": "(5 % 4) % 6",
            "sortableEquation": "0001 Z X5 % 4Y % 6"
          },
          {
            "total": 1,
            "fullEquation": "1 = (5 % 4) ^ 6",
            "equation": "(5 % 4) ^ 6",
            "sortableEquation": "0001 Z X5 % 4Y ^ 6"
          },
          {
            "total": 1,
            "fullEquation": "1 = (5 % 6) % 4",
            "equation": "(5 % 6) % 4",
            "sortableEquation": "0001 Z X5 % 6Y % 4"
          },
          {
            "total": 1,
            "fullEquation": "1 = (5 % 6) - 4",
            "equation": "(5 % 6) - 4",
            "sortableEquation": "0001 Z X5 % 6Y - 4"
          },
          {
            "total": 1,
            "fullEquation": "1 = (5 - 4) % 6",
            "equation": "(5 - 4) % 6",
            "sortableEquation": "0001 Z X5 - 4Y % 6"
          },
          {
            "total": 1,
            "fullEquation": "1 = (5 - 4) ^ 6",
            "equation": "(5 - 4) ^ 6",
            "sortableEquation": "0001 Z X5 - 4Y ^ 6"
          },
          {
            "total": 1,
            "fullEquation": "1 = (5 - 6) ^ 4",
            "equation": "(5 - 6) ^ 4",
            "sortableEquation": "0001 Z X5 - 6Y ^ 4"
          },
          {
            "total": 1,
            "fullEquation": "1 = (6 % 5) % 4",
            "equation": "(6 % 5) % 4",
            "sortableEquation": "0001 Z X6 % 5Y % 4"
          },
          {
            "total": 1,
            "fullEquation": "1 = (6 % 5) ^ 4",
            "equation": "(6 % 5) ^ 4",
            "sortableEquation": "0001 Z X6 % 5Y ^ 4"
          },
          {
            "total": 1,
            "fullEquation": "1 = (6 - 5) % 4",
            "equation": "(6 - 5) % 4",
            "sortableEquation": "0001 Z X6 - 5Y % 4"
          },
          {
            "total": 1,
            "fullEquation": "1 = (6 - 5) ^ 4",
            "equation": "(6 - 5) ^ 4",
            "sortableEquation": "0001 Z X6 - 5Y ^ 4"
          },
          {
            "total": 1,
            "fullEquation": "1 = root((5 % 4))(6)",
            "equation": "root((5 % 4))(6)",
            "sortableEquation": "0001 Z rootXX5 % 4YYX6Y"
          },
          {
            "total": 1,
            "fullEquation": "1 = root((5 - 4))(6)",
            "equation": "root((5 - 4))(6)",
            "sortableEquation": "0001 Z rootXX5 - 4YYX6Y"
          },
          {
            "total": 1,
            "fullEquation": "1 = root((6 % 5))(4)",
            "equation": "root((6 % 5))(4)",
            "sortableEquation": "0001 Z rootXX6 % 5YYX4Y"
          },
          {
            "total": 1,
            "fullEquation": "1 = root((6 - 5))(4)",
            "equation": "root((6 - 5))(4)",
            "sortableEquation": "0001 Z rootXX6 - 5YYX4Y"
          },
          {
            "total": 2,
            "fullEquation": "2 = 6 % (4 % 5)",
            "equation": "6 % (4 % 5)",
            "sortableEquation": "0002 Z 6 % X4 % 5Y"
          },
          {
            "total": 2,
            "fullEquation": "2 = 6 - (4 % 5)",
            "equation": "6 - (4 % 5)",
            "sortableEquation": "0002 Z 6 - X4 % 5Y"
          },
          {
            "total": 2,
            "fullEquation": "2 = (4 * 5) % 6",
            "equation": "(4 * 5) % 6",
            "sortableEquation": "0002 Z X4 * 5Y % 6"
          },
          {
            "total": 2,
            "fullEquation": "2 = (4 + 6) / 5",
            "equation": "(4 + 6) / 5",
            "sortableEquation": "0002 Z X4 + 6Y / 5"
          },
          {
            "total": 2,
            "fullEquation": "2 = (5 * 6) % 4",
            "equation": "(5 * 6) % 4",
            "sortableEquation": "0002 Z X5 * 6Y % 4"
          },
          {
            "total": 2,
            "fullEquation": "2 = (6 % 4) % 5",
            "equation": "(6 % 4) % 5",
            "sortableEquation": "0002 Z X6 % 4Y % 5"
          },
          {
            "total": 2,
            "fullEquation": "2 = (6 - 4) % 5",
            "equation": "(6 - 4) % 5",
            "sortableEquation": "0002 Z X6 - 4Y % 5"
          },
          {
            "total": 3,
            "fullEquation": "3 = 4 + (5 - 6)",
            "equation": "4 + (5 - 6)",
            "sortableEquation": "0003 Z 4 + X5 - 6Y"
          },
          {
            "total": 3,
            "fullEquation": "3 = 4 - (6 % 5)",
            "equation": "4 - (6 % 5)",
            "sortableEquation": "0003 Z 4 - X6 % 5Y"
          },
          {
            "total": 3,
            "fullEquation": "3 = 4 - (6 - 5)",
            "equation": "4 - (6 - 5)",
            "sortableEquation": "0003 Z 4 - X6 - 5Y"
          },
          {
            "total": 3,
            "fullEquation": "3 = 5 + (4 - 6)",
            "equation": "5 + (4 - 6)",
            "sortableEquation": "0003 Z 5 + X4 - 6Y"
          },
          {
            "total": 3,
            "fullEquation": "3 = 5 - (6 % 4)",
            "equation": "5 - (6 % 4)",
            "sortableEquation": "0003 Z 5 - X6 % 4Y"
          },
          {
            "total": 3,
            "fullEquation": "3 = 5 - (6 - 4)",
            "equation": "5 - (6 - 4)",
            "sortableEquation": "0003 Z 5 - X6 - 4Y"
          },
          {
            "total": 3,
            "fullEquation": "3 = (4 + 5) % 6",
            "equation": "(4 + 5) % 6",
            "sortableEquation": "0003 Z X4 + 5Y % 6"
          },
          {
            "total": 3,
            "fullEquation": "3 = (4 + 5) - 6",
            "equation": "(4 + 5) - 6",
            "sortableEquation": "0003 Z X4 + 5Y - 6"
          },
          {
            "total": 3,
            "fullEquation": "3 = (5 + 6) % 4",
            "equation": "(5 + 6) % 4",
            "sortableEquation": "0003 Z X5 + 6Y % 4"
          },
          {
            "total": 4,
            "fullEquation": "4 = 4 % 5 ^ 6",
            "equation": "4 % 5 ^ 6",
            "sortableEquation": "0004 Z 4 % 5 ^ 6"
          },
          {
            "total": 4,
            "fullEquation": "4 = 4 % 6 ^ 5",
            "equation": "4 % 6 ^ 5",
            "sortableEquation": "0004 Z 4 % 6 ^ 5"
          },
          {
            "total": 4,
            "fullEquation": "4 = 4 % (5 % 6)",
            "equation": "4 % (5 % 6)",
            "sortableEquation": "0004 Z 4 % X5 % 6Y"
          },
          {
            "total": 4,
            "fullEquation": "4 = 4 % (5 * 6)",
            "equation": "4 % (5 * 6)",
            "sortableEquation": "0004 Z 4 % X5 * 6Y"
          },
          {
            "total": 4,
            "fullEquation": "4 = 4 % (5 + 6)",
            "equation": "4 % (5 + 6)",
            "sortableEquation": "0004 Z 4 % X5 + 6Y"
          },
          {
            "total": 4,
            "fullEquation": "4 = 4 * (6 % 5)",
            "equation": "4 * (6 % 5)",
            "sortableEquation": "0004 Z 4 * X6 % 5Y"
          },
          {
            "total": 4,
            "fullEquation": "4 = 4 * (6 - 5)",
            "equation": "4 * (6 - 5)",
            "sortableEquation": "0004 Z 4 * X6 - 5Y"
          },
          {
            "total": 4,
            "fullEquation": "4 = 4 / (6 % 5)",
            "equation": "4 / (6 % 5)",
            "sortableEquation": "0004 Z 4 / X6 % 5Y"
          },
          {
            "total": 4,
            "fullEquation": "4 = 4 / (6 - 5)",
            "equation": "4 / (6 - 5)",
            "sortableEquation": "0004 Z 4 / X6 - 5Y"
          },
          {
            "total": 4,
            "fullEquation": "4 = 4 ^ 5 % 6",
            "equation": "4 ^ 5 % 6",
            "sortableEquation": "0004 Z 4 ^ 5 % 6"
          },
          {
            "total": 4,
            "fullEquation": "4 = 4 ^ (6 % 5)",
            "equation": "4 ^ (6 % 5)",
            "sortableEquation": "0004 Z 4 ^ X6 % 5Y"
          },
          {
            "total": 4,
            "fullEquation": "4 = 4 ^ (6 - 5)",
            "equation": "4 ^ (6 - 5)",
            "sortableEquation": "0004 Z 4 ^ X6 - 5Y"
          },
          {
            "total": 4,
            "fullEquation": "4 = (4 % 5) % 6",
            "equation": "(4 % 5) % 6",
            "sortableEquation": "0004 Z X4 % 5Y % 6"
          },
          {
            "total": 4,
            "fullEquation": "4 = (4 % 6) % 5",
            "equation": "(4 % 6) % 5",
            "sortableEquation": "0004 Z X4 % 6Y % 5"
          },
          {
            "total": 4,
            "fullEquation": "4 = (4 * 6) % 5",
            "equation": "(4 * 6) % 5",
            "sortableEquation": "0004 Z X4 * 6Y % 5"
          },
          {
            "total": 4,
            "fullEquation": "4 = root(4)((6 % 5))",
            "equation": "root(4)((6 % 5))",
            "sortableEquation": "0004 Z rootX4YXX6 % 5YY"
          },
          {
            "total": 4,
            "fullEquation": "4 = root(4)((6 - 5))",
            "equation": "root(4)((6 - 5))",
            "sortableEquation": "0004 Z rootX4YXX6 - 5YY"
          },
          {
            "total": 5,
            "fullEquation": "5 = 4 + (6 % 5)",
            "equation": "4 + (6 % 5)",
            "sortableEquation": "0005 Z 4 + X6 % 5Y"
          },
          {
            "total": 5,
            "fullEquation": "5 = 4 + (6 - 5)",
            "equation": "4 + (6 - 5)",
            "sortableEquation": "0005 Z 4 + X6 - 5Y"
          },
          {
            "total": 5,
            "fullEquation": "5 = 4 - (5 - 6)",
            "equation": "4 - (5 - 6)",
            "sortableEquation": "0005 Z 4 - X5 - 6Y"
          },
          {
            "total": 5,
            "fullEquation": "5 = 5 % 4 ^ 6",
            "equation": "5 % 4 ^ 6",
            "sortableEquation": "0005 Z 5 % 4 ^ 6"
          },
          {
            "total": 5,
            "fullEquation": "5 = 5 % 6 ^ 4",
            "equation": "5 % 6 ^ 4",
            "sortableEquation": "0005 Z 5 % 6 ^ 4"
          },
          {
            "total": 5,
            "fullEquation": "5 = 5 % (4 * 6)",
            "equation": "5 % (4 * 6)",
            "sortableEquation": "0005 Z 5 % X4 * 6Y"
          },
          {
            "total": 5,
            "fullEquation": "5 = 5 % (4 + 6)",
            "equation": "5 % (4 + 6)",
            "sortableEquation": "0005 Z 5 % X4 + 6Y"
          },
          {
            "total": 5,
            "fullEquation": "5 = 6 + (4 - 5)",
            "equation": "6 + (4 - 5)",
            "sortableEquation": "0005 Z 6 + X4 - 5Y"
          },
          {
            "total": 5,
            "fullEquation": "5 = 6 - (5 % 4)",
            "equation": "6 - (5 % 4)",
            "sortableEquation": "0005 Z 6 - X5 % 4Y"
          },
          {
            "total": 5,
            "fullEquation": "5 = 6 - (5 - 4)",
            "equation": "6 - (5 - 4)",
            "sortableEquation": "0005 Z 6 - X5 - 4Y"
          },
          {
            "total": 5,
            "fullEquation": "5 = (4 + 6) - 5",
            "equation": "(4 + 6) - 5",
            "sortableEquation": "0005 Z X4 + 6Y - 5"
          },
          {
            "total": 6,
            "fullEquation": "6 = 6 % 4 ^ 5",
            "equation": "6 % 4 ^ 5",
            "sortableEquation": "0006 Z 6 % 4 ^ 5"
          },
          {
            "total": 6,
            "fullEquation": "6 = 6 % 5 ^ 4",
            "equation": "6 % 5 ^ 4",
            "sortableEquation": "0006 Z 6 % 5 ^ 4"
          },
          {
            "total": 6,
            "fullEquation": "6 = 6 % (4 * 5)",
            "equation": "6 % (4 * 5)",
            "sortableEquation": "0006 Z 6 % X4 * 5Y"
          },
          {
            "total": 6,
            "fullEquation": "6 = 6 % (4 + 5)",
            "equation": "6 % (4 + 5)",
            "sortableEquation": "0006 Z 6 % X4 + 5Y"
          },
          {
            "total": 6,
            "fullEquation": "6 = 6 * (5 % 4)",
            "equation": "6 * (5 % 4)",
            "sortableEquation": "0006 Z 6 * X5 % 4Y"
          },
          {
            "total": 6,
            "fullEquation": "6 = 6 * (5 - 4)",
            "equation": "6 * (5 - 4)",
            "sortableEquation": "0006 Z 6 * X5 - 4Y"
          },
          {
            "total": 6,
            "fullEquation": "6 = 6 / (5 % 4)",
            "equation": "6 / (5 % 4)",
            "sortableEquation": "0006 Z 6 / X5 % 4Y"
          },
          {
            "total": 6,
            "fullEquation": "6 = 6 / (5 - 4)",
            "equation": "6 / (5 - 4)",
            "sortableEquation": "0006 Z 6 / X5 - 4Y"
          },
          {
            "total": 6,
            "fullEquation": "6 = 6 ^ (5 % 4)",
            "equation": "6 ^ (5 % 4)",
            "sortableEquation": "0006 Z 6 ^ X5 % 4Y"
          },
          {
            "total": 6,
            "fullEquation": "6 = 6 ^ (5 - 4)",
            "equation": "6 ^ (5 - 4)",
            "sortableEquation": "0006 Z 6 ^ X5 - 4Y"
          },
          {
            "total": 6,
            "fullEquation": "6 = root(6)((5 % 4))",
            "equation": "root(6)((5 % 4))",
            "sortableEquation": "0006 Z rootX6YXX5 % 4YY"
          },
          {
            "total": 6,
            "fullEquation": "6 = root(6)((5 - 4))",
            "equation": "root(6)((5 - 4))",
            "sortableEquation": "0006 Z rootX6YXX5 - 4YY"
          },
          {
            "total": 7,
            "fullEquation": "7 = 5 + (6 % 4)",
            "equation": "5 + (6 % 4)",
            "sortableEquation": "0007 Z 5 + X6 % 4Y"
          },
          {
            "total": 7,
            "fullEquation": "7 = 5 + (6 - 4)",
            "equation": "5 + (6 - 4)",
            "sortableEquation": "0007 Z 5 + X6 - 4Y"
          },
          {
            "total": 7,
            "fullEquation": "7 = 5 - (4 - 6)",
            "equation": "5 - (4 - 6)",
            "sortableEquation": "0007 Z 5 - X4 - 6Y"
          },
          {
            "total": 7,
            "fullEquation": "7 = 6 + (5 % 4)",
            "equation": "6 + (5 % 4)",
            "sortableEquation": "0007 Z 6 + X5 % 4Y"
          },
          {
            "total": 7,
            "fullEquation": "7 = 6 + (5 - 4)",
            "equation": "6 + (5 - 4)",
            "sortableEquation": "0007 Z 6 + X5 - 4Y"
          },
          {
            "total": 7,
            "fullEquation": "7 = 6 - (4 - 5)",
            "equation": "6 - (4 - 5)",
            "sortableEquation": "0007 Z 6 - X4 - 5Y"
          },
          {
            "total": 7,
            "fullEquation": "7 = (5 + 6) - 4",
            "equation": "(5 + 6) - 4",
            "sortableEquation": "0007 Z X5 + 6Y - 4"
          },
          {
            "total": 9,
            "fullEquation": "9 = 4 + (5 % 6)",
            "equation": "4 + (5 % 6)",
            "sortableEquation": "0009 Z 4 + X5 % 6Y"
          },
          {
            "total": 9,
            "fullEquation": "9 = 5 + (4 % 6)",
            "equation": "5 + (4 % 6)",
            "sortableEquation": "0009 Z 5 + X4 % 6Y"
          },
          {
            "total": 10,
            "fullEquation": "10 = 5 * (6 % 4)",
            "equation": "5 * (6 % 4)",
            "sortableEquation": "0010 Z 5 * X6 % 4Y"
          },
          {
            "total": 10,
            "fullEquation": "10 = 5 * (6 - 4)",
            "equation": "5 * (6 - 4)",
            "sortableEquation": "0010 Z 5 * X6 - 4Y"
          },
          {
            "total": 10,
            "fullEquation": "10 = 6 + (4 % 5)",
            "equation": "6 + (4 % 5)",
            "sortableEquation": "0010 Z 6 + X4 % 5Y"
          },
          {
            "total": 14,
            "fullEquation": "14 = (4 * 5) - 6",
            "equation": "(4 * 5) - 6",
            "sortableEquation": "0014 Z X4 * 5Y - 6"
          },
          {
            "total": 15,
            "fullEquation": "15 = 4 + (5 + 6)",
            "equation": "4 + (5 + 6)",
            "sortableEquation": "0015 Z 4 + X5 + 6Y"
          },
          {
            "total": 15,
            "fullEquation": "15 = 5 + (4 + 6)",
            "equation": "5 + (4 + 6)",
            "sortableEquation": "0015 Z 5 + X4 + 6Y"
          },
          {
            "total": 15,
            "fullEquation": "15 = 6 + (4 + 5)",
            "equation": "6 + (4 + 5)",
            "sortableEquation": "0015 Z 6 + X4 + 5Y"
          },
          {
            "total": 19,
            "fullEquation": "19 = (4 * 6) - 5",
            "equation": "(4 * 6) - 5",
            "sortableEquation": "0019 Z X4 * 6Y - 5"
          },
          {
            "total": 20,
            "fullEquation": "20 = 4 * (5 % 6)",
            "equation": "4 * (5 % 6)",
            "sortableEquation": "0020 Z 4 * X5 % 6Y"
          },
          {
            "total": 20,
            "fullEquation": "20 = 5 * (4 % 6)",
            "equation": "5 * (4 % 6)",
            "sortableEquation": "0020 Z 5 * X4 % 6Y"
          },
          {
            "total": 24,
            "fullEquation": "24 = 6 * (4 % 5)",
            "equation": "6 * (4 % 5)",
            "sortableEquation": "0024 Z 6 * X4 % 5Y"
          },
          {
            "total": 25,
            "fullEquation": "25 = 5 ^ (6 % 4)",
            "equation": "5 ^ (6 % 4)",
            "sortableEquation": "0025 Z 5 ^ X6 % 4Y"
          },
          {
            "total": 25,
            "fullEquation": "25 = 5 ^ (6 - 4)",
            "equation": "5 ^ (6 - 4)",
            "sortableEquation": "0025 Z 5 ^ X6 - 4Y"
          },
          {
            "total": 26,
            "fullEquation": "26 = 6 + (4 * 5)",
            "equation": "6 + (4 * 5)",
            "sortableEquation": "0026 Z 6 + X4 * 5Y"
          },
          {
            "total": 26,
            "fullEquation": "26 = (5 * 6) - 4",
            "equation": "(5 * 6) - 4",
            "sortableEquation": "0026 Z X5 * 6Y - 4"
          },
          {
            "total": 29,
            "fullEquation": "29 = 5 + (4 * 6)",
            "equation": "5 + (4 * 6)",
            "sortableEquation": "0029 Z 5 + X4 * 6Y"
          },
          {
            "total": 32,
            "fullEquation": "32 = (6 % 4) ^ 5",
            "equation": "(6 % 4) ^ 5",
            "sortableEquation": "0032 Z X6 % 4Y ^ 5"
          },
          {
            "total": 32,
            "fullEquation": "32 = (6 - 4) ^ 5",
            "equation": "(6 - 4) ^ 5",
            "sortableEquation": "0032 Z X6 - 4Y ^ 5"
          },
          {
            "total": 34,
            "fullEquation": "34 = 4 + (5 * 6)",
            "equation": "4 + (5 * 6)",
            "sortableEquation": "0034 Z 4 + X5 * 6Y"
          }
        ]
    `)
    );
  });
});
