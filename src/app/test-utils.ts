import { MathJaxService, MathJaxState } from './math-jax/math-jax.service';
import { BehaviorSubject } from 'rxjs';

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
