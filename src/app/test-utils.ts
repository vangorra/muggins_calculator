import { MathJaxService, MathJaxState } from './math-jax/math-jax.service';
import { BehaviorSubject } from 'rxjs';
import { groupBy, range } from 'lodash';

export const newMockMathJaxService = (state: MathJaxState) => {
  return {
    start: () => undefined,
    state: new BehaviorSubject(state),
    getRenderFunction: () => (text: string) => {
      const span = document.createElement('span');
      span.append(`RENDERED ${text} RENDERED`);
      return span;
    },
  };
};

export const mockMathJaxProvider = (state: MathJaxState) => ({
  provide: MathJaxService,
  useValue: newMockMathJaxService(state),
});

export const timeRun = (runs: number, runner: () => void) => {
  const times: number[] = [];
  range(runs).forEach(() => {
    const startTime = new Date().getTime();
    runner();
    times.push(new Date().getTime() - startTime);
  });

  times.sort();

  return {
    sum: times.reduce((a, b) => a + b),
    mean: times.reduce((a, b) => a + b) / runs,
    median: times[Math.round(times.length / 2)],
    mode: Object.values(groupBy(times))
      .reduce((a, b) => (a.length > b.length ? a : b))
      .flatMap((a) => a)
      .reduce((a) => a),
    smallest: times[0],
    largest: times[times.length - 1],
  };
};
