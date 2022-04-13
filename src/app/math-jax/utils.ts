import { Injectable } from '@angular/core';

export const enum MathJaxOutputLoaderEnum {
  svg = 'output/svg',
}

export const enum MathJaxInputLoaderEnum {
  asciimath = 'input/asciimath',
}

export interface MathJaxConfigBase {
  readonly inputLoader: MathJaxInputLoaderEnum;
  readonly outputLoader: MathJaxOutputLoaderEnum;
}

@Injectable({
  providedIn: 'root',
})
export class MathJaxConfig implements MathJaxConfigBase {
  readonly inputLoader: MathJaxInputLoaderEnum =
    MathJaxInputLoaderEnum.asciimath;

  readonly outputLoader: MathJaxOutputLoaderEnum = MathJaxOutputLoaderEnum.svg;
}
