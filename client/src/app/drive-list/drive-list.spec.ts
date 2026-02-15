import { TestBed, ComponentFixture } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DriveList } from './drive-list';
import { DriveService } from '../drive-service';
import { HttpErrorResponse } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';

class DriveServiceMock {
  public currentFilter = signal({ year: 2026, month: 2, reason: null });
  public setFilter = vi.fn();
  public findAll = vi.fn().mockReturnValue(of([]));
  public getYears = vi.fn().mockReturnValue(of([2026, 2025]));
  public delete = vi.fn().mockReturnValue(of({}));
}

describe('DriveList', () => {
  let component: DriveList;
  let fixture: ComponentFixture<DriveList>;
  let driveServiceMock: DriveServiceMock;
  let snackBarMock: { open: any };
  let router: Router;

  beforeEach(async () => {
    driveServiceMock = new DriveServiceMock();
    snackBarMock = { open: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [DriveList],
      providers: [
        { provide: DriveService, useValue: driveServiceMock },
        provideRouter([])
      ]
    }).overrideComponent(DriveList, {
      add: {
        providers: [
          { provide: MatSnackBar, useValue: snackBarMock }
        ]
      }
    }).compileComponents();

    fixture = TestBed.createComponent(DriveList);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('soll Fahrten laden und anzeigen', () => {
    const drives = [
      { id: '1', date: new Date(), template: { name: 'T1', driveLength: 10 }, reason: 'WORK' }
    ];
    driveServiceMock.findAll.mockReturnValue(of(drives));

    // Refresh auslösen
    component['refresh$'].next();
    fixture.detectChanges();

    expect(driveServiceMock.findAll).toHaveBeenCalled();
    expect(component['drives']()).toEqual(drives);
  });

  it('soll Filteränderungen verarbeiten', async () => {
    component['filterForm'].patchValue({ year: 2025, month: 1, reason: 'HOME' });

    // Warte kurz, falls debounce existiert (auch wenn im Code nicht explizit sichtbar,
    // ReactiveForms valueChanges feuert asynchron)
    await new Promise(r => setTimeout(r, 0));

    expect(driveServiceMock.setFilter).toHaveBeenCalledWith({
      year: 2025,
      month: 1,
      reason: 'HOME'
    });
    expect(driveServiceMock.findAll).toHaveBeenCalled();
  });

  it('soll Monat zurücksetzen wenn Jahr nicht gesetzt ist', async () => {
    component['filterForm'].patchValue({ year: null, month: 5 });
    await new Promise(r => setTimeout(r, 0));

    expect(component['filterForm'].controls.month.value).toBeNull();
  });

  it('soll eine Fahrt bearbeiten', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    component.editDrive('1');
    expect(navigateSpy).toHaveBeenCalledWith(['/drives/edit', '1']);
  });

  it('soll eine Fahrt erfolgreich löschen', () => {
    vi.stubGlobal('confirm', vi.fn(() => true));
    driveServiceMock.delete.mockReturnValue(of({}));
    const refreshSpy = vi.spyOn(component['refresh$'], 'next');

    component.deleteDrive('1');

    expect(driveServiceMock.delete).toHaveBeenCalledWith('1');
    expect(snackBarMock.open).toHaveBeenCalledWith('Fahrt erfolgreich gelöscht', expect.anything(), expect.anything());
    expect(refreshSpy).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('soll Fehler beim Löschen behandeln', () => {
    vi.stubGlobal('confirm', vi.fn(() => true));
    const errorResponse = new HttpErrorResponse({
      status: 500,
      error: { message: 'Serverfehler' }
    });
    driveServiceMock.delete.mockReturnValue(throwError(() => errorResponse));

    component.deleteDrive('1');

    expect(snackBarMock.open).toHaveBeenCalledWith(
      expect.stringContaining('Serverfehler'),
      'Schließen',
      expect.anything()
    );
    vi.unstubAllGlobals();
  });

  it('soll Swipe-Gesten verarbeiten', () => {
    const startEvent = { touches: [{ clientX: 200, clientY: 100 }] } as any;
    component.onRowTouchStart(startEvent, '1');
    expect(component['swipedRowId']).toBe('1');

    const moveEvent = { touches: [{ clientX: 100, clientY: 100 }], preventDefault: vi.fn(), cancelable: true } as any;
    component.onRowTouchMove(moveEvent);
    expect(component['isActuallySwiping']).toBe(true);
    expect(component['currentSwipeOffset']).toBe(100);

    vi.stubGlobal('confirm', vi.fn(() => false));
    const endEvent = { changedTouches: [{ clientX: 100, clientY: 100 }] } as any;
    component.onRowTouchEnd(endEvent, '1');
    expect(component['swipedRowId']).toBeNull();
    expect(component['currentSwipeOffset']).toBe(0);
    vi.unstubAllGlobals();
  });

  it('soll CSV-Export auslösen', () => {
    const drives = [
      { id: '1', date: new Date(), template: { name: 'T1', fromLocation: 'A', toLocation: 'B', driveLength: 10 }, reason: 'WORK' }
    ];
    driveServiceMock.findAll.mockReturnValue(of(drives));
    component['refresh$'].next();
    fixture.detectChanges();

    // Mock URL.createObjectURL and document methods
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:url');
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockReturnValue();
    const clickSpy = vi.fn();
    const link = { setAttribute: vi.fn(), style: {}, click: clickSpy } as any;
    vi.spyOn(document, 'createElement').mockReturnValue(link);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => link);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => link);

    component.exportToCsv();

    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(link.setAttribute).toHaveBeenCalledWith('download', expect.stringContaining('.csv'));
    expect(clickSpy).toHaveBeenCalled();

    createObjectURLSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
  });
});
