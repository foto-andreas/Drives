import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators, FormGroupDirective } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { DriveService } from '../drive-service';
import { DriveTemplateService } from '../drive-template-service';
import { DriveTemplate } from '../drive-template';
import { Reason } from '../reason';
import { Observable } from 'rxjs';
import { ViewChild } from '@angular/core';

@Component({
  selector: 'app-drive-form',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatSnackBarModule,
    MatDatepickerModule,
    RouterLink
  ],
  templateUrl: './drive-form.html',
  styleUrl: './drive-form.css'
})
export class DriveForm implements OnInit {
  @ViewChild(FormGroupDirective) private formDirective: FormGroupDirective | undefined;
  protected driveForm: FormGroup;
  protected templates$: Observable<DriveTemplate[]>;
  protected reasons = Reason.keys();
  protected isEdit = false;
  private driveId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private driveService: DriveService,
    private driveTemplateService: DriveTemplateService
  ) {
    this.driveForm = new FormGroup({
      date: new FormControl(this.driveService.getLastSelectedDate(), [Validators.required]),
      template: new FormControl(null, [Validators.required]),
      reason: new FormControl(null)
    });

    this.templates$ = this.driveTemplateService.findAll();
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.driveId = params.get('id');
      if (this.driveId) {
        this.isEdit = true;
        this.driveService.get(this.driveId).subscribe((drive) => {
          this.driveForm.patchValue({
            date: drive.date,
            template: drive.template,
            reason: drive.reason
          });
        });
      }
    });

    this.driveForm.get('template')?.valueChanges.subscribe(template => {
      if (template && !this.isEdit) {
        this.driveForm.patchValue({
          reason: template.reason
        });
      }
    });

    this.driveForm.get('date')?.valueChanges.subscribe(date => {
      if (date) {
        this.driveService.setLastSelectedDate(date);
      }
    });
  }

  onSubmit(): void {
    if (this.driveForm.valid) {
      const formValue = this.driveForm.value;

      const drive = {
        id: this.driveId,
        date: this.formatDate(formValue.date),
        template: formValue.template,
        reason: formValue.reason || null
      };

      this.driveService.save(drive).subscribe({
        next: () => {
          this.snackBar.open('Fahrt erfolgreich gespeichert', 'OK', {
            duration: 4000,
            panelClass: ['success-snackbar']
          });
          if (this.isEdit) {
            this.router.navigate(['/drives']);
          } else {
            this.formDirective?.resetForm({
              date: this.driveService.getLastSelectedDate(),
              template: null,
              reason: null
            });
          }
        },
        error: () => {
          this.snackBar.open('Fehler beim Speichern der Fahrt', 'OK', {
            duration: 4000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  compareTemplates(t1: DriveTemplate, t2: DriveTemplate): boolean {
    return t1 && t2 ? t1.id === t2.id : t1 === t2;
  }

  private formatDate(date: any): string {
    if (!date) return '';
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  }

  protected readonly Reason = Reason;
}
