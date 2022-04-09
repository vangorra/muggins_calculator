import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MathJaxService {
  public readonly initialized = new BehaviorSubject(false);

  private initializeCheckInterval?: number;

  public startPoll() {
    this.initializeCheckInterval = setInterval(() => {
      if (!!MathJax.typeset) {
        this.stopPoll();
        this.initialized.next(true);
      }
    }, 100);
  }

  public stopPoll() {
    if (!!this.initializeCheckInterval) {
      clearInterval(this.initializeCheckInterval);
    }
  }
}
