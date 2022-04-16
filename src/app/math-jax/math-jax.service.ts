import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MathJaxConfig, MathJaxOutputLoaderEnum } from './utils';

export const enum MathJaxState {
  none = 'none',
  loadingAssets = 'loadingAssets',
  initializing = 'initializing',
  initialized = 'initialized',
}

@Injectable({
  providedIn: 'root',
})
export class MathJaxService implements OnDestroy {
  static readonly POLL_INTERVAL = 100;

  static readonly SCRIPT_ID = 'mathJaxScript';

  static readonly NOOP_RENDER_FUNCTION = (text: string) => {
    const span = document.createElement('span');
    span.textContent = text;
    return span;
  };

  public readonly state = new BehaviorSubject<MathJaxState>(MathJaxState.none);

  initializeCheckInterval?: any;

  constructor(private readonly config: MathJaxConfig) {}

  public getRenderFunction(): (text: string) => Element {
    switch (this.config.outputLoader) {
      case MathJaxOutputLoaderEnum.svg:
        return MathJax.asciimath2svg;
      default:
        return MathJaxService.NOOP_RENDER_FUNCTION;
    }
  }

  public start() {
    // Skip if the script is already loaded.
    if (document.getElementById(MathJaxService.SCRIPT_ID)) {
      this.startPollForInitialized();
      return;
    }

    this.state.next(MathJaxState.loadingAssets);

    // Set the global configuration.
    window.MathJax = {
      loader: {
        load: [this.config.inputLoader, this.config.outputLoader],
      },
      svg: { fontCache: 'global' },
      processHtmlClass: 'mathjax_process',
    } as any;

    // Load the script.
    const scriptNode = document.createElement('script');
    scriptNode.id = MathJaxService.SCRIPT_ID;
    scriptNode.type = 'text/javascript';
    scriptNode.src = './mathjax/es5/startup.js';
    scriptNode.onload = () => this.startPollForInitialized();
    document.body.append(scriptNode);
  }

  private pollForInitialized() {
    if (!!window?.MathJax && !!window?.MathJax.typeset) {
      this.stopPollForInitialized();
      this.state.next(MathJaxState.initialized);
      return true;
    }

    return false;
  }

  startPollForInitialized() {
    if (this.pollForInitialized()) {
      return;
    }

    this.state.next(MathJaxState.initializing);
    this.initializeCheckInterval = setInterval(
      () => this.pollForInitialized(),
      MathJaxService.POLL_INTERVAL
    );
  }

  private stopPollForInitialized() {
    if (!!this.initializeCheckInterval) {
      clearInterval(this.initializeCheckInterval);
      this.initializeCheckInterval = undefined;
    }
  }

  ngOnDestroy(): void {
    this.stopPollForInitialized();
    this.state.next(MathJaxState.none);
  }
}
