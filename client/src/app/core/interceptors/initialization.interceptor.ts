import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { tap } from 'rxjs';

const INITIALIZED_HEADER = 'X-Db-Initialized';

export const initializationInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    tap((event) => {
      if (event instanceof HttpResponse) {
        const initialized = event.headers.get(INITIALIZED_HEADER) === 'true';
        if (initialized) {
          snackBar.open('Datenbank wurde initialisiert', 'Schließen', {
            duration: 4000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            panelClass: ['success-snackbar']
          });
        }
      }
    })
  );
};
