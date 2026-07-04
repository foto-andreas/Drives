import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { Router, RouterLink } from '@angular/router';
import { BehaviorSubject, switchMap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { DriveTemplateService } from '../drive-template-service';
import { Reason } from '../reason';
import { ReasonHelper } from '../reason-helper';

@Component({
  selector: 'app-drive-template-list',
  templateUrl: './drive-template-list.html',
  styleUrls: ['./drive-template-list.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatSnackBarModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    RouterLink,
  ],
})
export class DriveTemplateList {

  private readonly driveTemplateService = inject(DriveTemplateService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  private readonly refresh$ = new BehaviorSubject<void>(undefined);
  protected readonly driveTemplates = toSignal(
    this.refresh$.pipe(switchMap(() => this.driveTemplateService.findAll())),
    { initialValue: [] }
  );
  protected readonly displayedColumns: string[] = ['Name', 'VonNach', 'Länge', 'Grund', 'Aktion'];

  editTemplate(id: string): void {
    this.router.navigate(['/driveTemplates/edit', id]);
  }

  deleteTemplate(id: string): void {
    if (this.confirmDeletion('Vorlage')) {
      this.driveTemplateService.delete(id).subscribe({
        next: () => {
          this.snackBar.open('Vorlage erfolgreich gelöscht', 'Schließen', {
            duration: 4000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            panelClass: ['success-snackbar']
          });
          this.refresh$.next();
        },
        error: (err) => {
          const serverMsg = err && typeof err === 'object'
            ? (err.error && typeof err.error === 'object' && err.error.message ? err.error.message : err.message)
            : '';
          const statusText = err && err.status ? `\n(Status ${err.status})` : '';
          const full = `Fehler beim Löschen der Vorlage${serverMsg ? ': \n\n' + serverMsg : ''}${statusText}`;
          this.snackBar.open(full, 'Schließen', {
            duration: 4000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  protected confirmDeletion(type: string): boolean {
    const confirmFn: unknown = window.confirm;
    if (typeof confirmFn !== 'function') return false;

    // In jsdom window.confirm is not implemented and emits noisy warnings unless explicitly mocked.
    const isJsdm = typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent);
    if (isJsdm && !('mock' in (confirmFn as object))) {
      return false;
    }

    return confirmFn(`Möchten Sie diese ${type} wirklich löschen?`);
  }

  protected readonly Reason = Reason;
  protected readonly ReasonHelper = ReasonHelper;
}
