import {Component, OnInit} from '@angular/core';
import {DriveTemplateService} from '../drive-template-service';
import {DriveTemplate} from '../drive-template';
import {BehaviorSubject, Observable, switchMap} from 'rxjs';
import {MatTableModule} from '@angular/material/table';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import {CommonModule} from '@angular/common';
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';

import {Reason} from '../reason';

@Component({
  selector: 'app-drive-template-list',
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    RouterLink,
    CommonModule
  ],
  templateUrl: './drive-template-list.html',
  styleUrl: './drive-template-list.css',
})
export class DriveTemplateList implements OnInit {

  private refresh$ = new BehaviorSubject<void>(undefined);
  public driveTemplates$: Observable<DriveTemplate[]>;
  protected displayedColumns: string[] = ['Name', 'VonNach', 'Länge', 'Grund', 'Aktion'];

  private touchStartX = 0;
  private touchStartY = 0;
  private isActuallySwiping = false;
  protected swipedRowId: string | null = null;
  protected currentSwipeOffset: number = 0;

  constructor(
    private driveTemplateService: DriveTemplateService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.driveTemplates$ = this.refresh$.pipe(
      switchMap(() => this.driveTemplateService.findAll())
    );
  }

  ngOnInit(): void {
  }

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
}
