import { runSolverWorkerMain } from './utils';
import { OperationEnum } from './solver';

describe('Solver utils', () => {
  it(runSolverWorkerMain.name, () => {
    const response = runSolverWorkerMain({
      minTotal: 1,
      maxTotal: 36,
      faces: [1, 1, 1],
      operations: [OperationEnum.PLUS],
    });

    expect(response).toEqual(
      JSON.parse(`
      {
        "data": [
          {
            "total": "3",
            "results": [
              {
                "total": 3,
                "fullEquation": "3 = 1 + (1 + 1)",
                "equation": "1 + (1 + 1)",
                "sortableEquation": "3 Z 1 + X1 + 1Y"
              }
            ]
          }
        ]
      }
    `)
    );
  });
});
