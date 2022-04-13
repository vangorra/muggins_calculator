import { MathJaxModule, provideMathJaxConfig } from './math-jax.module';
import { MathJaxInputLoaderEnum, MathJaxOutputLoaderEnum } from './utils';

describe(MathJaxModule.name, () => {
  it(provideMathJaxConfig.name, () => {
    expect(provideMathJaxConfig()).toEqual({
      inputLoader: MathJaxInputLoaderEnum.asciimath,
      outputLoader: MathJaxOutputLoaderEnum.svg,
    });

    expect(
      provideMathJaxConfig({
        inputLoader: 'AAA' as any,
        outputLoader: 'BBB' as any,
      })
    ).toEqual({
      inputLoader: 'AAA' as any,
      outputLoader: 'BBB' as any,
    });
  });
});
