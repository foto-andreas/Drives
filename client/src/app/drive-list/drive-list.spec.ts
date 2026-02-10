import 'zone.js';
import 'zone.js/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DriveList } from './drive-list';
import { DriveService } from '../drive-service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Reason } from '../reason';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('DriveList', () => {
  let component: DriveList;
  let fixture: ComponentFixture<DriveList>;
  let driveServiceMock: any;
  let snackBarMock: any;

  beforeEach(async () => {
    driveServiceMock = {
      findAll: vi.fn().mockReturnValue(of([])),
      delete: vi.fn().mockReturnValue(of(undefined)),
      currentFilter: vi.fn().mockReturnValue({
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        reason: null
      }),
      setFilter: vi.fn()
    };

    snackBarMock = {
      open: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [DriveList, ReactiveFormsModule, RouterTestingModule],
      providers: [
        { provide: DriveService, useValue: driveServiceMock },
        { provide: MatSnackBar, useValue: snackBarMock }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(DriveList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have initial filters set to current date', () => {
    const now = new Date();
    expect((component as any).filterForm.controls.year.value).toBe(now.getFullYear());
    expect((component as any).filterForm.controls.month.value).toBe(now.getMonth() + 1);
  });

  it('should load drives on init', () => {
    expect(driveServiceMock.findAll).toHaveBeenCalled();
  });

  it('should handle initial load and filter', async () => {
    const drives = [
      { id: '1', date: new Date(2023, 0, 1), reason: 'WORK', template: { name: 'T1' } }
    ];
    driveServiceMock.findAll.mockReturnValue(of(drives));
    (component as any).refresh$.next();
    fixture.detectChanges();
    await fixture.whenStable();

    (component as any).filterForm.controls.year.setValue(2023);
    (component as any).filterForm.controls.month.setValue(1);
    fixture.detectChanges();

    expect((component as any).drives().length).toBe(1);
  });

  it('should handle CSV export', async () => {
    const drives = [{ id: '1', date: new Date(2023, 0, 1), template: { name: 'T1', driveLength: 10 } }];
    driveServiceMock.findAll.mockReturnValue(of(drives));
    (component as any).refresh$.next();
    fixture.detectChanges();
    await fixture.whenStable();

    const mockLink = {
      setAttribute: vi.fn(),
      click: vi.fn(),
      style: {},
      remove: vi.fn()
    };

    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'a') return mockLink as any;
      return originalCreateElement(tagName);
    });
    const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((n) => n);
    const removeSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((n) => n);

    component.exportToCsv();
    expect(mockLink.click).toHaveBeenCalled();

    createElementSpy.mockRestore();
    appendSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it('should handle CSV export with HOME reason filter', async () => {
    (component as any).filterForm.patchValue({
      year: null,
      month: null,
      reason: 'HOME'
    });

    const drives = [
      { id: '1', date: new Date(2023, 0, 1), reason: 'HOME', template: { name: 'HomeOffice', driveLength: 0 } },
      { id: '2', date: new Date(2023, 0, 2), reason: 'HOME', template: { name: 'HomeOffice', driveLength: 0 } }
    ];
    driveServiceMock.findAll.mockReturnValue(of(drives));
    (component as any).refresh$.next();
    fixture.detectChanges();
    await fixture.whenStable();

    let capturedCsv = '';
    vi.stubGlobal('Blob', class {
      constructor(content: any[]) {
        capturedCsv = content[0];
      }
    });
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'mock-url') });

    const mockLink = {
      setAttribute: vi.fn(),
      click: vi.fn(),
      style: {},
      remove: vi.fn()
    };
    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'a') return mockLink as any;
      return originalCreateElement(tagName);
    });
    const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((n) => n);
    const removeSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((n) => n);

    component.exportToCsv();

    expect(capturedCsv).toContain('"Anzahl"');
    expect(capturedCsv).toContain('"Summierung"');
    expect(capturedCsv).not.toContain('"Länge"');
    expect(capturedCsv).not.toContain('"Summe"');

    const lines = capturedCsv.split('\n');
    expect(lines[1]).toContain(';"1";"1"');
    expect(lines[2]).toContain(';"1";"2"');

    createElementSpy.mockRestore();
    appendSpy.mockRestore();
    removeSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  it('should handle Swipe & Deletion', async () => {
    const mockEvent = { touches: [{ clientX: 100, clientY: 100 }], preventDefault: vi.fn() } as any;
    component.onRowTouchStart(mockEvent, '1');
    const moveEvent = { touches: [{ clientX: 40, clientY: 100 }], preventDefault: vi.fn(), cancelable: true } as any;
    component.onRowTouchMove(moveEvent);
    expect((component as any).isActuallySwiping).toBe(true);

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const endEvent = { changedTouches: [{ clientX: 40, clientY: 100 }] } as any;
    component.onRowTouchEnd(endEvent, '1');
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(driveServiceMock.delete).toHaveBeenCalledWith('1');
    confirmSpy.mockRestore();
  });

  it('should handle Deletion error', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    driveServiceMock.delete.mockReturnValue(throwError(() => ({ status: 500 })));
    component.deleteDrive('1');
    expect(snackBarMock.open).toHaveBeenCalledWith('Fehler beim Löschen der Fahrt', 'OK', expect.any(Object));
    confirmSpy.mockRestore();
  });

  it('should handle navigation, filters, and swipe edge cases', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    (component as any).filterForm.patchValue({ year: 2023, month: 5, reason: 'WORK' });
    expect(driveServiceMock.setFilter).toHaveBeenCalled();

    (component as any).filterForm.patchValue({ year: null, month: 5 });
    expect((component as any).filterForm.controls.month.value).toBeNull();

    (component as any).isActuallySwiping = false;
    component.editDrive('1');
    expect(navigateSpy).toHaveBeenCalledWith(['/drives/edit', '1']);

    (component as any).isActuallySwiping = true;
    navigateSpy.mockClear();
    component.editDrive('1');
    expect(navigateSpy).not.toHaveBeenCalled();

    const startEvent = { touches: [{ clientX: 100, clientY: 100 }] } as any;
    component.onRowTouchStart(startEvent, '1');
    const rightMoveEvent = { touches: [{ clientX: 150, clientY: 100 }] } as any;
    component.onRowTouchMove(rightMoveEvent);
    expect((component as any).currentSwipeOffset).toBe(0);
  });
});
