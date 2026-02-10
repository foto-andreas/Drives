import 'zone.js';
import 'zone.js/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DriveForm } from './drive-form';
import { DriveService } from '../drive-service';
import { DriveTemplateService } from '../drive-template-service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('DriveForm', () => {
  let component: DriveForm;
  let fixture: ComponentFixture<DriveForm>;
  let driveServiceMock: any;
  let driveTemplateServiceMock: any;
  let snackBarMock: any;
  let paramMapSubject: BehaviorSubject<any>;
  let breakpointObserverMock: any;

  beforeEach(async () => {
    paramMapSubject = new BehaviorSubject(convertToParamMap({}));
    driveServiceMock = {
      lastSelectedDate: vi.fn().mockReturnValue(new Date()),
      setLastSelectedDate: vi.fn(),
      get: vi.fn().mockReturnValue(of({})),
      save: vi.fn().mockReturnValue(of({})),
      getLatestDriveDate: vi.fn().mockReturnValue(of(null))
    };

    driveTemplateServiceMock = {
      findAll: vi.fn().mockReturnValue(of([]))
    };

    snackBarMock = {
      open: vi.fn()
    };

    breakpointObserverMock = {
      observe: vi.fn().mockReturnValue(of({ matches: false }))
    };

    await TestBed.configureTestingModule({
      imports: [DriveForm, ReactiveFormsModule, RouterTestingModule, NoopAnimationsModule],
      providers: [
        { provide: DriveService, useValue: driveServiceMock },
        { provide: DriveTemplateService, useValue: driveTemplateServiceMock },
        { provide: MatSnackBar, useValue: snackBarMock },
        { provide: BreakpointObserver, useValue: breakpointObserverMock },
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
    fixture = TestBed.createComponent(DriveForm);
    component = fixture.componentInstance;
  };

  it('should create', () => {
    createComponent();
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load templates on init', () => {
    createComponent();
    fixture.detectChanges();
    expect(driveTemplateServiceMock.findAll).toHaveBeenCalled();
  });

  it('should load latest drive date on init', () => {
    const latestDate = new Date(2023, 10, 20);
    driveServiceMock.getLatestDriveDate.mockReturnValue(of(latestDate));
    createComponent();
    fixture.detectChanges();
    expect(driveServiceMock.getLatestDriveDate).toHaveBeenCalled();
    expect((component as any).latestDriveDate()).toEqual(latestDate);
  });

  it('should handle empty latest drive date response', () => {
    driveServiceMock.getLatestDriveDate.mockReturnValue(of(null));
    createComponent();
    fixture.detectChanges();

    expect((component as any).latestDriveDate()).toBeNull();
  });

  it('should load drive for editing if id is provided', async () => {
    const driveData = { id: '123', date: new Date(), template: { id: 't1' }, reason: 'WORK' };
    driveServiceMock.get.mockReturnValue(of(driveData));
    paramMapSubject.next(convertToParamMap({ id: '123' }));

    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(driveServiceMock.get).toHaveBeenCalledWith('123');
  });

  it('should update reason when template changes (not in edit mode)', async () => {
    createComponent();
    fixture.detectChanges();
    const template = { id: 't1', reason: 'PRIVATE' } as any;
    (component as any).driveForm.controls.template.setValue(template);
    expect((component as any).driveForm.controls.reason.value).toBe('PRIVATE');
  });

  it('should update last selected date when date changes', async () => {
    createComponent();
    fixture.detectChanges();
    const testDate = new Date(2023, 5, 5);
    (component as any).driveForm.controls.date.setValue(testDate);
    expect(driveServiceMock.setLastSelectedDate).toHaveBeenCalledWith(testDate);
  });

  it('should save drive and navigate on submit (edit mode)', async () => {
    createComponent();
    fixture.detectChanges();
    (component as any).isEdit.set(true);
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
      date: testDate
    }));
    expect(snackBarMock.open).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/drives']);
  });

  it('should reset form on submit (creation mode)', async () => {
    createComponent();
    fixture.detectChanges();
    (component as any).isEdit.set(false);
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
    createComponent();
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
    createComponent();
    const t1 = { id: '1' } as any;
    const t2 = { id: '1' } as any;
    const t3 = { id: '2' } as any;
    expect(component.compareTemplates(t1, t2)).toBe(true);
    expect(component.compareTemplates(t1, t3)).toBe(false);
    expect(component.compareTemplates(null as any, null as any)).toBe(true);
  });

  it('should generate correct label text', () => {
    createComponent();
    const template = {
      name: 'Test',
      fromLocation: 'A',
      toLocation: 'B'
    } as any;
    const label = component.getTemplateLabel(template);
    expect(label).toBe('Test (A -> B)');
  });

  it('should generate correct tooltip text', () => {
    createComponent();
    const template = {
      name: 'Test',
      fromLocation: 'A',
      toLocation: 'B',
      driveLength: 10,
      reason: 'WORK'
    } as any;
    const tooltip = component.getTemplateTooltip(template);
    expect(tooltip).toContain('Von: A');
    expect(tooltip).toContain('Nach: B');
    expect(tooltip).toContain('Länge: 10 km');
    expect(tooltip).toContain('Grund: Arbeit');
  });

  it('should detect mobile state', () => {
    breakpointObserverMock.observe.mockReturnValue(of({ matches: true }));
    createComponent();
    fixture.detectChanges();
    expect((component as any).isMobile()).toBe(true);
  });
});
