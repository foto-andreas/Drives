import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors, HttpErrorResponse } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
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

  it('should show snackbar on 400 error with message from body', () => {
    const errorBody = {
      status: 400,
      message: 'fromLocation: From location is required, toLocation: To location is required',
      path: '/api/driveTemplates',
      timestamp: '2026-02-10T18:19:57.211397+01:00'
    };

    httpClient.get('/api/test').subscribe({
      next: () => {},
      error: (error: HttpErrorResponse) => {
        expect(error.status).toBe(400);
      }
    });

    const req = httpTestingController.expectOne('/api/test');
    req.flush(errorBody, { status: 400, statusText: 'Bad Request' });

    expect(lastOpenArgs).not.toBeNull();
    expect(lastOpenArgs?.[0]).toBe('Fehler 400: fromLocation: From location is required, toLocation: To location is required');
    expect(lastOpenArgs?.[1]).toBe('Schließen');
    expect(lastOpenArgs?.[2]).toMatchObject({ duration: 4000, panelClass: ['error-snackbar'] });
  });

  it('should show snackbar on 500 error', () => {
    httpClient.get('/api/test').subscribe({
      next: () => {},
      error: (error: HttpErrorResponse) => {
        expect(error.status).toBe(500);
      }
    });

    const req = httpTestingController.expectOne('/api/test');
    req.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });

    expect(lastOpenArgs).not.toBeNull();
    expect(String(lastOpenArgs?.[0] ?? '')).toMatch(/Fehler 500:/);
    expect(lastOpenArgs?.[1]).toBe('Schließen');
  });
});
