import { bootstrapApplication } from '@angular/platform-browser';
import { LOCALE_ID, isDevMode } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, withHashLocation } from '@angular/router';
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { provideLuxonDateAdapter } from '@angular/material-luxon-adapter';
import { App } from './app/app';
import { routes } from './app/app.routes';
import { MY_DATE_FORMATS } from './app/app.config';
import { errorInterceptor } from './app/core/interceptors/error.interceptor';
import { initializationInterceptor } from './app/core/interceptors/initialization.interceptor';
import { provideServiceWorker } from '@angular/service-worker';

registerLocaleData(localeDe);

bootstrapApplication(App, {
  providers: [
    provideRouter(routes, withHashLocation()),
    provideHttpClient(withInterceptors([initializationInterceptor, errorInterceptor])),
    provideAnimations(),
    { provide: LOCALE_ID, useValue: 'de-DE' },
    { provide: MAT_DATE_LOCALE, useValue: 'de-DE' },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
    provideLuxonDateAdapter(MY_DATE_FORMATS), provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000'
          }),
  ]
}).catch((err) => console.error(err));
