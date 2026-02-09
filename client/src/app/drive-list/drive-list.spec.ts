import 'zone.js';
import 'zone.js/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DriveList } from './drive-list';
import { DriveService } from '../drive-service';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Reason } from '../reason';

describe('DriveList', () => {
  let component: DriveList;
  let fixture: ComponentFixture<DriveList>;
  let driveServiceMock: any;
  let snackBarMock: any;

  beforeEach(async () => {
    driveServiceMock = {
      findAll: vi.fn().mockReturnValue(of([])),
      delete: vi.fn().mockReturnValue(of(undefined)),
      getLastSelectedDate: vi.fn().mockReturnValue(new Date()),
      setLastSelectedDate: vi.fn(),
      getFilter: vi.fn().mockReturnValue({
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
      imports: [DriveList],
      providers: [
        { provide: DriveService, useValue: driveServiceMock },
        { provide: MatSnackBar, useValue: snackBarMock },
        provideRouter([])
      ]
    })
    .overrideComponent(DriveList, {
      add: {
        providers: [
          { provide: DriveService, useValue: driveServiceMock },
          { provide: MatSnackBar, useValue: snackBarMock }
        ]
      }
    })
    .compileComponents();

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
    expect((component as any).selectedYear).toBe(now.getFullYear());
    expect((component as any).selectedMonth).toBe(now.getMonth() + 1);
  });

  it('should load drives on init', () => {
    expect(driveServiceMock.findAll).toHaveBeenCalled();
  });

  it('should handle INITIAL Load & Filter', async () => {
    const drives = [
      { id: '1', date: '2023-01-01', kmStart: 100, kmEnd: 150, reason: Reason.WORK, template: { name: 'T1' } }
    ];
    driveServiceMock.findAll.mockReturnValue(of(drives));
    (component as any).refresh$.next();
    fixture.detectChanges();
    await fixture.whenStable();

    (component as any).selectedYear = 2023;
    (component as any).selectedMonth = 1;
    (component as any).updateFilter();
    fixture.detectChanges();

    component.drives$.subscribe(f => expect(f.length).toBe(1));
  });

  it('should handle CSV export', async () => {
    const drives = [{ id: '1', date: '2023-01-01', template: { name: 'T1', drive_length: 10 } }];
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

  it('should handle Swipe & Deletion', async () => {
    const mockEvent = { touches: [{ clientX: 100, clientY: 100 }], preventDefault: vi.fn() } as any;
    component.onRowTouchStart(mockEvent, '1');
    const moveEvent = { touches: [{ clientX: 40, clientY: 100 }], preventDefault: vi.fn(), cancelable: true } as any;
    component.onRowTouchMove(moveEvent);
    expect((component as any).isActuallySwiping).toBe(true);

    vi.stubGlobal('confirm', vi.fn(() => true));
    const endEvent = { changedTouches: [{ clientX: 40, clientY: 100 }] } as any;
    component.onRowTouchEnd(endEvent, '1');
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(driveServiceMock.delete).toHaveBeenCalledWith('1');
    vi.unstubAllGlobals();
  });

  it('should handle Deletion error', async () => {
    vi.stubGlobal('confirm', vi.fn(() => true));
    driveServiceMock.delete.mockReturnValue(throwError(() => ({ status: 500 })));
    component.deleteDrive('1');
    expect(snackBarMock.open).toHaveBeenCalledWith('Fehler beim Löschen der Fahrt', 'OK', expect.any(Object));
    vi.unstubAllGlobals();
  });

  it('should handle navigation, filters and swipe edge cases', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    // Filters
    vi.spyOn(component as any, 'updateFilter');
    (component as any).selectedYear = 2023;
    component.onYearChange();
    expect((component as any).updateFilter).toHaveBeenCalled();
    (component as any).selectedYear = null;
    component.onYearChange();
    expect((component as any).selectedMonth).toBeNull();
    component.onMonthChange();
    component.onReasonChange();
    expect((component as any).updateFilter).toHaveBeenCalledTimes(4);

    // Navigation
    (component as any).isActuallySwiping = false;
    component.editDrive('1');
    expect(navigateSpy).toHaveBeenCalledWith(['/drives/edit', '1']);

    (component as any).isActuallySwiping = true;
    navigateSpy.mockClear();
    component.editDrive('1');
    expect(navigateSpy).not.toHaveBeenCalled();

    // Swipe edge case
    const startEvent = { touches: [{ clientX: 100, clientY: 100 }] } as any;
    component.onRowTouchStart(startEvent, '1');
    const rightMoveEvent = { touches: [{ clientX: 150, clientY: 100 }] } as any;
    component.onRowTouchMove(rightMoveEvent);
    expect((component as any).currentSwipeOffset).toBe(0);
  });
});
