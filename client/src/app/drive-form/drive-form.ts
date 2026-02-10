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
    template: new FormControl<DriveTemplate | null>(null, [Validators.required]),
    reason: new FormControl<ReasonKey | null>(null),
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
              });
            });
        }
      });

    this.driveForm.controls.template.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(template => {
        if (template && !this.isEdit()) {
          this.driveForm.patchValue({ reason: template.reason });
        }
      });

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
    };

    this.driveService.save(drive)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackBar.open('Fahrt erfolgreich gespeichert', 'OK', {
            duration: 4000,
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
          });
          this.loadLatestDriveDate();
        },
        error: () => {
          this.snackBar.open('Fehler beim Speichern der Fahrt', 'OK', {
            duration: 4000,
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
