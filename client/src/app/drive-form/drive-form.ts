import { ChangeDetectionStrategy, Component, DestroyRef, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormControl, FormGroup, FormGroupDirective, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { provideNativeDateAdapter } from '@angular/material/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DriveService } from '../drive-service';
import { DriveTemplateService } from '../drive-template-service';
import { DriveTemplate } from '../drive-template';
import { Reason, ReasonKey } from '../reason';
import { ReasonHelper } from '../reason-helper';
import { Drive } from '../drive';

@Component({
  selector: 'app-drive-form',
  providers: [provideNativeDateAdapter()],
  templateUrl: './drive-form.html',
  styleUrls: ['./drive-form.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatTooltipModule,
    MatIconModule,
    RouterLink,
  ],
})
export class DriveForm {
  @ViewChild(FormGroupDirective) private formDirective: FormGroupDirective | undefined;
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly driveService = inject(DriveService);
  private readonly driveTemplateService = inject(DriveTemplateService);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly driveForm = new FormGroup({
    date: new FormControl<Date | null>(this.driveService.lastSelectedDate(), [Validators.required]),
    template: new FormControl<DriveTemplate | null>(null),
    reason: new FormControl<ReasonKey | null>(null),
    fromLocation: new FormControl<string | null>(null),
    toLocation: new FormControl<string | null>(null),
    driveLength: new FormControl<number | null>(null, [Validators.min(1)]),
  });
  protected readonly templates = toSignal(this.driveTemplateService.findAll(), { initialValue: [] });
  protected readonly reasons = ReasonHelper.keys();
  protected readonly isEdit = signal(false);
  protected readonly isMobile = signal(false);
  protected readonly latestDriveDate = signal<Date | null>(null);
  private readonly driveId = signal<string | null>(null);

  constructor() {
    this.breakpointObserver.observe([Breakpoints.Handset])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => this.isMobile.set(result.matches));

    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const id = params.get('id');
        this.driveId.set(id);
        this.isEdit.set(!!id);
        if (id) {
          this.driveService.get(id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(drive => {
              this.driveForm.patchValue({
                date: drive.date,
                template: drive.template,
                reason: drive.reason ?? null,
                fromLocation: drive.fromLocation ?? null,
                toLocation: drive.toLocation ?? null,
                driveLength: drive.driveLength ?? null,
              });
            });
        }
      });

    this.driveForm.controls.template.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(template => {
        if (template) {
          // Neue Anforderung: Wenn vorher keine Vorlage war und jetzt eine gewählt wird,
          // soll der Grund im Formular geleert werden (nicht automatisch aus der Vorlage setzen).
          this.driveForm.patchValue({ reason: null });
          this.driveForm.patchValue({
            fromLocation: null,
            toLocation: null,
            driveLength: null,
          });
        }
        this.updateValidators();
      });

    this.driveForm.controls.fromLocation.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateValidators());
    this.driveForm.controls.toLocation.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateValidators());
    this.driveForm.controls.driveLength.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateValidators());

    this.driveForm.controls.date.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(date => {
        if (date) {
          this.driveService.setLastSelectedDate(date);
        }
      });

    this.loadLatestDriveDate();
  }

  private loadLatestDriveDate(): void {
    this.driveService.getLatestDriveDate()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(date => this.latestDriveDate.set(date));
  }

  onReasonOpened(opened: boolean): void {
    if (!opened) return;
    const template = this.driveForm.controls.template.value;
    const current = this.driveForm.controls.reason.value;
    if (template && (current === null || current === undefined)) {
      this.driveForm.patchValue({ reason: template.reason });
    }
  }

  private updateValidators(): void {
    const template = this.driveForm.controls.template.value;
    if (template) {
      this.driveForm.controls.reason.clearValidators();
      this.driveForm.controls.fromLocation.clearValidators();
      this.driveForm.controls.toLocation.clearValidators();
      this.driveForm.controls.driveLength.clearValidators();
      this.driveForm.controls.driveLength.setValidators([Validators.min(1)]);
    } else {
      this.driveForm.controls.reason.setValidators([Validators.required]);
      this.driveForm.controls.fromLocation.setValidators([Validators.required]);
      this.driveForm.controls.toLocation.setValidators([Validators.required]);
      this.driveForm.controls.driveLength.setValidators([Validators.required, Validators.min(1)]);
    }
    this.driveForm.controls.reason.updateValueAndValidity({ emitEvent: false });
    this.driveForm.controls.fromLocation.updateValueAndValidity({ emitEvent: false });
    this.driveForm.controls.toLocation.updateValueAndValidity({ emitEvent: false });
    this.driveForm.controls.driveLength.updateValueAndValidity({ emitEvent: false });
  }

  onSubmit(): void {
    if (this.driveForm.invalid) {
      return;
    }
    const formValue = this.driveForm.getRawValue();
    const drive: Drive = {
      id: this.driveId(),
      date: formValue.date ?? new Date(),
      template: formValue.template ?? null,
      reason: formValue.reason ?? null,
      fromLocation: formValue.fromLocation ?? null,
      toLocation: formValue.toLocation ?? null,
      driveLength: formValue.driveLength ?? null,
    };

    this.driveService.save(drive)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackBar.open('Fahrt erfolgreich gespeichert', 'Schließen', {
            duration: 4000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            panelClass: ['success-snackbar']
          });
          if (this.isEdit()) {
            this.router.navigate(['/drives']);
            return;
          }
          this.formDirective?.resetForm({
            date: this.driveService.lastSelectedDate(),
            template: null,
            reason: null,
            fromLocation: null,
            toLocation: null,
            driveLength: null,
          });
          this.loadLatestDriveDate();
        },
        error: (err) => {
          const serverMsg = err && typeof err === 'object'
            ? (err.error && typeof err.error === 'object' && err.error.message ? err.error.message : err.message)
            : '';
          const statusText = err && err.status ? `\n(Status ${err.status})` : '';
          const full = `Fehler beim Speichern der Fahrt${serverMsg ? ': \n\n' + serverMsg : ''}${statusText}`;
          this.snackBar.open(full, 'Schließen', {
            duration: 4000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  compareTemplates(t1: DriveTemplate | null, t2: DriveTemplate | null): boolean {
    return t1 && t2 ? t1.id === t2.id : t1 === t2;
  }

  getTemplateLabel(template: DriveTemplate | null): string {
    if (!template) return '';
    return `${template.name} (${template.fromLocation} -> ${template.toLocation})`;
  }

  getTemplateTooltip(template: DriveTemplate | null): string {
    if (!template) return '';
    return `Von: ${template.fromLocation}\nNach: ${template.toLocation}\nLänge: ${
      template.driveLength
    } km\nGrund: ${ReasonHelper.toString(template.reason)}`;
  }

  protected readonly Reason = Reason;
  protected readonly ReasonHelper = ReasonHelper;
}
