import { HttpErrorResponse, HttpInterceptorFn, HttpContextToken } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

export const SUPPRESS_GLOBAL_ERROR_TOAST = new HttpContextToken<boolean>(() => false);

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notifications = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Ein unbekannter Fehler ist aufgetreten';
      const statusCode = error.status;

      if (error.error && typeof error.error === 'object' && error.error.message) {
        errorMessage = error.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Wenn der Request globale Fehler-Toasts unterdrückt, hier keine Meldung anzeigen
      if (!req.context.get(SUPPRESS_GLOBAL_ERROR_TOAST)) {
        const fullMessage = `Fehler ${statusCode}: ${errorMessage}`;
        notifications.error(fullMessage, 4000);
      }

      return throwError(() => error);
    })
  );
};
