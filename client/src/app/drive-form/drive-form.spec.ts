import { TestBed, ComponentFixture } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DriveForm } from './drive-form';
import { DriveService } from '../drive-service';
import { DriveTemplateService } from '../drive-template-service';
import { HttpErrorResponse } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { signal } from '@angular/core';
import { DriveTemplate } from '../drive-template';
import { Validators } from '@angular/forms';

class DriveServiceMock {
  lastSelectedDate = signal(new Date());
  setLastSelectedDate = vi.fn();
  getLatestDriveDate = vi.fn().mockReturnValue(of(new Date()));
  save = vi.fn().mockReturnValue(of({}));
  get = vi.fn();
}

class DriveTemplateServiceMock {
  findAll = vi.fn().mockReturnValue(of([]));
}

class BreakpointObserverMock {
  observe = vi.fn().mockReturnValue(of({ matches: false }));
}

describe('DriveForm', () => {
  let component: DriveForm;
  let fixture: ComponentFixture<DriveForm>;
  let driveServiceMock: DriveServiceMock;
  let driveTemplateServiceMock: DriveTemplateServiceMock;
  let snackBarMock: { open: any };
  let router: Router;

  beforeEach(async () => {
    driveServiceMock = new DriveServiceMock();
    driveTemplateServiceMock = new DriveTemplateServiceMock();
    snackBarMock = { open: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [DriveForm],
      providers: [
        { provide: DriveService, useValue: driveServiceMock },
        { provide: DriveTemplateService, useValue: driveTemplateServiceMock },
        { provide: BreakpointObserver, useClass: BreakpointObserverMock },
        provideRouter([])
      ]
    }).overrideComponent(DriveForm, {
      add: {
        providers: [
          { provide: MatSnackBar, useValue: snackBarMock }
        ]
      }
    }).compileComponents();

    fixture = TestBed.createComponent(DriveForm);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('soll das Formular initialisieren', () => {
    expect(component['driveForm']).toBeDefined();
    expect(component['driveForm'].controls.date.value).toBeInstanceOf(Date);
  });

  it('soll Template-Änderungen verarbeiten und Reason leeren, wenn eine Vorlage gewählt wird', () => {
    const template: DriveTemplate = { id: '1', name: 'T1', fromLocation: 'A', toLocation: 'B', driveLength: 10, reason: 'WORK' };
    component['driveForm'].patchValue({ reason: 'PRIVATE' });
    component['driveForm'].patchValue({ template });
    expect(component['driveForm'].controls.reason.value).toBeNull();
  });

  it('soll beim Öffnen des Grund-Selects Reason aus der Vorlage übernehmen, wenn leer', () => {
    const template: DriveTemplate = { id: '1', name: 'T1', fromLocation: 'A', toLocation: 'B', driveLength: 10, reason: 'WORK' };
    component['driveForm'].patchValue({ template, reason: null });
    (component as any).onReasonOpened(true);
    expect(component['driveForm'].controls.reason.value).toBe('WORK');
  });

  it('soll eine Fahrt erfolgreich speichern und Formular zurücksetzen', async () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    component['driveForm'].patchValue({
      date: new Date(),
      template: { id: '1', name: 'T1' } as any,
      reason: 'WORK'
    });

    component.onSubmit();

    expect(driveServiceMock.save).toHaveBeenCalled();
    expect(snackBarMock.open).toHaveBeenCalledWith('Fahrt erfolgreich gespeichert', expect.anything(), expect.anything());
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('soll im Edit-Modus nach Speichern navigieren', () => {
    // Edit-Zustand manuell setzen
    (component as any).isEdit.set(true);
    (component as any).driveId.set('1');

    // Formular minimal gültig setzen
    component['driveForm'].patchValue({
      date: new Date(),
      template: { id: 't1' } as any,
      reason: 'WORK'
    });

    const navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigate');
    component.onSubmit();
    expect(navigateSpy).toHaveBeenCalledWith(['/drives']);
  });

  it('soll Fehler beim Speichern behandeln', () => {
    const errorResponse = new HttpErrorResponse({
      status: 400,
      error: { message: 'Validierungsfehler' }
    });
    driveServiceMock.save.mockReturnValue(throwError(() => errorResponse));

    component['driveForm'].patchValue({
      date: new Date(),
      template: { id: '1' } as any
    });

    component.onSubmit();

    expect(snackBarMock.open).toHaveBeenCalledWith(
      expect.stringContaining('Validierungsfehler'),
      'Schließen',
      expect.anything()
    );
  });

  it('soll Templates vergleichen', () => {
    const t1 = { id: '1' } as any;
    const t2 = { id: '1' } as any;
    const t3 = { id: '2' } as any;
    expect(component.compareTemplates(t1, t2)).toBe(true);
    expect(component.compareTemplates(t1, t3)).toBe(false);
    expect(component.compareTemplates(null, null)).toBe(true);
  });

  it('soll Template Labels generieren', () => {
    const t: DriveTemplate = { id: '1', name: 'T1', fromLocation: 'A', toLocation: 'B', driveLength: 10, reason: 'WORK' };
    expect(component.getTemplateLabel(t)).toContain('T1 (A -> B)');
    expect(component.getTemplateLabel(null)).toBe('');
  });

  it('soll bei Fehler beim Speichern zusammengefasste Snackbar unten/zentriert anzeigen (Legacy Test Case)', async () => {
    const errorBody = {
      status: 400,
      message: 'fromLocation: From location is required, toLocation: To location is required',
    };
    const errorResponse = new HttpErrorResponse({
      status: 400,
      statusText: 'Bad Request',
      error: errorBody
    });
    driveServiceMock.save.mockReturnValue(throwError(() => errorResponse));

    component['driveForm'].patchValue({
      date: new Date(),
      template: { id: 't1' } as any,
      reason: 'PRIVATE'
    });

    component.onSubmit();

    expect(snackBarMock.open).toHaveBeenCalled();
    const args = snackBarMock.open.mock.calls[0];
    const text = args[0];
    expect(text).toContain('fromLocation: From location is required');
    expect(text).toContain('(Status 400)');
    expect(args[1]).toBe('Schließen');
    expect(args[2].horizontalPosition).toBe('center');
    expect(args[2].verticalPosition).toBe('bottom');
    expect(args[2].panelClass).toContain('error-snackbar');
  });
  it('soll Validatoren aktualisieren wenn kein Template ausgewählt ist', () => {
    component['driveForm'].controls.template.setValue(null);
    fixture.detectChanges();

    expect(component['driveForm'].controls.reason.hasValidator(Validators.required)).toBe(true);
    expect(component['driveForm'].controls.fromLocation.hasValidator(Validators.required)).toBe(true);
    expect(component['driveForm'].controls.toLocation.hasValidator(Validators.required)).toBe(true);
    expect(component['driveForm'].controls.driveLength.hasValidator(Validators.required)).toBe(true);
  });

  it('soll Validatoren entfernen wenn ein Template ausgewählt ist', () => {
    const template: DriveTemplate = { id: '1', name: 'T1', fromLocation: 'A', toLocation: 'B', driveLength: 10, reason: 'WORK' };
    component['driveForm'].controls.template.setValue(template);
    fixture.detectChanges();

    expect(component['driveForm'].controls.reason.hasValidator(Validators.required)).toBe(false);
    expect(component['driveForm'].controls.fromLocation.hasValidator(Validators.required)).toBe(false);
    expect(component['driveForm'].controls.toLocation.hasValidator(Validators.required)).toBe(false);
    expect(component['driveForm'].controls.driveLength.hasValidator(Validators.required)).toBe(false);
  });

  it('soll Felder leeren wenn ein Template ausgewählt wird', () => {
    component['driveForm'].patchValue({
      fromLocation: 'A',
      toLocation: 'B',
      driveLength: 10
    });
    const template: DriveTemplate = { id: '1', name: 'T1', fromLocation: 'X', toLocation: 'Y', driveLength: 20, reason: 'WORK' };
    component['driveForm'].controls.template.setValue(template);
    fixture.detectChanges();

    expect(component['driveForm'].controls.fromLocation.value).toBeNull();
    expect(component['driveForm'].controls.toLocation.value).toBeNull();
    expect(component['driveForm'].controls.driveLength.value).toBeNull();
  });
});
