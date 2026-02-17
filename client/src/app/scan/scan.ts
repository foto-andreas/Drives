import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { ScanEntry, ScanType } from '../scan-entry';
import { ScanService } from '../scan-service';
import { ReasonKey } from '../reason';
import { ReasonHelper } from '../reason-helper';

interface PendingCapture {
  timestamp: Date;
  latitude: number;
  longitude: number;
}

@Component({
  selector: 'app-scan',
  templateUrl: './scan.html',
  styleUrls: ['./scan.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
  ],
})
export class Scan {
  private readonly scanService = inject(ScanService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('startFileInput') private startFileInput?: ElementRef<HTMLInputElement>;
  @ViewChild('endFileInput') private endFileInput?: ElementRef<HTMLInputElement>;

  protected readonly startEntry = signal<ScanEntry | null>(null);
  protected readonly endEntry = signal<ScanEntry | null>(null);
  protected readonly isUploading = signal(false);

  protected readonly scanForm = new FormGroup({
    startKm: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    startAddress: new FormControl<string | null>(null),
    endKm: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    endAddress: new FormControl<string | null>(null),
    reason: new FormControl<ReasonKey | null>('OTHER'),
  });
  private readonly scanFormValue = toSignal(this.scanForm.valueChanges, { initialValue: this.scanForm.getRawValue() });
  private lastStartId: string | null = null;
  private lastEndId: string | null = null;

  private pendingStart: PendingCapture | null = null;
  private pendingEnd: PendingCapture | null = null;
  private pendingStartFile: File | null = null;
  private pendingEndFile: File | null = null;

  protected readonly driveLength = computed(() => {
    this.scanFormValue();
    const startKm = this.toNumber(this.scanForm.controls.startKm.value);
    const endKm = this.toNumber(this.scanForm.controls.endKm.value);
    if (startKm === null || endKm === null) return null;
    return endKm - startKm;
  });
  protected readonly reasons = ReasonHelper.keys();
  protected readonly ReasonHelper = ReasonHelper;

  protected readonly canCommit = computed(() => {
    const length = this.driveLength();
    this.scanFormValue();
    const startKm = this.toNumber(this.scanForm.controls.startKm.value);
    const endKm = this.toNumber(this.scanForm.controls.endKm.value);
    return !!this.startEntry()
      && !!this.endEntry()
      && !this.isUploading()
      && startKm !== null
      && endKm !== null
      && length !== null
      && length > 0;
  });

  constructor() {
    this.scanService.getLatestStartIfLatest()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: entry => {
          this.startEntry.set(entry);
          this.applyEntryToForm(entry, 'START');
        },
        error: () => {
          return;
        }
      });
  }

  capture(type: ScanType): void {
    if (!navigator.geolocation) {
      this.snackBar.open('Geolocation wird vom Browser nicht unterstützt', 'Schließen', {
        duration: 4000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.clearPending(type);
    this.clearPendingFile(type);
    this.snackBar.open('GPS wird ermittelt...', undefined, {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
    this.openFilePicker(type);
    const timestamp = new Date();
    navigator.geolocation.getCurrentPosition(
      position => {
        const pending: PendingCapture = {
          timestamp,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        if (type === 'START') {
          this.pendingStart = pending;
        } else {
          this.pendingEnd = pending;
        }
        this.tryUpload(type);
      },
      () => {
        this.snackBar.open('GPS-Position konnte nicht ermittelt werden', 'Schließen', {
          duration: 4000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['error-snackbar']
        });
        this.clearPending(type);
        this.clearPendingFile(type);
        this.resetFileInput(type);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  onFileSelected(event: Event, type: ScanType): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length > 0 ? input.files[0] : null;
    if (!file) {
      this.clearPending(type);
      this.clearPendingFile(type);
      this.resetFileInput(type);
      return;
    }

    this.setPendingFile(type, file);
    this.tryUpload(type);
  }

  private tryUpload(type: ScanType): void {
    const pending = type === 'START' ? this.pendingStart : this.pendingEnd;
    const file = type === 'START' ? this.pendingStartFile : this.pendingEndFile;
    if (!pending || !file) {
      return;
    }

    this.isUploading.set(true);
    this.scanService.upload(type, pending.timestamp, pending.latitude, pending.longitude, file)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isUploading.set(false);
          this.clearPending(type);
          this.clearPendingFile(type);
          this.resetFileInput(type);
        })
      )
      .subscribe({
        next: entry => {
          if (type === 'START') {
            this.startEntry.set(entry);
            this.applyEntryToForm(entry, 'START');
          } else {
            this.endEntry.set(entry);
            this.applyEntryToForm(entry, 'ZIEL');
          }
          this.snackBar.open('Foto verarbeitet', 'Schließen', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            panelClass: ['success-snackbar']
          });
        },
        error: (err) => {
          const serverMsg = err && typeof err === 'object'
            ? (err.error && typeof err.error === 'object' && err.error.message ? err.error.message : err.message)
            : '';
          const statusText = err && err.status ? `\n(Status ${err.status})` : '';
          const full = `Fehler beim Verarbeiten des Fotos${serverMsg ? ': \n\n' + serverMsg : ''}${statusText}`;
          this.snackBar.open(full, 'Schließen', {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  commitDrive(): void {
    const start = this.startEntry();
    const end = this.endEntry();
    if (!start || !end) return;

    const startKm = this.toNumber(this.scanForm.controls.startKm.value);
    const endKm = this.toNumber(this.scanForm.controls.endKm.value);
    if (startKm === null || endKm === null) {
      this.snackBar.open('KM-Staende fehlen oder sind ungueltig', 'Schließen', {
        duration: 4000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.scanService.commitDrive(
      start.id,
      end.id,
      startKm,
      endKm,
      this.scanForm.controls.startAddress.value,
      this.scanForm.controls.endAddress.value,
      this.scanForm.controls.reason.value
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackBar.open('Fahrt wurde uebernommen', 'Schließen', {
            duration: 4000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            panelClass: ['success-snackbar']
          });
          this.endEntry.set(null);
          this.router.navigate(['/drives']);
        },
        error: (err) => {
          const serverMsg = err && typeof err === 'object'
            ? (err.error && typeof err.error === 'object' && err.error.message ? err.error.message : err.message)
            : '';
          const statusText = err && err.status ? `\n(Status ${err.status})` : '';
          const full = `Fehler beim Uebernehmen der Fahrt${serverMsg ? ': \n\n' + serverMsg : ''}${statusText}`;
          this.snackBar.open(full, 'Schließen', {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  private clearPending(type: ScanType): void {
    if (type === 'START') {
      this.pendingStart = null;
    } else {
      this.pendingEnd = null;
    }
  }

  private clearPendingFile(type: ScanType): void {
    if (type === 'START') {
      this.pendingStartFile = null;
    } else {
      this.pendingEndFile = null;
    }
  }

  private setPendingFile(type: ScanType, file: File): void {
    if (type === 'START') {
      this.pendingStartFile = file;
    } else {
      this.pendingEndFile = file;
    }
  }

  private resetFileInput(type: ScanType): void {
    const input = type === 'START' ? this.startFileInput?.nativeElement : this.endFileInput?.nativeElement;
    if (input) {
      input.value = '';
    }
  }

  private openFilePicker(type: ScanType): void {
    const input = type === 'START' ? this.startFileInput?.nativeElement : this.endFileInput?.nativeElement;
    input?.click();
  }

  private applyEntryToForm(entry: ScanEntry | null, type: ScanType): void {
    if (!entry) return;
    if (type === 'START') {
      const isNew = this.lastStartId !== entry.id;
      if (isNew || !this.scanForm.controls.startKm.dirty) {
        this.scanForm.controls.startKm.setValue(entry.kmStand);
      }
      if (isNew || !this.scanForm.controls.startAddress.dirty) {
        this.scanForm.controls.startAddress.setValue(entry.address ?? null);
      }
      if (isNew) {
        this.scanForm.controls.startKm.markAsPristine();
        this.scanForm.controls.startAddress.markAsPristine();
      }
      this.lastStartId = entry.id;
    } else {
      const isNew = this.lastEndId !== entry.id;
      if (isNew || !this.scanForm.controls.endKm.dirty) {
        this.scanForm.controls.endKm.setValue(entry.kmStand);
      }
      if (isNew || !this.scanForm.controls.endAddress.dirty) {
        this.scanForm.controls.endAddress.setValue(entry.address ?? null);
      }
      if (isNew) {
        this.scanForm.controls.endKm.markAsPristine();
        this.scanForm.controls.endAddress.markAsPristine();
      }
      this.lastEndId = entry.id;
    }
  }

  private toNumber(value: number | string | null): number | null {
    if (value === null || value === undefined) return null;
    const normalized = typeof value === 'number'
      ? String(value)
      : value.trim().replace(/[^\d]/g, '');
    if (!normalized) return null;
    const num = Number(normalized);
    return Number.isFinite(num) ? num : null;
  }
}
