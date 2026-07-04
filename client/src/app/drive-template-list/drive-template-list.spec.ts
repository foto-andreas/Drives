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

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should handle all major functionality', async () => {
    // 1. Initial load
    expect(driveTemplateServiceMock.findAll).toHaveBeenCalled();

    // 2. Navigation
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');
    component.editTemplate('1');
    expect(navigateSpy).toHaveBeenCalledWith(['/driveTemplates/edit', '1']);

    // 3. Deletion success
    vi.stubGlobal('confirm', vi.fn(() => true));
    component.deleteTemplate('1');
    expect(driveTemplateServiceMock.delete).toHaveBeenCalledWith('1');
    vi.unstubAllGlobals();

    // Clear snackBar mock
    snackBarMock.open.mockClear();

    // 4. Deletion error
    vi.stubGlobal('confirm', vi.fn(() => true));
    driveTemplateServiceMock.delete.mockReturnValue(throwError(() => ({ status: 500 })));
    component.deleteTemplate('1');
    expect(snackBarMock.open).toHaveBeenCalledWith(
      expect.stringContaining('Fehler beim Löschen der Vorlage'),
      'Schließen',
      expect.objectContaining({
        duration: 4000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['error-snackbar']
      })
    );
    expect(snackBarMock.open).toHaveBeenCalledWith(
      expect.stringContaining('(Status 500)'),
      'Schließen',
      expect.any(Object)
    );

    vi.unstubAllGlobals();
  });

  it('should call window.confirm in confirmDeletion', () => {
    const confirmMock = vi.fn(() => true);
    vi.stubGlobal('confirm', confirmMock);
    const result = (component as any).confirmDeletion('test');
    expect(confirmMock).toHaveBeenCalled();
    expect(result).toBe(true);
    vi.unstubAllGlobals();
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
    vi.stubGlobal('confirm', vi.fn(() => true));
    const deleteBtn: HTMLButtonElement | null = table!.querySelector('button[color="warn"]');
    if (deleteBtn) {
      driveTemplateServiceMock.delete.mockReturnValue(of(undefined));
      deleteBtn.click();
      await new Promise(r => setTimeout(r, 50));
      expect(driveTemplateServiceMock.delete).toHaveBeenCalled();
    }
    vi.unstubAllGlobals();
  });
});
