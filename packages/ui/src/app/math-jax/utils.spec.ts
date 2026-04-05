import { MathJaxConfig, MathJaxInputLoaderEnum, MathJaxOutputLoaderEnum } from './utils';

describe(MathJaxConfig.name, () => {
  it('has default inputLoader and outputLoader', () => {
    const config = new MathJaxConfig();
    expect(config.inputLoader).toEqual(MathJaxInputLoaderEnum.asciimath);
    expect(config.outputLoader).toEqual(MathJaxOutputLoaderEnum.svg);
  });
});
