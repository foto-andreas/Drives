import 'zone.js';
import 'zone.js/testing';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DriveForm } from './drive-form';
import { DriveService } from '../drive-service';
import { DriveTemplateService } from '../drive-template-service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';

describe('DriveForm', () => {
  let component: DriveForm;
  let fixture: ComponentFixture<DriveForm>;
  let driveServiceMock: any;
  let driveTemplateServiceMock: any;
  let snackBarMock: any;
  let paramMapSubject: BehaviorSubject<any>;

  beforeEach(async () => {
    paramMapSubject = new BehaviorSubject(convertToParamMap({}));
    driveServiceMock = {
      getLastSelectedDate: vi.fn().mockReturnValue(new Date()),
      setLastSelectedDate: vi.fn(),
      get: vi.fn().mockReturnValue(of({})),
      save: vi.fn().mockReturnValue(of({}))
    };

    driveTemplateServiceMock = {
      findAll: vi.fn().mockReturnValue(of([]))
    };

    snackBarMock = {
      open: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [DriveForm, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: DriveService, useValue: driveServiceMock },
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
    .overrideComponent(DriveForm, {
      add: {
        providers: [
          { provide: DriveService, useValue: driveServiceMock },
          { provide: DriveTemplateService, useValue: driveTemplateServiceMock },
          { provide: MatSnackBar, useValue: snackBarMock }
        ]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(DriveForm);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load templates on init', () => {
    fixture.detectChanges();
    expect(driveTemplateServiceMock.findAll).toHaveBeenCalled();
  });

  it('should load drive for editing if id is provided', async () => {
    paramMapSubject.next(convertToParamMap({ id: '123' }));

    const driveData = { id: '123', date: new Date(), template: { id: 't1' }, reason: 'WORK' };
    driveServiceMock.get.mockReturnValue(of(driveData));

    fixture.detectChanges();
    await fixture.whenStable();

    expect(driveServiceMock.get).toHaveBeenCalledWith('123');
  });

  it('should update reason when template changes (not in edit mode)', async () => {
    fixture.detectChanges();
    const template = { id: 't1', reason: 'PRIVATE' } as any;
    (component as any).driveForm.get('template')?.setValue(template);
    expect((component as any).driveForm.get('reason')?.value).toBe('PRIVATE');
  });

  it('should update last selected date when date changes', async () => {
    fixture.detectChanges();
    const testDate = new Date(2023, 5, 5);
    (component as any).driveForm.get('date')?.setValue(testDate);
    expect(driveServiceMock.setLastSelectedDate).toHaveBeenCalledWith(testDate);
  });

  it('should save drive and navigate on submit (edit mode)', async () => {
    fixture.detectChanges();
    (component as any).isEdit = true;
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate');

    const testDate = new Date(2023, 5, 5);
    (component as any).driveForm.patchValue({
      date: testDate,
      template: { id: 't1' },
      reason: 'WORK'
    });

    driveServiceMock.save.mockReturnValue(of({}));

    component.onSubmit();

    expect(driveServiceMock.save).toHaveBeenCalledWith(expect.objectContaining({
      date: '2023-06-05'
    }));
    expect(snackBarMock.open).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/drives']);
  });

  it('should reset form on submit (creation mode)', async () => {
    fixture.detectChanges();
    (component as any).isEdit = false;
    const formDirectiveMock = { resetForm: vi.fn() };
    (component as any).formDirective = formDirectiveMock;

    (component as any).driveForm.patchValue({
      date: new Date(),
      template: { id: 't1' },
      reason: 'WORK'
    });

    driveServiceMock.save.mockReturnValue(of({}));

    component.onSubmit();

    expect(driveServiceMock.save).toHaveBeenCalled();
    expect(snackBarMock.open).toHaveBeenCalled();
    expect(formDirectiveMock.resetForm).toHaveBeenCalled();
  });

  it('should show error snackbar on save failure', async () => {
    fixture.detectChanges();

    (component as any).driveForm.patchValue({
      date: new Date(),
      template: { id: 't1' },
      reason: 'WORK'
    });

    driveServiceMock.save.mockReturnValue(throwError(() => new Error('error')));

    component.onSubmit();

    expect(snackBarMock.open).toHaveBeenCalled();
  });

  it('should compare templates correctly', () => {
    const t1 = { id: '1' } as any;
    const t2 = { id: '1' } as any;
    const t3 = { id: '2' } as any;
    expect(component.compareTemplates(t1, t2)).toBe(true);
    expect(component.compareTemplates(t1, t3)).toBe(false);
    expect(component.compareTemplates(null as any, null as any)).toBe(true);
  });
});
