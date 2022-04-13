import { InjectionToken, ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MathJaxConfig,
  MathJaxConfigBase,
  MathJaxInputLoaderEnum,
  MathJaxOutputLoaderEnum,
} from './utils';
import { MathJaxDirective } from './math-jax.directive';

export var FOR_ROOT_OPTIONS_TOKEN = new InjectionToken<MathJaxConfigBase>(
  'forRoot() MathJaxModuleConfiguration'
);

export function provideMathJaxConfig(
  config?: Partial<MathJaxConfigBase>
): MathJaxConfig {
  return {
    inputLoader: config?.inputLoader || MathJaxInputLoaderEnum.asciimath,
    outputLoader: config?.outputLoader || MathJaxOutputLoaderEnum.svg,
  };
}

@NgModule({
  declarations: [MathJaxDirective],
  imports: [CommonModule],
  exports: [MathJaxDirective],
})
export class MathJaxModule {
  public static withConfig(
    config?: Partial<MathJaxConfigBase>
  ): ModuleWithProviders<MathJaxModule> {
    return {
      ngModule: MathJaxModule,
      providers: [
        {
          provide: FOR_ROOT_OPTIONS_TOKEN,
          useValue: config,
        },
        {
          provide: MathJaxConfig,
          useFactory: provideMathJaxConfig,
          deps: [FOR_ROOT_OPTIONS_TOKEN],
        },
      ],
    };
  }
}
