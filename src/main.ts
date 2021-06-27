import {enableProdMode} from '@angular/core';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

import AppModule from "./app/app.module";
import environment from "./environments/environment";
import "rxjs/add/operator/takeUntil";

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  /* eslint-disable no-console */
  .catch(err => console.error(err));
