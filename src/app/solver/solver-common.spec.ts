import {
  getCalculateComplexity,
  MergeSort,
  OperationEnum,
} from './solver-common';

describe('solver-common', () => {
  describe(MergeSort.name, () => {
    const numerCompare = (a: number, b: number) => {
      if (a < b) {
        return -1;
      }

      if (a > b) {
        return 1;
      }

      return 0;
    };

    test(`${MergeSort.merge.name}() empty array`, () => {
      const source: any[] = [];
      expect(
        MergeSort.merge(source, {
          compare: numerCompare,
          unique: true,
        })
      ).toStrictEqual(source);
    });

    test(`${MergeSort.merge.name}() unique=true`, () => {
      expect(
        MergeSort.merge(
          [
            [1, 4, 5, 7],
            [2, 3, 5, 9, 12],
            [1, 2, 3, 4, 6, 9],
          ],
          {
            compare: numerCompare,
            unique: true,
          }
        )
      ).toEqual([1, 2, 3, 4, 5, 6, 7, 9, 12]);
    });

    test(`${MergeSort.sort.name} unique=true`, () => {
      expect(
        MergeSort.sort([9, 1, 8, 7, 6, 5, 4, 8, 3, 2, 1], {
          compare: numerCompare,
          unique: true,
        })
      ).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    test(`${MergeSort.sort.name} unique=false`, () => {
      expect(
        MergeSort.sort([9, 1, 8, 7, 6, 5, 4, 8, 3, 2, 1], {
          compare: numerCompare,
          unique: false,
        })
      ).toEqual([1, 1, 2, 3, 4, 5, 6, 7, 8, 8, 9]);
    });
  });

  test(getCalculateComplexity.name, () => {
    expect(
      getCalculateComplexity({
        faces: [2, 3, 4],
        operations: [
          OperationEnum.PLUS,
          OperationEnum.MINUS,
          OperationEnum.MULTIPLY,
          OperationEnum.DIVIDE,
          OperationEnum.MINUS,
        ],
        minTotal: 1,
        maxTotal: 36,
      })
    ).toEqual(900);

    expect(
      getCalculateComplexity({
        faces: [2, 3, 4, 5, 6],
        operations: [
          OperationEnum.PLUS,
          OperationEnum.MINUS,
          OperationEnum.MULTIPLY,
          OperationEnum.DIVIDE,
          OperationEnum.POWER,
          OperationEnum.POWER,
          OperationEnum.MODULO,
        ],
        minTotal: 1,
        maxTotal: 36,
      })
    ).toEqual(705600);
  });
});
