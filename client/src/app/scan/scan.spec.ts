import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
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

  upload() {
    return of(this.latestStart as ScanEntry);
  }

  commitDrive(...args: any[]) {
    this.commitArgs = args;
    return of({ id: 'd1', date: new Date(), template: null });
  }
}

class MatSnackBarMock {
  lastMessage: string | null = null;

  open(message: string) {
    this.lastMessage = message;
    return;
  }
}

class RouterMock {
  navigate() {
    return Promise.resolve(true);
  }
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

  it('should clear pending capture when no file is selected', () => {
    const fixture = TestBed.createComponent(Scan);
    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    component.pendingStart = { timestamp: new Date(), latitude: 1, longitude: 2 };

    const event = { target: { files: [] } } as any;
    component.onFileSelected(event, 'START');

    expect(component.pendingStart).toBeNull();
  });
});
