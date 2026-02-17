import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Scan } from './scan';
import { ScanService } from '../scan-service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { ScanEntry } from '../scan-entry';

class ScanServiceMock {
  latestStart: ScanEntry | null = null;
  commitArgs: any[] | null = null;

  getLatestStartIfLatest() {
    return of(this.latestStart);
  }

  upload = vi.fn(() => of(this.latestStart as ScanEntry));

  commitDrive = vi.fn((...args: any[]) => {
    this.commitArgs = args;
    return of({ id: 'd1', date: new Date(), template: null });
  });
}

class MatSnackBarMock {
  lastMessage: string | null = null;
  lastConfig: { duration?: number } | null = null;

  open(message: string, _action?: string, config?: { duration?: number }) {
    this.lastMessage = message;
    this.lastConfig = config ?? null;
    return;
  }
}

class RouterMock {
  navigate = vi.fn().mockResolvedValue(true);
}

describe('Scan', () => {
  let scanService: ScanServiceMock;
  let snackBar: MatSnackBarMock;

  beforeEach(() => {
    scanService = new ScanServiceMock();
    snackBar = new MatSnackBarMock();

    TestBed.configureTestingModule({
      imports: [Scan],
      providers: [
        { provide: ScanService, useValue: scanService },
        { provide: Router, useClass: RouterMock }
      ]
    }).overrideComponent(Scan, {
      add: {
        providers: [
          { provide: MatSnackBar, useValue: snackBar }
        ]
      }
    });
  });

  it('should populate form from latest start entry', () => {
    scanService.latestStart = {
      id: 's1',
      type: 'START',
      timestamp: new Date('2025-01-01T10:00:00Z'),
      latitude: 48.1,
      longitude: 11.6,
      address: 'Adresse',
      kmStand: 1000
    };

    const fixture = TestBed.createComponent(Scan);
    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    expect(component.scanForm.controls.startKm.value).toBe(1000);
    expect(component.scanForm.controls.startAddress.value).toBe('Adresse');
  });

  it('should ignore errors when loading latest start entry', () => {
    scanService.getLatestStartIfLatest = vi.fn(() => throwError(() => new Error('boom')));

    const fixture = TestBed.createComponent(Scan);
    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    expect(component.startEntry()).toBeNull();
  });

  it('should default reason to OTHER', () => {
    const fixture = TestBed.createComponent(Scan);
    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    expect(component.scanForm.controls.reason.value).toBe('OTHER');
  });

  it('should enable commit when values are present and valid', () => {
    const fixture = TestBed.createComponent(Scan);
    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    const startEntry: ScanEntry = {
      id: 's1',
      type: 'START',
      timestamp: new Date(),
      latitude: 48.1,
      longitude: 11.6,
      address: 'Adresse',
      kmStand: 1000
    };
    const endEntry: ScanEntry = {
      id: 'e1',
      type: 'ZIEL',
      timestamp: new Date(),
      latitude: 48.2,
      longitude: 11.7,
      address: 'Adresse',
      kmStand: 1010
    };

    component.startEntry.set(startEntry);
    component.endEntry.set(endEntry);
    component.scanForm.controls.startKm.setValue(1000);
    component.scanForm.controls.endKm.setValue(1010);

    expect(component.canCommit()).toBe(true);
    expect(component.driveLength()).toBe(10);
  });

  it('should disable commit when length is not positive', () => {
    const fixture = TestBed.createComponent(Scan);
    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    const startEntry: ScanEntry = {
      id: 's1',
      type: 'START',
      timestamp: new Date(),
      latitude: 48.1,
      longitude: 11.6,
      address: 'Adresse',
      kmStand: 1000
    };
    const endEntry: ScanEntry = {
      id: 'e1',
      type: 'ZIEL',
      timestamp: new Date(),
      latitude: 48.2,
      longitude: 11.7,
      address: 'Adresse',
      kmStand: 1000
    };

    component.startEntry.set(startEntry);
    component.endEntry.set(endEntry);
    component.scanForm.controls.startKm.setValue(1000);
    component.scanForm.controls.endKm.setValue(1000);

    expect(component.driveLength()).toBe(0);
    expect(component.canCommit()).toBe(false);
  });

  it('should normalize numeric input with separators', () => {
    const fixture = TestBed.createComponent(Scan);
    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    component.scanForm.controls.startKm.setValue('100.000');
    component.scanForm.controls.endKm.setValue('100 010');

    expect(component.driveLength()).toBe(10);
  });

  it('should return null drive length when input has no digits', () => {
    const fixture = TestBed.createComponent(Scan);
    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    component.scanForm.controls.startKm.setValue('---');
    component.scanForm.controls.endKm.setValue('100');

    expect(component.driveLength()).toBeNull();
  });

  it('should not call commit when km values are missing', () => {
    const fixture = TestBed.createComponent(Scan);
    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    const startEntry: ScanEntry = {
      id: 's1',
      type: 'START',
      timestamp: new Date(),
      latitude: 48.1,
      longitude: 11.6,
      address: 'Adresse',
      kmStand: 1000
    };
    const endEntry: ScanEntry = {
      id: 'e1',
      type: 'ZIEL',
      timestamp: new Date(),
      latitude: 48.2,
      longitude: 11.7,
      address: 'Adresse',
      kmStand: 1010
    };

    component.startEntry.set(startEntry);
    component.endEntry.set(endEntry);
    component.scanForm.controls.startKm.setValue(null);
    component.scanForm.controls.endKm.setValue(1010);

    component.commitDrive();

    expect(scanService.commitArgs).toBeNull();
  });

  it('should not commit when start or end is missing', () => {
    const fixture = TestBed.createComponent(Scan);
    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    component.startEntry.set(null);
    component.endEntry.set(null);

    component.commitDrive();

    expect(scanService.commitArgs).toBeNull();
  });

  it('should override dirty fields when a new scan entry arrives', () => {
    const fixture = TestBed.createComponent(Scan);
    fixture.detectChanges();

    const component = fixture.componentInstance as any;

    component.scanForm.controls.startKm.setValue(999);
    component.scanForm.controls.startKm.markAsDirty();

    component.applyEntryToForm({
      id: 's1',
      type: 'START',
      timestamp: new Date(),
      latitude: 48.1,
      longitude: 11.6,
      address: 'Alt',
      kmStand: 1000
    }, 'START');

    expect(component.scanForm.controls.startKm.value).toBe(1000);

    component.scanForm.controls.startKm.setValue(1111);
    component.scanForm.controls.startKm.markAsDirty();

    component.applyEntryToForm({
      id: 's2',
      type: 'START',
      timestamp: new Date(),
      latitude: 48.1,
      longitude: 11.6,
      address: 'Neu',
      kmStand: 2000
    }, 'START');

    expect(component.scanForm.controls.startKm.value).toBe(2000);
  });

  it('should show snackbar when geolocation is unavailable', () => {
    const fixture = TestBed.createComponent(Scan);
    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    const original = Object.getOwnPropertyDescriptor(navigator, 'geolocation');
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: undefined });

    component.capture('START');

    expect(snackBar.lastMessage).toContain('Geolocation wird vom Browser nicht unterstützt');

    if (original) {
      Object.defineProperty(navigator, 'geolocation', original);
    } else {
      delete (navigator as any).geolocation;
    }
  });

  it('should show snackbar when geolocation lookup fails', () => {
    const fixture = TestBed.createComponent(Scan);
    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    const original = Object.getOwnPropertyDescriptor(navigator, 'geolocation');
    const geoMock = {
      getCurrentPosition: (_success: PositionCallback, error: PositionErrorCallback) => error({} as GeolocationPositionError),
    };
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: geoMock });

    component.capture('START');

    expect(snackBar.lastMessage).toContain('GPS-Position konnte nicht ermittelt werden');

    if (original) {
      Object.defineProperty(navigator, 'geolocation', original);
    } else {
      delete (navigator as any).geolocation;
    }
  });

  it('should show gps snackbar when capture starts', () => {
    const fixture = TestBed.createComponent(Scan);
    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    component.startFileInput = { nativeElement: { click: vi.fn() } };
    const original = Object.getOwnPropertyDescriptor(navigator, 'geolocation');
    const geoMock = {
      getCurrentPosition: (success: PositionCallback) => success({
        coords: { latitude: 48.1, longitude: 11.6 } as GeolocationCoordinates,
      } as GeolocationPosition)
    };
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: geoMock });

    component.capture('START');

    expect(snackBar.lastMessage).toContain('GPS wird ermittelt');
    expect(snackBar.lastConfig?.duration).toBe(2000);

    if (original) {
      Object.defineProperty(navigator, 'geolocation', original);
    } else {
      delete (navigator as any).geolocation;
    }
  });

  it('should clear pending capture when no file is selected', async () => {
    const fixture = TestBed.createComponent(Scan);
    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    component.pendingStart = { timestamp: new Date(), latitude: 1, longitude: 2 };
    component.pendingStartFile = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });
    const input = { files: [], value: 'x' };
    component.startFileInput = { nativeElement: input };

    const event = { target: { files: [] } } as any;
    await component.onFileSelected(event, 'START');

    expect(component.pendingStart).toBeNull();
    expect(component.pendingStartFile).toBeNull();
    expect(input.value).toBe('');
  });

  it('should capture and trigger start file selection on success', () => {
    const fixture = TestBed.createComponent(Scan);
    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    const clickSpy = vi.fn();
    component.startFileInput = { nativeElement: { click: clickSpy } };
    const original = Object.getOwnPropertyDescriptor(navigator, 'geolocation');
    const geoMock = {
      getCurrentPosition: (success: PositionCallback) => success({
        coords: { latitude: 48.1, longitude: 11.6 } as GeolocationCoordinates,
      } as GeolocationPosition)
    };
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: geoMock });

    component.capture('START');

    expect(component.pendingStart).not.toBeNull();
    expect(clickSpy).toHaveBeenCalled();

    if (original) {
      Object.defineProperty(navigator, 'geolocation', original);
    } else {
      delete (navigator as any).geolocation;
    }
  });

  it('should capture and trigger end file selection on success', () => {
    const fixture = TestBed.createComponent(Scan);
    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    const clickSpy = vi.fn();
    component.endFileInput = { nativeElement: { click: clickSpy } };
    const original = Object.getOwnPropertyDescriptor(navigator, 'geolocation');
    const geoMock = {
      getCurrentPosition: (success: PositionCallback) => success({
        coords: { latitude: 48.2, longitude: 11.7 } as GeolocationCoordinates,
      } as GeolocationPosition)
    };
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: geoMock });

    component.capture('ZIEL');

    expect(component.pendingEnd).not.toBeNull();
    expect(clickSpy).toHaveBeenCalled();

    if (original) {
      Object.defineProperty(navigator, 'geolocation', original);
    } else {
      delete (navigator as any).geolocation;
    }
  });

  it('should keep file when geolocation is not yet available', async () => {
    const fixture = TestBed.createComponent(Scan);
    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });
    const input = { files: [file], value: 'x' };
    component.pendingStart = null;

    await component.onFileSelected({ target: input } as any, 'START');

    expect(snackBar.lastMessage).toBeNull();
    expect(component.pendingStartFile).toBe(file);
    expect(scanService.upload).not.toHaveBeenCalled();
  });

  it('should upload photo and update start entry', async () => {
    const fixture = TestBed.createComponent(Scan);
    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });
    const input = { files: [file], value: 'x' };
    const entry: ScanEntry = {
      id: 's1',
      type: 'START',
      timestamp: new Date(),
      latitude: 48.1,
      longitude: 11.6,
      address: 'Adresse',
      kmStand: 1000
    };
    component.pendingStart = { timestamp: entry.timestamp, latitude: 48.1, longitude: 11.6 };
    component.startFileInput = { nativeElement: input };
    scanService.upload.mockReturnValue(of(entry));

    await component.onFileSelected({ target: input } as any, 'START');

    expect(component.startEntry()).toEqual(entry);
    expect(component.pendingStart).toBeNull();
    expect(component.pendingStartFile).toBeNull();
    expect(component.isUploading()).toBe(false);
    expect(input.value).toBe('');
    expect(snackBar.lastMessage).toContain('Foto verarbeitet');
  });

  it('should upload photo and update end entry', async () => {
    const fixture = TestBed.createComponent(Scan);
    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });
    const input = { files: [file], value: 'x' };
    const entry: ScanEntry = {
      id: 'e1',
      type: 'ZIEL',
      timestamp: new Date(),
      latitude: 48.2,
      longitude: 11.7,
      address: 'Ziel',
      kmStand: 1500
    };
    component.pendingEnd = { timestamp: entry.timestamp, latitude: 48.2, longitude: 11.7 };
    component.endFileInput = { nativeElement: input };
    scanService.upload.mockReturnValue(of(entry));

    await component.onFileSelected({ target: input } as any, 'ZIEL');

    expect(component.endEntry()).toEqual(entry);
    expect(component.scanForm.controls.endKm.value).toBe(1500);
    expect(component.pendingEnd).toBeNull();
    expect(component.pendingEndFile).toBeNull();
    expect(input.value).toBe('');
  });

  it('should handle upload errors and reset state', async () => {
    const fixture = TestBed.createComponent(Scan);
    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });
    const input = { files: [file], value: 'x' };
    component.pendingEnd = { timestamp: new Date(), latitude: 48.1, longitude: 11.6 };
    component.endFileInput = { nativeElement: input };
    scanService.upload.mockReturnValue(throwError(() => ({ status: 500, message: 'Boom' })));

    await component.onFileSelected({ target: input } as any, 'ZIEL');

    expect(component.pendingEnd).toBeNull();
    expect(component.pendingEndFile).toBeNull();
    expect(component.isUploading()).toBe(false);
    expect(input.value).toBe('');
    expect(snackBar.lastMessage).toContain('Fehler beim Verarbeiten des Fotos');
  });

  it('should commit drive and navigate on success', async () => {
    const fixture = TestBed.createComponent(Scan);
    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    component.startEntry.set({
      id: 's1',
      type: 'START',
      timestamp: new Date(),
      latitude: 48.1,
      longitude: 11.6,
      address: 'Adresse',
      kmStand: 1000
    });
    component.endEntry.set({
      id: 'e1',
      type: 'ZIEL',
      timestamp: new Date(),
      latitude: 48.2,
      longitude: 11.7,
      address: 'Adresse',
      kmStand: 1010
    });
    component.scanForm.controls.startKm.setValue(1000);
    component.scanForm.controls.endKm.setValue(1010);

    const router = TestBed.inject(Router) as unknown as RouterMock;
    component.commitDrive();

    expect(scanService.commitArgs?.[6]).toBe('OTHER');
    expect(router.navigate).toHaveBeenCalledWith(['/drives']);
    expect(component.endEntry()).toBeNull();
    expect(snackBar.lastMessage).toContain('Fahrt wurde uebernommen');
  });

  it('should pass selected reason to commit', () => {
    const fixture = TestBed.createComponent(Scan);
    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    component.startEntry.set({
      id: 's1',
      type: 'START',
      timestamp: new Date(),
      latitude: 48.1,
      longitude: 11.6,
      address: 'Adresse',
      kmStand: 1000
    });
    component.endEntry.set({
      id: 'e1',
      type: 'ZIEL',
      timestamp: new Date(),
      latitude: 48.2,
      longitude: 11.7,
      address: 'Adresse',
      kmStand: 1010
    });
    component.scanForm.controls.startKm.setValue(1000);
    component.scanForm.controls.endKm.setValue(1010);
    component.scanForm.controls.reason.setValue('WORK');

    component.commitDrive();

    expect(scanService.commitArgs?.[6]).toBe('WORK');
  });

  it('should show snackbar on commit error', () => {
    const fixture = TestBed.createComponent(Scan);
    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    component.startEntry.set({
      id: 's1',
      type: 'START',
      timestamp: new Date(),
      latitude: 48.1,
      longitude: 11.6,
      address: 'Adresse',
      kmStand: 1000
    });
    component.endEntry.set({
      id: 'e1',
      type: 'ZIEL',
      timestamp: new Date(),
      latitude: 48.2,
      longitude: 11.7,
      address: 'Adresse',
      kmStand: 1010
    });
    component.scanForm.controls.startKm.setValue(1000);
    component.scanForm.controls.endKm.setValue(1010);
    scanService.commitDrive.mockReturnValue(throwError(() => ({ status: 400, message: 'Bad' })));

    component.commitDrive();

    expect(snackBar.lastMessage).toContain('Fehler beim Uebernehmen der Fahrt');
  });

  it('should apply end entry to form and mark pristine on new entry', () => {
    const fixture = TestBed.createComponent(Scan);
    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    component.scanForm.controls.endKm.setValue(999);
    component.scanForm.controls.endKm.markAsDirty();

    component.applyEntryToForm({
      id: 'e1',
      type: 'ZIEL',
      timestamp: new Date(),
      latitude: 48.2,
      longitude: 11.7,
      address: 'Neu',
      kmStand: 2000
    }, 'ZIEL');

    expect(component.scanForm.controls.endKm.value).toBe(2000);
    expect(component.scanForm.controls.endAddress.value).toBe('Neu');
  });

  it('should clear pending end capture when no file is selected', async () => {
    const fixture = TestBed.createComponent(Scan);
    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    component.pendingEnd = { timestamp: new Date(), latitude: 1, longitude: 2 };
    component.pendingEndFile = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });
    const input = { files: [], value: 'x' };
    component.endFileInput = { nativeElement: input };

    const event = { target: { files: [] } } as any;
    await component.onFileSelected(event, 'ZIEL');

    expect(component.pendingEnd).toBeNull();
    expect(component.pendingEndFile).toBeNull();
    expect(input.value).toBe('');
  });
});
