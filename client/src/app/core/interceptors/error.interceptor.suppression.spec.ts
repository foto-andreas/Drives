import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpContext, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { errorInterceptor, SUPPRESS_GLOBAL_ERROR_TOAST } from './error.interceptor';

describe('errorInterceptor suppression', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let lastOpenArgs: any[] | null;

  beforeEach(() => {
    lastOpenArgs = null;

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: MatSnackBar, useValue: { open: (...args: any[]) => { lastOpenArgs = args; } } }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('soll keinen globalen Snackbar anzeigen, wenn SUPPRESS_GLOBAL_ERROR_TOAST=true', () => {
    const ctx = new HttpContext().set(SUPPRESS_GLOBAL_ERROR_TOAST, true);

    httpClient.get('/api/test', { context: ctx }).subscribe({
      next: () => {},
      error: (error: HttpErrorResponse) => {
        expect(error.status).toBe(400);
      }
    });

    const req = httpTestingController.expectOne('/api/test');
    req.flush({ message: 'detail' }, { status: 400, statusText: 'Bad Request' });

    expect(lastOpenArgs).toBeNull();
  });
});
