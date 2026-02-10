import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DriveTemplateService } from '../drive-template-service';
import { DriveTemplate } from '../drive-template';
import { Reason, ReasonKey } from '../reason';
import { ReasonHelper } from '../reason-helper';

@Component({
  selector: 'app-drive-template-form',
  templateUrl: './drive-template-form.html',
  styleUrls: ['./drive-template-form.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    RouterLink,
  ],
})
export class DriveTemplateForm {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly driveTemplateService = inject(DriveTemplateService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly templateForm = new FormGroup({
    name: new FormControl('', [Validators.required]),
    fromLocation: new FormControl('', [Validators.required]),
    toLocation: new FormControl('', [Validators.required]),
    driveLength: new FormControl(0, [Validators.required, Validators.min(1)]),
    reason: new FormControl<ReasonKey>('PRIVATE', [Validators.required])
  });
  protected readonly reasons = ReasonHelper.keys();
  protected readonly isEdit = signal(false);
  private readonly templateId = signal<string | null>(null);

  constructor() {
    this.templateForm.controls.reason.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(reason => {
        const lengthControl = this.templateForm.controls.driveLength;
        if (reason === 'HOME') {
          lengthControl.setValidators([Validators.required, Validators.min(0)]);
        } else {
          lengthControl.setValidators([Validators.required, Validators.min(1)]);
        }
        lengthControl.updateValueAndValidity();
      });

    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const id = params.get('id');
        this.templateId.set(id);
        this.isEdit.set(!!id);
        if (id) {
          this.driveTemplateService.get(id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(template => this.templateForm.patchValue(template));
        } else {
          this.templateForm.reset({
            name: '',
            fromLocation: '',
            toLocation: '',
            driveLength: 0,
            reason: 'PRIVATE'
          });
        }
      });
  }

  onSubmit(): void {
    if (this.templateForm.invalid) {
      return;
    }
    const formValue = this.templateForm.getRawValue();
    const template: DriveTemplate = {
      id: this.templateId(),
      name: formValue.name ?? '',
      fromLocation: formValue.fromLocation ?? '',
      toLocation: formValue.toLocation ?? '',
      driveLength: formValue.driveLength ?? 0,
      reason: formValue.reason ?? 'PRIVATE',
    };
    this.driveTemplateService.save(template)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackBar.open('Vorlage erfolgreich gespeichert', 'Schließen', {
            duration: 4000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            panelClass: ['success-snackbar']
          });
          this.router.navigate(['/driveTemplates']);
        },
        error: (err) => {
          const serverMsg = err && typeof err === 'object'
            ? (err.error && typeof err.error === 'object' && err.error.message ? err.error.message : err.message)
            : '';
          const statusText = err && err.status ? `\n(Status ${err.status})` : '';
          const full = `Fehler beim Speichern der Vorlage${serverMsg ? ': \n\n' + serverMsg : ''}${statusText}`;
          this.snackBar.open(full, 'Schließen', {
            duration: 4000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  protected readonly Reason = Reason;
  protected readonly ReasonHelper = ReasonHelper;
}
