import {
  CalculateEquationResult,
  commonWorkerFunctions,
  MugginsSolverCalculateConfig,
  MugginsSolverConfig,
  splitArray,
} from './solver-common';
import {
  emitProgressStatusRoot,
  GenericListener,
  PooledExecutor,
  pooledFunctions,
  PooledWorkerClientFunctionsType,
  ProgressStatus,
} from './worker-utils';
import { solverCalculateWorkerFactory } from './solver-calculate-worker-factory';
import { solverCommonWorkerFactory } from './solver-common-worker-factory';

const localProcessorGenerator = () => new PooledExecutor.LocalProcessor();

const calculateProcessorGenerator = () =>
  new PooledExecutor.WebWorkerProcessor(solverCalculateWorkerFactory);

const commonsProcessorGenerator = () =>
  new PooledExecutor.WebWorkerProcessor(solverCommonWorkerFactory);

function getProcessorGenerator(
  solverConfig: MugginsSolverConfig,
  useCommons: boolean
): () => PooledExecutor.Processor {
  if (!solverConfig.useWorker) {
    return localProcessorGenerator;
  }

  if (useCommons) {
    return commonsProcessorGenerator;
  }

  return calculateProcessorGenerator;
}

/**
 * Main solver that can use web workers to distribute the load of calculating solutions.
 */
export class MugginsSolver {
  private readonly pooledExecutor;

  private readonly pooledCommonWorkerFunctions;

  private readonly arraySplitGroupSize: number;

  private readonly totalSteps: number;

  private readonly currentStatus: ProgressStatus = {
    current: 0,
    total: 0,
  };

  public readonly status = new GenericListener<ProgressStatus>();

  constructor(private readonly solverConfig: MugginsSolverConfig) {
    this.pooledExecutor = new PooledExecutor(
      getProcessorGenerator(solverConfig, true),
      solverConfig.useWorker ? solverConfig.workerCount : 1
    );

    this.pooledCommonWorkerFunctions = pooledFunctions(
      this.pooledExecutor,
      commonWorkerFunctions
    ) as PooledWorkerClientFunctionsType<typeof commonWorkerFunctions>;

    this.arraySplitGroupSize = this.solverConfig.workerCount * 2;
    this.totalSteps = [
      1, // Face and operation permutations.
      this.arraySplitGroupSize, // Calculate face and operation permutations.
      this.arraySplitGroupSize, // Sort/unique raw data.
      1, // Merge/sort data.
    ].reduce((a, b) => a + b);

    this.currentStatus.total = this.totalSteps;
  }

  public async calculate(
    calculateConfig: MugginsSolverCalculateConfig
  ): Promise<CalculateEquationResult[]> {
    if (
      calculateConfig.faces.length < 2 ||
      calculateConfig.operations.length === 0 ||
      calculateConfig.maxTotal < calculateConfig.minTotal
    ) {
      return [];
    }

    // let start = new Date().getTime();

    const [facePairingPermutations, operationPermutations] =
      await this.incrementProgress(
        this.pooledCommonWorkerFunctions.getFaceAndOperationPermutations(
          calculateConfig
        ).data
      );
    // console.debug("permutations", (new Date().getTime() - start), "ms", facePairingPermutations.length);

    const results = await Promise.all(
      splitArray(facePairingPermutations, this.arraySplitGroupSize).map((arr) =>
        this.incrementProgress(
          this.pooledCommonWorkerFunctions.calculateFromFaceAndOperationPermutations(
            calculateConfig,
            arr,
            operationPermutations
          ).data
        )
      )
    );
    // console.debug("initial results", (new Date().getTime() - start), "ms", results.length);

    const sortedResults = await Promise.all(
      splitArray(
        results.flatMap((arr) => arr),
        this.arraySplitGroupSize
      ).map((resultsArr) =>
        this.incrementProgress(
          this.pooledCommonWorkerFunctions.sortCalculateResults(resultsArr).data
        )
      )
    );
    // console.debug("calculated results", (new Date().getTime() - start), "ms", sortedResults.length);

    const finalResults = await this.incrementProgress(
      this.pooledCommonWorkerFunctions.mergeCalculateResultsArrays(
        sortedResults
      ).data
    );
    // console.debug("merged results", (new Date().getTime() - start), "ms", finalResults.length);

    return finalResults;
  }

  private incrementProgress<T extends Promise<any>>(promise: T): T {
    promise.then((v) => {
      this.currentStatus.current += 1;
      this.status.dispatch(this.currentStatus);
      return v;
    });
    return promise;
  }

  public stop() {
    this.pooledExecutor.stopAll();
  }

  private static solver?: MugginsSolver;

  public static stop() {
    MugginsSolver.solver?.stop();
  }

  public static async calculate(
    solverConfig: MugginsSolverConfig,
    calculateConfig: MugginsSolverCalculateConfig
  ): Promise<CalculateEquationResult[]> {
    if (!!MugginsSolver.solver) {
      throw new Error(
        'Processor is already running. Stop it before trying again.'
      );
    }

    const solver = new MugginsSolver(solverConfig);
    solver.status.addListener((status) => {
      emitProgressStatusRoot(status);
    });
    MugginsSolver.solver = new MugginsSolver(solverConfig);

    const result = await solver.calculate(calculateConfig);
    MugginsSolver.solver = undefined;
    return result;
  }
}

export const calculateWorkerFunctions = {
  calculate: MugginsSolver.calculate,
};

/**
 * Wraps MugginsSolver in a webworker. This ensures all the data serialize/deserialize and merging is done on a
 * separate worker. Thus keeping our UI responsive.
 */
export class MugginsSolverOrchestrator {
  private readonly pooledCalculateFunctions;

  public constructor(public readonly solverConfig: MugginsSolverConfig) {
    this.pooledCalculateFunctions = pooledFunctions(
      new PooledExecutor(getProcessorGenerator(solverConfig, false), 1),
      calculateWorkerFunctions
    );
  }

  public calculate(calculateConfig: MugginsSolverCalculateConfig) {
    return this.pooledCalculateFunctions.calculate(
      this.solverConfig,
      calculateConfig
    ) as any as PooledExecutor.WorkHandler<
      CalculateEquationResult[],
      ProgressStatus
    >;
  }
}
