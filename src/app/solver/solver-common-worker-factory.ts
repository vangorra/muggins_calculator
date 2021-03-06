/*
import.meta use ES6 to resolve URLs. Jest doesn't handle this well, so we place the URL in its own file and have
jest use a mock (located in __mocks__) and load the mock globally in setup-jest.ts. This entirely avoids the use
of this file during unit testing.
 */
export const solverCommonWorkerFactory = () =>
  new Worker(new URL('./solver-common.worker', import.meta.url));
