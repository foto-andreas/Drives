import 'zone.js';
import 'zone.js/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DriveTemplateList } from './drive-template-list';
import { DriveTemplateService } from '../drive-template-service';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

describe('DriveTemplateList', () => {
  let component: DriveTemplateList;
  let fixture: ComponentFixture<DriveTemplateList>;
  let driveTemplateServiceMock: any;
  let snackBarMock: any;

  beforeEach(async () => {
    driveTemplateServiceMock = {
      findAll: vi.fn().mockReturnValue(of([])),
      delete: vi.fn().mockReturnValue(of(undefined))
    };

    snackBarMock = {
      open: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [DriveTemplateList],
      providers: [
        { provide: DriveTemplateService, useValue: driveTemplateServiceMock },
        { provide: MatSnackBar, useValue: snackBarMock },
        provideRouter([])
      ]
    })
    .overrideComponent(DriveTemplateList, {
      add: {
        providers: [
          { provide: DriveTemplateService, useValue: driveTemplateServiceMock },
          { provide: MatSnackBar, useValue: snackBarMock }
        ]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(DriveTemplateList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  it('should handle all major functionality', async () => {
    // 1. Initial load
    expect(driveTemplateServiceMock.findAll).toHaveBeenCalled();

    // 2. Navigation
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');
    (component as any).isActuallySwiping = false;
    component.editTemplate('1');
    expect(navigateSpy).toHaveBeenCalledWith(['/driveTemplates/edit', '1']);

    // 3. Swipe & Deletion success
    const mockEvent = { touches: [{ clientX: 100, clientY: 100 }], preventDefault: vi.fn() } as any;
    component.onRowTouchStart(mockEvent, '1');
    const moveEvent = { touches: [{ clientX: 40, clientY: 100 }], preventDefault: vi.fn(), cancelable: true } as any;
    component.onRowTouchMove(moveEvent);
    expect((component as any).isActuallySwiping).toBe(true);

    vi.stubGlobal('confirm', vi.fn(() => true));
    const endEvent = { changedTouches: [{ clientX: 40, clientY: 100 }] } as any;
    component.onRowTouchEnd(endEvent, '1');
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(driveTemplateServiceMock.delete).toHaveBeenCalledWith('1');
    vi.unstubAllGlobals();

    // Clear snackBar mock
    snackBarMock.open.mockClear();

    // Short swipe (no delete)
    (component as any).currentSwipeOffset = 10;
    component.onRowTouchEnd(endEvent, '1');
    await new Promise(resolve => setTimeout(resolve, 100));
    expect((component as any).isActuallySwiping).toBe(false);

    // 4. Deletion error
    vi.stubGlobal('confirm', vi.fn(() => true));
    driveTemplateServiceMock.delete.mockReturnValue(throwError(() => ({ status: 500 })));
    component.deleteTemplate('1');
    expect(snackBarMock.open).toHaveBeenCalledWith('Fehler beim Löschen der Vorlage', 'OK', expect.any(Object));

    // 4b. Deletion error status 409
    snackBarMock.open.mockClear();
    driveTemplateServiceMock.delete.mockReturnValue(throwError(() => ({ status: 409 })));
    component.deleteTemplate('1');
    expect(snackBarMock.open).toHaveBeenCalledWith('Diese Vorlage wird noch in Fahrten verwendet', 'OK', expect.any(Object));

    // 5. Swipe move right (deltaX <= 0)
    component.onRowTouchStart(mockEvent, '1');
    const rightMoveEvent = { touches: [{ clientX: 150, clientY: 100 }] } as any;
    component.onRowTouchMove(rightMoveEvent);
    expect((component as any).currentSwipeOffset).toBe(0);

    // 6. Navigation while swiping
    navigateSpy.mockClear();
    (component as any).isActuallySwiping = true;
    component.editTemplate('1');
    expect(navigateSpy).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('should call window.confirm in confirmDeletion', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const result = (component as any).confirmDeletion('test');
    expect(confirmSpy).toHaveBeenCalled();
    expect(result).toBe(true);
    confirmSpy.mockRestore();
  });

  it('should render rows and react to row click and delete button', async () => {
    // Arrange: provide data so that *ngFor renders rows
    const templates = [
      { id: 't1', name: 'Template 1', fromLocation: 'A', toLocation: 'B', driveLength: 10, reason: 'WORK' },
      { id: 't2', name: 'Template 2', fromLocation: 'C', toLocation: 'D', driveLength: 5, reason: 'HOME' },
    ];
    driveTemplateServiceMock.findAll.mockReturnValue(of(templates));

    // Trigger refresh and rendering
    (component as any).refresh$.next();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const table: HTMLElement | null = fixture.nativeElement.querySelector('table');
    expect(table).toBeTruthy();

    // Angular Material rows can be 'mat-row' or 'mat-mdc-row' depending on version
    const rows = table!.querySelectorAll('tr.mat-row, tr.mat-mdc-row') as NodeListOf<HTMLTableRowElement>;
    // allow DOM to settle
    await new Promise(r => setTimeout(r, 0));
    expect(rows.length).toBeGreaterThan(0);

    // Click on first row should navigate to edit
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');
    rows[0].click();
    expect(navigateSpy).toHaveBeenCalledWith(['/driveTemplates/edit', 't1']);

    // Click on delete icon button in first row
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const deleteBtn: HTMLButtonElement | null = table!.querySelector('button[color="warn"]');
    if (deleteBtn) {
      driveTemplateServiceMock.delete.mockReturnValue(of(undefined));
      deleteBtn.click();
      await new Promise(r => setTimeout(r, 50));
      expect(driveTemplateServiceMock.delete).toHaveBeenCalled();
    }
    confirmSpy.mockRestore();
  });
});
