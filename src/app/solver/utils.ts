import {
  CalculateResult,
  MugginsSolver,
  MugginsSolverConfig,
  OperationEnum,
  OPERATIONS_MAP,
} from './solver';
import * as wasmModuleImport from "../../../solver_rust_wasm/pkg/solver_rust_wasm";

export interface SolverWorkerMessage
  extends Omit<MugginsSolverConfig, 'operations'> {
  readonly operations: OperationEnum[];
}

export interface SolverWorkerResponse {
  readonly data: CalculateResult[];
}

let wasmModule: typeof wasmModuleImport;

async function getWasmModule(): Promise<typeof wasmModuleImport> {
  if (!wasmModule) {
    wasmModule = await import("../../../solver_rust_wasm/pkg");
  }

  return wasmModule
}

/* eslint-disable import/prefer-default-export */
export function runSolverWorkerMain(
  solverWorkerMessage: SolverWorkerMessage,
  callback: (response: SolverWorkerResponse) => void
): void {
  const useWasm = (solverWorkerMessage as any).useWasm || false;
  const startTime = new Date().getTime();

  if (useWasm) {
    getWasmModule()
      .then((mod) => {
        const results = mod.calculate_results({
          minTotal: solverWorkerMessage.minTotal,
          maxTotal: solverWorkerMessage.maxTotal,
          faces: solverWorkerMessage.faces,
          operation_ids: solverWorkerMessage.operations,
        });
        console.log("useWasm", true, new Date().getTime() - startTime, "ms");
        return results;
      })
      .then((results) => callback({
        data: results,
      }));
  } else {
    const solver = new MugginsSolver({
      ...solverWorkerMessage,
      operations: solverWorkerMessage.operations.map(
        (operation) => OPERATIONS_MAP[operation]
      ),
    });

    const results = solver.calculateSolutions();
    console.log("useWasm", false, new Date().getTime() - startTime, "ms");
    callback({
      data: results,
    });
  }
}
