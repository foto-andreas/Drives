import 'zone.js';
import 'zone.js/testing';
import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { provideRouter } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BreakpointObserver } from '@angular/cdk/layout';
import { signal } from '@angular/core';
import { UserService } from './user-service';
import { InitializationService } from './initialization-service';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App, HttpClientTestingModule],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const titleEl = compiled.querySelector('.title');
    expect(titleEl).toBeTruthy();
    expect(titleEl?.textContent?.trim()).toBe('Fahrtenbuch');
  });
});

describe('App initialization', () => {
  it('should show snackbar when initialization is reported', async () => {
    const snackBarMock = { open: vi.fn() };
    const userServiceMock = { name: signal<string | null>(null), load: vi.fn() };
    const initializationServiceMock = { getStatus: vi.fn().mockReturnValue(of({ initialized: true })) };
    const breakpointObserverMock = { observe: vi.fn().mockReturnValue(of({ matches: true })) };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([])
      ]
    }).overrideComponent(App, {
      add: {
        providers: [
          { provide: MatSnackBar, useValue: snackBarMock },
          { provide: UserService, useValue: userServiceMock },
          { provide: InitializationService, useValue: initializationServiceMock },
          { provide: BreakpointObserver, useValue: breakpointObserverMock }
        ]
      }
    }).compileComponents();

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(snackBarMock.open).toHaveBeenCalledWith('Datenbank wurde initialisiert', 'Schließen', expect.anything());
    expect((fixture.componentInstance as any).isMobile()).toBe(true);
  });

  it('should handle initialization errors without snackbar', async () => {
    const snackBarMock = { open: vi.fn() };
    const userServiceMock = { name: signal<string | null>(null), load: vi.fn() };
    const initializationServiceMock = { getStatus: vi.fn().mockReturnValue(throwError(() => new Error('boom'))) };
    const breakpointObserverMock = { observe: vi.fn().mockReturnValue(of({ matches: false })) };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([])
      ]
    }).overrideComponent(App, {
      add: {
        providers: [
          { provide: MatSnackBar, useValue: snackBarMock },
          { provide: UserService, useValue: userServiceMock },
          { provide: InitializationService, useValue: initializationServiceMock },
          { provide: BreakpointObserver, useValue: breakpointObserverMock }
        ]
      }
    }).compileComponents();

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    expect(snackBarMock.open).not.toHaveBeenCalled();
  });
});
