import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DriveTemplateService } from '../drive-template-service';
import { DriveTemplate } from '../drive-template';
import { Reason } from '../reason';

@Component({
  selector: 'app-drive-template-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatSnackBarModule,
    RouterLink
  ],
  templateUrl: './drive-template-form.html',
  styleUrl: './drive-template-form.css'
})
export class DriveTemplateForm implements OnInit {
  protected templateForm: FormGroup;
  protected reasons = Reason.keys();
  protected isEdit = false;
  private templateId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private driveTemplateService: DriveTemplateService
  ) {
    this.templateForm = new FormGroup({
      name: new FormControl('', [Validators.required]),
      from_location: new FormControl('', [Validators.required]),
      to_location: new FormControl('', [Validators.required]),
      drive_length: new FormControl(0, [Validators.required, Validators.min(1)]),
      reason: new FormControl('PRIVATE', [Validators.required])
    });

    this.templateForm.get('reason')?.valueChanges.subscribe(reason => {
      const lengthControl = this.templateForm.get('drive_length');
      if (reason === 'HOME') {
        lengthControl?.setValidators([Validators.required, Validators.min(0)]);
      } else {
        lengthControl?.setValidators([Validators.required, Validators.min(1)]);
      }
      lengthControl?.updateValueAndValidity();
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.templateId = params.get('id');
      if (this.templateId) {
        this.isEdit = true;
        this.driveTemplateService.get(this.templateId).subscribe((template) => {
          this.templateForm.patchValue(template);
        });
      } else {
        this.isEdit = false;
        this.templateForm.reset({
          name: '',
          from_location: '',
          to_location: '',
          drive_length: 0,
          reason: 'PRIVATE'
        });
      }
    });
  }

  onSubmit(): void {
    if (this.templateForm.valid) {
      const template: DriveTemplate = {
        ...this.templateForm.value,
        id: this.templateId
      };
      this.driveTemplateService.save(template).subscribe({
        next: () => {
          this.snackBar.open('Vorlage erfolgreich gespeichert', 'OK', {
            duration: 4000,
            panelClass: ['success-snackbar']
          });
          this.router.navigate(['/driveTemplates']);
        },
        error: () => {
          this.snackBar.open('Fehler beim Speichern der Vorlage', 'OK', {
            duration: 4000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  protected readonly Reason = Reason;
}
