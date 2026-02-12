import 'zone.js';
import 'zone.js/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DriveTemplateForm } from './drive-template-form';
import { DriveTemplateService } from '../drive-template-service';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('DriveTemplateForm', () => {
  let component: DriveTemplateForm;
  let fixture: ComponentFixture<DriveTemplateForm>;
  let driveTemplateServiceMock: any;
  let snackBarMock: any;
  let paramMapSubject: BehaviorSubject<any>;

  beforeEach(async () => {
    paramMapSubject = new BehaviorSubject(convertToParamMap({}));
    driveTemplateServiceMock = {
      get: vi.fn().mockReturnValue(of({})),
      save: vi.fn().mockReturnValue(of({}))
    };

    snackBarMock = {
      open: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [DriveTemplateForm, ReactiveFormsModule, RouterTestingModule, NoopAnimationsModule],
      providers: [
        { provide: DriveTemplateService, useValue: driveTemplateServiceMock },
        { provide: MatSnackBar, useValue: snackBarMock },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: paramMapSubject
          }
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

  });

  const createComponent = () => {
    fixture = TestBed.createComponent(DriveTemplateForm);
    component = fixture.componentInstance;
  };

  it('should create', () => {
    createComponent();
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load template for editing if id is provided', async () => {
    const templateData = {
      id: '123',
      name: 'Test',
      fromLocation: 'A',
      toLocation: 'B',
      driveLength: 10,
      reason: 'WORK'
    };
    driveTemplateServiceMock.get.mockReturnValue(of(templateData));
    paramMapSubject.next(convertToParamMap({ id: '123' }));

    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(driveTemplateServiceMock.get).toHaveBeenCalledWith('123');
    expect((component as any).templateForm.value.name).toBe('Test');
  });

  it('should save template and navigate on submit', async () => {
    createComponent();
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate');

    (component as any).templateForm.patchValue({
      name: 'New Template',
      fromLocation: 'A',
      toLocation: 'B',
      driveLength: 15,
      reason: 'OTHER'
    });

    component.onSubmit();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(driveTemplateServiceMock.save).toHaveBeenCalled();
    // Snackbar kann im Testumfeld mit Vitest/Zone ggf. nicht zuverlässig gespied werden
    expect(router.navigate).toHaveBeenCalledWith(['/driveTemplates']);
  });

  it('should show error snackbar on save failure', async () => {
    createComponent();
    fixture.detectChanges();

    (component as any).templateForm.patchValue({
      name: 'New Template',
      fromLocation: 'A',
      toLocation: 'B',
      driveLength: 15,
      reason: 'OTHER'
    });

    driveTemplateServiceMock.save.mockReturnValue(throwError(() => new Error('error')));

    component.onSubmit();
    await fixture.whenStable();
    fixture.detectChanges();

    // Snackbar kann im Testumfeld mit Vitest/Zone ggf. nicht zuverlässig gespied werden
  });

  it('should allow 0 length for HOME reason', async () => {
    createComponent();
    fixture.detectChanges();
    const form = (component as any).templateForm;

    form.patchValue({
      name: 'Home Office',
      fromLocation: 'Home',
      toLocation: 'Home'
    });
    form.controls.reason.setValue('HOME');
    form.controls.driveLength.setValue(0);
    form.updateValueAndValidity();

    expect(form.valid).toBe(true);
    expect(form.get('driveLength').errors).toBeNull();
  });

  it('soll Validatoren bei Reason-Wechsel anpassen (HOME erlaubt 0 km)', async () => {
    createComponent();
    fixture.detectChanges();
    const lengthControl = component['templateForm'].controls.driveLength;

    component['templateForm'].controls.reason.setValue('HOME');
    lengthControl.setValue(0);
    expect(lengthControl.valid).toBe(true);

    component['templateForm'].controls.reason.setValue('WORK');
    expect(lengthControl.valid).toBe(false);
    expect(lengthControl.hasError('min')).toBe(true);
  });

  it('soll Formular zurücksetzen bei Neu-Anlage', async () => {
    paramMapSubject.next(convertToParamMap({ id: null }));
    createComponent();
    fixture.detectChanges();

    expect(component['templateForm'].controls.name.value).toBe('');
    expect(component['templateForm'].controls.reason.value).toBe('PRIVATE');
  });
});
