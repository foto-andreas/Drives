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

interface CropSelection {
  x: number;
  y: number;
  width: number;
  height: number;
}

type CropMode = 'select' | 'pan';
type CropDragMode = 'select' | 'move' | 'pan';

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
  private static readonly MAX_IMAGE_DIMENSION = 1280;
  private static readonly JPEG_QUALITY = 0.85;
  private readonly scanService = inject(ScanService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('startFileInput') private startFileInput?: ElementRef<HTMLInputElement>;
  @ViewChild('endFileInput') private endFileInput?: ElementRef<HTMLInputElement>;
  @ViewChild('cropCanvas') private cropCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('cropDialog') private cropDialog?: ElementRef<HTMLDivElement>;

  protected readonly startEntry = signal<ScanEntry | null>(null);
  protected readonly endEntry = signal<ScanEntry | null>(null);
  protected readonly isUploading = signal(false);
  protected readonly cropperOpen = signal(false);
  protected readonly cropZoom = signal(1);
  protected readonly cropMode = signal<CropMode>('select');

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
  private cropNextStart = false;
  private cropNextEnd = false;
  private cropImage: HTMLImageElement | null = null;
  private cropImageUrl: string | null = null;
  private cropSelection: CropSelection | null = null;
  private cropDragMode: CropDragMode | null = null;
  private cropDragStart: { x: number; y: number } | null = null;
  private cropSelectionStart: CropSelection | null = null;
  private cropOffsetX = 0;
  private cropOffsetY = 0;
  private cropType: ScanType | null = null;
  private cropRenderState: {
    drawX: number;
    drawY: number;
    scale: number;
    imageWidth: number;
    imageHeight: number;
    canvasWidth: number;
    canvasHeight: number;
  } | null = null;

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
    if (type === 'START') {
      this.cropNextStart = true;
    } else {
      this.cropNextEnd = true;
    }
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

  async onFileSelected(event: Event, type: ScanType): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length > 0 ? input.files[0] : null;
    if (!file) {
      this.clearPending(type);
      this.clearPendingFile(type);
      this.resetFileInput(type);
      return;
    }

    const shouldCrop = this.shouldCrop(type);
    const preparedFile = shouldCrop ? file : await this.prepareUploadFile(file);
    this.setPendingFile(type, preparedFile);
    this.tryUpload(type);
  }

  private tryUpload(type: ScanType): void {
    const pending = type === 'START' ? this.pendingStart : this.pendingEnd;
    const file = type === 'START' ? this.pendingStartFile : this.pendingEndFile;
    if (!pending || !file) {
      return;
    }
    if (this.cropperOpen() && this.cropType === type) {
      return;
    }
    if (this.shouldCrop(type)) {
      this.openCropper(type, file);
      return;
    }

    this.uploadPending(type, pending, file);
  }

  private uploadPending(type: ScanType, pending: PendingCapture, file: File): void {
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
          if (!entry) {
            this.snackBar.open('Foto konnte nicht verarbeitet werden', 'Schließen', {
              duration: 2000,
              horizontalPosition: 'center',
              verticalPosition: 'bottom',
              panelClass: ['error-snackbar']
            });
            return;
          }
          if (type === 'START') {
            this.startEntry.set(entry);
            this.applyEntryToForm(entry, 'START');
          } else {
            this.endEntry.set(entry);
            this.applyEntryToForm(entry, 'ZIEL');
          }
          if (entry.kmStand === null || entry.kmStand === undefined) {
            this.snackBar.open('KM-Stand konnte nicht erkannt werden', 'Schließen', {
              duration: 2000,
              horizontalPosition: 'center',
              verticalPosition: 'bottom',
              panelClass: ['error-snackbar']
            });
          } else {
            this.snackBar.open('Foto verarbeitet', 'Schließen', {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'bottom',
              panelClass: ['success-snackbar']
            });
          }
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

  private async prepareUploadFile(file: File): Promise<File> {
    if (!file.type.startsWith('image/')) {
      return file;
    }
    if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') {
      return file;
    }

    try {
      let bitmap: ImageBitmap;
      try {
        bitmap = await createImageBitmap(file, { imageOrientation: 'none' });
      } catch {
        bitmap = await createImageBitmap(file);
      }

      const maxDimension = Math.max(bitmap.width, bitmap.height);
      if (maxDimension <= Scan.MAX_IMAGE_DIMENSION) {
        bitmap.close();
        return file;
      }

      const scale = Scan.MAX_IMAGE_DIMENSION / maxDimension;
      const targetWidth = Math.max(1, Math.round(bitmap.width * scale));
      const targetHeight = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        bitmap.close();
        return file;
      }
      ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
      bitmap.close();

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', Scan.JPEG_QUALITY);
      });
      if (!blob) {
        return file;
      }

      return new File([blob], this.buildResizedFileName(file.name), {
        type: blob.type,
        lastModified: file.lastModified,
      });
    } catch {
      return file;
    }
  }

  private buildResizedFileName(originalName: string): string {
    if (!originalName) {
      return 'scan.jpg';
    }
    const dot = originalName.lastIndexOf('.');
    const base = dot > 0 ? originalName.slice(0, dot) : originalName;
    return `${base}.jpg`;
  }

  private shouldCrop(type: ScanType): boolean {
    return type === 'START' ? this.cropNextStart : this.cropNextEnd;
  }

  private clearCropNext(type: ScanType): void {
    if (type === 'START') {
      this.cropNextStart = false;
    } else {
      this.cropNextEnd = false;
    }
  }

  private openCropper(type: ScanType, file: File): void {
    this.clearCropNext(type);
    this.cropType = type;
    this.cropSelection = null;
    this.cropOffsetX = 0;
    this.cropOffsetY = 0;
    this.cropZoom.set(1);
    this.cropMode.set('select');
    this.cropperOpen.set(true);

    if (this.cropImageUrl) {
      URL.revokeObjectURL(this.cropImageUrl);
    }
    const url = URL.createObjectURL(file);
    this.cropImageUrl = url;
    const img = new Image();
    img.onload = () => {
      this.cropImage = img;
      this.syncCropCanvasSize();
      this.renderCropper();
      this.focusCropper();
    };
    img.onerror = () => {
      this.snackBar.open('Foto konnte nicht geladen werden', 'Schließen', {
        duration: 4000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['error-snackbar']
      });
      this.closeCropper();
    };
    img.src = url;
  }

  cancelCrop(): void {
    const type = this.cropType;
    this.closeCropper();
    if (type) {
      this.clearPending(type);
      this.clearPendingFile(type);
      this.resetFileInput(type);
    }
  }

  useOriginal(): void {
    const type = this.cropType;
    const pending = type === 'START' ? this.pendingStart : this.pendingEnd;
    const file = type === 'START' ? this.pendingStartFile : this.pendingEndFile;
    this.closeCropper();
    if (type && pending && file) {
      this.uploadPending(type, pending, file);
    }
  }

  async confirmCrop(): Promise<void> {
    if (!this.cropSelection || !this.cropRenderState || !this.cropImage) {
      this.snackBar.open('Bitte einen Ausschnitt waehlen', 'Schließen', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
      return;
    }
    const croppedFile = await this.buildCroppedFile();
    if (!croppedFile || !this.cropType) {
      this.snackBar.open('Ausschnitt konnte nicht verarbeitet werden', 'Schließen', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['error-snackbar']
      });
      return;
    }

    const type = this.cropType;
    this.setPendingFile(type, croppedFile);
    const pending = type === 'START' ? this.pendingStart : this.pendingEnd;
    const file = type === 'START' ? this.pendingStartFile : this.pendingEndFile;
    this.closeCropper();
    if (pending && file) {
      this.uploadPending(type, pending, file);
    }
  }

  setCropMode(mode: CropMode): void {
    this.cropMode.set(mode);
  }

  onCropZoom(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    if (!Number.isFinite(value)) {
      return;
    }
    this.cropZoom.set(value);
    this.renderCropper();
  }

  onCropPointerDown(event: PointerEvent): void {
    const canvas = this.cropCanvas?.nativeElement;
    if (!canvas) return;
    canvas.setPointerCapture(event.pointerId);
    const point = this.getCanvasPoint(event);
    if (!point) return;

    const selection = this.cropSelection;
    if (this.cropMode() === 'pan') {
      this.cropDragMode = 'pan';
      this.cropDragStart = point;
      return;
    }
    if (selection && this.isPointInside(point, selection)) {
      this.cropDragMode = 'move';
      this.cropDragStart = point;
      this.cropSelectionStart = { ...selection };
      return;
    }

    this.cropDragMode = 'select';
    this.cropDragStart = point;
    this.cropSelectionStart = null;
    this.cropSelection = { x: point.x, y: point.y, width: 0, height: 0 };
    this.renderCropper();
  }

  onCropPointerMove(event: PointerEvent): void {
    if (!this.cropDragMode || !this.cropDragStart) return;
    const point = this.getCanvasPoint(event);
    if (!point) return;

    if (this.cropDragMode === 'pan') {
      const dx = point.x - this.cropDragStart.x;
      const dy = point.y - this.cropDragStart.y;
      this.cropOffsetX += dx;
      this.cropOffsetY += dy;
      this.cropDragStart = point;
      this.renderCropper();
      return;
    }

    if (this.cropDragMode === 'move' && this.cropSelectionStart) {
      const dx = point.x - this.cropDragStart.x;
      const dy = point.y - this.cropDragStart.y;
      const canvas = this.cropCanvas?.nativeElement;
      if (!canvas) return;
      const next = {
        x: this.cropSelectionStart.x + dx,
        y: this.cropSelectionStart.y + dy,
        width: this.cropSelectionStart.width,
        height: this.cropSelectionStart.height,
      };
      this.cropSelection = this.clampSelection(next, canvas.width, canvas.height);
      this.renderCropper();
      return;
    }

    if (this.cropDragMode === 'select') {
      const start = this.cropDragStart;
      const x = Math.min(start.x, point.x);
      const y = Math.min(start.y, point.y);
      const width = Math.abs(point.x - start.x);
      const height = Math.abs(point.y - start.y);
      const canvas = this.cropCanvas?.nativeElement;
      if (!canvas) return;
      this.cropSelection = this.clampSelection({ x, y, width, height }, canvas.width, canvas.height);
      this.renderCropper();
    }
  }

  onCropPointerUp(event: PointerEvent): void {
    const canvas = this.cropCanvas?.nativeElement;
    if (canvas) {
      canvas.releasePointerCapture(event.pointerId);
    }
    if (this.cropDragMode === 'select' && this.cropSelection) {
      if (this.cropSelection.width < 2 || this.cropSelection.height < 2) {
        this.cropSelection = null;
      }
    }
    this.cropDragMode = null;
    this.cropDragStart = null;
    this.cropSelectionStart = null;
    this.renderCropper();
  }

  private renderCropper(): void {
    const canvas = this.cropCanvas?.nativeElement;
    const image = this.cropImage;
    if (!canvas || !image) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    const baseScale = Math.min(canvasWidth / image.width, canvasHeight / image.height);
    const scale = baseScale * this.cropZoom();
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;
    const drawX = (canvasWidth - drawWidth) / 2 + this.cropOffsetX;
    const drawY = (canvasHeight - drawHeight) / 2 + this.cropOffsetY;

    ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
    this.cropRenderState = {
      drawX,
      drawY,
      scale,
      imageWidth: image.width,
      imageHeight: image.height,
      canvasWidth,
      canvasHeight,
    };

    if (this.cropSelection) {
      const { x, y, width, height } = this.cropSelection;
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillRect(x, y, width, height);
      ctx.restore();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);
    }
  }

  private async buildCroppedFile(): Promise<File | null> {
    if (!this.cropSelection || !this.cropRenderState || !this.cropImage) {
      return null;
    }
    const { drawX, drawY, scale, imageWidth, imageHeight } = this.cropRenderState;
    const selection = this.cropSelection;
    const imageRect = {
      x: drawX,
      y: drawY,
      width: imageWidth * scale,
      height: imageHeight * scale,
    };
    const ix = Math.max(selection.x, imageRect.x);
    const iy = Math.max(selection.y, imageRect.y);
    const ix2 = Math.min(selection.x + selection.width, imageRect.x + imageRect.width);
    const iy2 = Math.min(selection.y + selection.height, imageRect.y + imageRect.height);
    const intersectWidth = Math.max(0, ix2 - ix);
    const intersectHeight = Math.max(0, iy2 - iy);
    if (intersectWidth < 1 || intersectHeight < 1) {
      return null;
    }

    const cropX = (ix - imageRect.x) / scale;
    const cropY = (iy - imageRect.y) / scale;
    const cropWidth = intersectWidth / scale;
    const cropHeight = intersectHeight / scale;

    const maxDim = Math.max(cropWidth, cropHeight);
    const downscale = maxDim > Scan.MAX_IMAGE_DIMENSION ? Scan.MAX_IMAGE_DIMENSION / maxDim : 1;
    const outputWidth = Math.max(1, Math.round(cropWidth * downscale));
    const outputHeight = Math.max(1, Math.round(cropHeight * downscale));

    const canvas = document.createElement('canvas');
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return null;
    }
    ctx.drawImage(
      this.cropImage,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      outputWidth,
      outputHeight
    );
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', Scan.JPEG_QUALITY);
    });
    if (!blob) {
      return null;
    }
    return new File([blob], this.buildResizedFileName('scan.jpg'), {
      type: blob.type,
      lastModified: Date.now(),
    });
  }

  private clampSelection(selection: CropSelection, canvasWidth: number, canvasHeight: number): CropSelection {
    const x = this.clamp(selection.x, 0, canvasWidth);
    const y = this.clamp(selection.y, 0, canvasHeight);
    const width = this.clamp(selection.width, 0, canvasWidth - x);
    const height = this.clamp(selection.height, 0, canvasHeight - y);
    return { x, y, width, height };
  }

  private clamp(value: number, min: number, max: number): number {
    if (value < min) return min;
    if (value > max) return max;
    return value;
  }

  private isPointInside(point: { x: number; y: number }, rect: CropSelection): boolean {
    return point.x >= rect.x
      && point.x <= rect.x + rect.width
      && point.y >= rect.y
      && point.y <= rect.y + rect.height;
  }

  private getCanvasPoint(event: PointerEvent): { x: number; y: number } | null {
    const canvas = this.cropCanvas?.nativeElement;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  private syncCropCanvasSize(): void {
    const canvas = this.cropCanvas?.nativeElement;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  }

  private focusCropper(): void {
    const dialog = this.cropDialog?.nativeElement;
    dialog?.focus();
  }

  private closeCropper(): void {
    if (this.cropImageUrl) {
      URL.revokeObjectURL(this.cropImageUrl);
    }
    this.cropImageUrl = null;
    this.cropImage = null;
    this.cropSelection = null;
    this.cropRenderState = null;
    this.cropType = null;
    this.cropperOpen.set(false);
  }
}
