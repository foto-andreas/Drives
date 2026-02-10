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

  private touchStartX = 0;
  private touchStartY = 0;
  private isActuallySwiping = false;
  protected swipedRowId: string | null = null;
  protected currentSwipeOffset: number = 0;

  editTemplate(id: string): void {
    if (this.isActuallySwiping) return;
    this.router.navigate(['/driveTemplates/edit', id]);
  }

  onRowTouchStart(event: TouchEvent, id: string): void {
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
    this.swipedRowId = id;
    this.currentSwipeOffset = 0;
    this.isActuallySwiping = false;
  }

  onRowTouchMove(event: TouchEvent): void {
    if (!this.swipedRowId) return;

    const currentX = event.touches[0].clientX;
    const currentY = event.touches[0].clientY;

    const deltaX = this.touchStartX - currentX;
    const deltaY = Math.abs(this.touchStartY - currentY);

    // Wenn es eher ein horizontaler Swipe nach links ist
    if (deltaX > 10 && deltaX > deltaY) {
      this.isActuallySwiping = true;
      this.currentSwipeOffset = deltaX;
      // Verhindere vertikales Scrollen während des Swipes
      if (event.cancelable) {
        event.preventDefault();
      }
    } else if (deltaX <= 0) {
      this.currentSwipeOffset = 0;
    }
  }

  onRowTouchEnd(event: TouchEvent, elementId: string): void {
    const deltaX = this.currentSwipeOffset;
    const touchEndY = event.changedTouches?.length > 0 ? event.changedTouches[0].clientY : this.touchStartY;
    const deltaY = Math.abs(this.touchStartY - touchEndY);
    const isDelete = deltaX > 50 && deltaY < deltaX * 0.5;

    // UI-Zustand sofort zurücksetzen, damit die Zeile zurückgleitet
    this.swipedRowId = null;
    this.currentSwipeOffset = 0;

    if (isDelete) {
      // Verzögerung, damit die UI aktualisiert werden kann und Klicks blockiert bleiben
      setTimeout(() => {
        this.deleteTemplate(elementId);
        this.isActuallySwiping = false;
      }, 50);
    } else {
      setTimeout(() => {
        this.isActuallySwiping = false;
      }, 50);
    }
  }

  deleteTemplate(id: string): void {
    if (this.confirmDeletion('Vorlage')) {
      this.driveTemplateService.delete(id).subscribe({
        next: () => {
          this.snackBar.open('Vorlage erfolgreich gelöscht', 'OK', {
            duration: 4000,
            panelClass: ['success-snackbar']
          });
          this.refresh$.next();
        },
        error: (err) => {
          if (err.status === 409) {
            this.snackBar.open('Diese Vorlage wird noch in Fahrten verwendet', 'OK', {
              duration: 4000,
              panelClass: ['error-snackbar']
            });
          } else {
            this.snackBar.open('Fehler beim Löschen der Vorlage', 'OK', {
              duration: 4000,
              panelClass: ['error-snackbar']
            });
          }
        }
      });
    }
  }

  protected confirmDeletion(type: string): boolean {
    return window.confirm(`Möchten Sie diese ${type} wirklich löschen?`);
  }

  protected readonly Reason = Reason;
  protected readonly ReasonHelper = ReasonHelper;
}
