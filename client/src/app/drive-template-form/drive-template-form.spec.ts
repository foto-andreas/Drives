import 'zone.js';
import 'zone.js/testing';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DriveTemplateForm } from './drive-template-form';
import { DriveTemplateService } from '../drive-template-service';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

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
      imports: [DriveTemplateForm, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: DriveTemplateService, useValue: driveTemplateServiceMock },
        { provide: MatSnackBar, useValue: snackBarMock },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: paramMapSubject
          }
        }
      ]
    })
    .overrideComponent(DriveTemplateForm, {
      add: {
        providers: [
          { provide: DriveTemplateService, useValue: driveTemplateServiceMock },
          { provide: MatSnackBar, useValue: snackBarMock }
        ]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(DriveTemplateForm);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load template for editing if id is provided', async () => {
    paramMapSubject.next(convertToParamMap({ id: '123' }));

    const templateData = {
      id: '123',
      name: 'Test',
      from_location: 'A',
      to_location: 'B',
      drive_length: 10,
      reason: 'WORK'
    };
    driveTemplateServiceMock.get.mockReturnValue(of(templateData));

    fixture.detectChanges();
    await fixture.whenStable();

    expect(driveTemplateServiceMock.get).toHaveBeenCalledWith('123');
    expect((component as any).templateForm.value.name).toBe('Test');
  });

  it('should save template and navigate on submit', async () => {
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate');

    (component as any).templateForm.patchValue({
      name: 'New Template',
      from_location: 'A',
      to_location: 'B',
      drive_length: 15,
      reason: 'OTHER'
    });

    component.onSubmit();

    expect(driveTemplateServiceMock.save).toHaveBeenCalled();
    expect(snackBarMock.open).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/driveTemplates']);
  });

  it('should show error snackbar on save failure', async () => {
    fixture.detectChanges();

    (component as any).templateForm.patchValue({
      name: 'New Template',
      from_location: 'A',
      to_location: 'B',
      drive_length: 15,
      reason: 'OTHER'
    });

    driveTemplateServiceMock.save.mockReturnValue(throwError(() => new Error('error')));

    component.onSubmit();

    expect(snackBarMock.open).toHaveBeenCalled();
  });

  it('should allow 0 length for HOME reason', async () => {
    fixture.detectChanges();
    const form = (component as any).templateForm;

    form.patchValue({
      name: 'Home Office',
      from_location: 'Home',
      to_location: 'Home',
      drive_length: 0,
      reason: 'HOME'
    });

    expect(form.valid).toBe(true);
    expect(form.get('drive_length').errors).toBeNull();
  });

  it('should not allow 0 length for WORK reason', async () => {
    fixture.detectChanges();
    const form = (component as any).templateForm;

    form.patchValue({
      name: 'Work',
      from_location: 'Home',
      to_location: 'Office',
      drive_length: 0,
      reason: 'WORK'
    });

    expect(form.valid).toBe(false);
    expect(form.get('drive_length').errors).toBeTruthy();
  });
});
