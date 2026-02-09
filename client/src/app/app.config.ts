import { ApplicationConfig, provideBrowserGlobalErrorListeners, LOCALE_ID } from '@angular/core';
import {provideRouter, withHashLocation} from '@angular/router';
import {provideHttpClient} from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import { MAT_DATE_LOCALE, MAT_DATE_FORMATS } from '@angular/material/core';
import {provideLuxonDateAdapter} from '@angular/material-luxon-adapter';

import { routes } from './app.routes';

registerLocaleData(localeDe);

export const MY_DATE_FORMATS = {
  parse: {
    dateInput: 'DD.MM.YYYY',
  },
  display: {
    dateInput: 'DD.MM.YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withHashLocation()),
    provideHttpClient(),
    { provide: LOCALE_ID, useValue: 'de-DE' },
    { provide: MAT_DATE_LOCALE, useValue: 'de-DE' },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
    provideLuxonDateAdapter(MY_DATE_FORMATS)
  ]
};
