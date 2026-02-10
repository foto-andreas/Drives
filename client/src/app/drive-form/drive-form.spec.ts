import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DriveForm } from './drive-form';
import { DriveService } from '../drive-service';
import { DriveTemplateService } from '../drive-template-service';
import { HttpErrorResponse } from '@angular/common/http';

class DriveServiceMock {
  save() {
    const errorBody = {
      status: 400,
      message: 'fromLocation: From location is required, toLocation: To location is required',
      path: '/api/drives',
      timestamp: '2026-02-10T18:19:57.211397+01:00'
    };
    return throwError(() => new HttpErrorResponse({
      status: 400,
      statusText: 'Bad Request',
      error: errorBody,
      url: '/api/drives'
    }));
  }
  getLatestDriveDate() { return of(null); }
  lastSelectedDate() { return new Date(); }
}

class DriveTemplateServiceMock {
  findAll() { return of([]); }
}

describe('DriveForm', () => {
  let lastOpenArgs: any[] | null;

  beforeEach(() => {
    lastOpenArgs = null;
    TestBed.configureTestingModule({
      imports: [DriveForm],
      providers: [
        { provide: DriveService, useClass: DriveServiceMock },
        { provide: DriveTemplateService, useClass: DriveTemplateServiceMock },
        { provide: MatSnackBar, useValue: { open: (...args: any[]) => { lastOpenArgs = args; } } },
      ]
    });
  });

  it('soll bei Fehler beim Speichern zusammengefasste Snackbar unten/zentriert anzeigen', () => {
    const fixture = TestBed.createComponent(DriveForm);
    const comp = fixture.componentInstance;

    // Formular mit minimal gültigen Werten befüllen
    const form = (comp as any).driveForm as any;
    form.patchValue({
      date: new Date(),
      template: { id: 't1' },
      reason: 'PRIVATE'
    });

    comp.onSubmit();

    expect(lastOpenArgs).not.toBeNull();
    // Textinhalt und Formatierung prüfen
    const text = String(lastOpenArgs?.[0] ?? '');
    expect(text.startsWith('Fehler beim Speichern der Fahrt')).toBe(true);
    expect(text).toContain('fromLocation: From location is required');
    expect(text).toContain('(Status 400)');
    // Positionierung und Klasse
    expect(lastOpenArgs?.[1]).toBe('Schließen');
    expect(lastOpenArgs?.[2]).toMatchObject({ horizontalPosition: 'center', verticalPosition: 'bottom' });
    expect(lastOpenArgs?.[2]?.panelClass).toContain('error-snackbar');
  });
});
