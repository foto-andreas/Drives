import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpHeaders, HttpEventType, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { initializationInterceptor } from './initialization.interceptor';

describe('initializationInterceptor', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let lastOpenArgs: any[] | null;

  beforeEach(() => {
    lastOpenArgs = null;

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([initializationInterceptor])),
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

  it('should show snackbar when initialization header is true', () => {
    httpClient.get('/api/test').subscribe();

    const req = httpTestingController.expectOne('/api/test');
    req.flush({}, { headers: new HttpHeaders({ 'X-Db-Initialized': 'true' }) });

    expect(lastOpenArgs).not.toBeNull();
    expect(lastOpenArgs?.[0]).toBe('Datenbank wurde initialisiert');
    expect(lastOpenArgs?.[1]).toBe('Schließen');
  });

  it('should ignore non-response events and false headers', () => {
    httpClient.get('/api/test', { observe: 'events', reportProgress: true }).subscribe();

    const req = httpTestingController.expectOne('/api/test');
    req.event({ type: HttpEventType.Sent });
    req.flush({}, { headers: new HttpHeaders({ 'X-Db-Initialized': 'false' }) });

    expect(lastOpenArgs).toBeNull();
  });
});
