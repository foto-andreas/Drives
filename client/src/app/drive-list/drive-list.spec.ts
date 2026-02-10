import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DriveList } from './drive-list';
import { DriveService } from '../drive-service';
import { HttpErrorResponse } from '@angular/common/http';

import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';

class DriveServiceMock {
  public currentFilter = signal({ year: 2026, month: 2, reason: null });

  delete() {
    const errorBody = {
      status: 500,
      message: 'Interner Fehler beim Löschen',
      path: '/api/drives/1',
      timestamp: '2026-02-10T18:19:57.211397+01:00'
    };
    return throwError(() => new HttpErrorResponse({
      status: 500,
      statusText: 'Internal Server Error',
      error: errorBody,
      url: '/api/drives/1'
    }));
  }
  findAll() { return of([]); }
}

describe('DriveList', () => {
  let lastOpenArgs: any[] | null;

  beforeEach(() => {
    lastOpenArgs = null;
    TestBed.configureTestingModule({
      imports: [DriveList],
      providers: [
        { provide: DriveService, useClass: DriveServiceMock },
        provideRouter([])
      ]
    }).overrideComponent(DriveList, {
      add: {
        providers: [
          { provide: MatSnackBar, useValue: { open: (...args: any[]) => { lastOpenArgs = args; } } }
        ]
      }
    });
  });

  it('soll bei Fehler beim Löschen zusammengefasste Snackbar unten/zentriert anzeigen', async () => {
    vi.stubGlobal('confirm', vi.fn(() => true));
    const fixture = TestBed.createComponent(DriveList);
    const comp = fixture.componentInstance;
    fixture.detectChanges();

    comp['deleteDrive']('1');

    await new Promise(r => setTimeout(r, 150));

    expect(lastOpenArgs).not.toBeNull();
    const text = String(lastOpenArgs?.[0] ?? '');
    expect(text.startsWith('Fehler beim Löschen der Fahrt')).toBe(true);
    expect(text).toContain('Interner Fehler beim Löschen');
    expect(text).toContain('(Status 500)');
    expect(lastOpenArgs?.[1]).toBe('Schließen');
    expect(lastOpenArgs?.[2]).toMatchObject({ horizontalPosition: 'center', verticalPosition: 'bottom' });
    expect(lastOpenArgs?.[2]?.panelClass).toContain('error-snackbar');
    vi.unstubAllGlobals();
  });
});
