import { Component } from '@angular/core';
import { DriveService } from '../drive-service';
import { Drive } from '../drive';
import { BehaviorSubject, combineLatest, map, Observable, shareReplay, switchMap, take } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Reason } from '../reason';
import { DriveFilter } from '../drive-filter';

@Component({
  selector: 'app-drive-list',
  standalone: true,
  imports: [
    MatTableModule,
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
    MatSnackBarModule,
    RouterLink
  ],
  templateUrl: './drive-list.html',
  styleUrl: './drive-list.css',
})
export class DriveList {

  private now = new Date();

  private refresh$ = new BehaviorSubject<void>(undefined);
  private allDrives$: Observable<Drive[]>;
  public drives$: Observable<Drive[]>;
  protected displayedColumns: string[] = ['Datum', 'Template', 'Länge', 'Grund', 'Aktion'];

  protected selectedYear: number | null;
  protected selectedMonth: number | null;
  protected selectedReason: string | null;
  protected availableYears: number[] = [this.now.getFullYear()];
  protected reasons = Reason.keys();
  protected readonly months = [
    { value: 1, name: 'Januar' },
    { value: 2, name: 'Februar' },
    { value: 3, name: 'März' },
    { value: 4, name: 'April' },
    { value: 5, name: 'Mai' },
    { value: 6, name: 'Juni' },
    { value: 7, name: 'Juli' },
    { value: 8, name: 'August' },
    { value: 9, name: 'September' },
    { value: 10, name: 'Oktober' },
    { value: 11, name: 'November' },
    { value: 12, name: 'Dezember' }
  ];

  private filterSubject: BehaviorSubject<DriveFilter>;

  private touchStartX = 0;
  private touchStartY = 0;
  private isActuallySwiping = false;
  protected swipedRowId: string | null = null;
  protected currentSwipeOffset: number = 0;

  constructor(
    private driveService: DriveService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    const filter = this.driveService.getFilter();
    this.selectedYear = filter.year;
    this.selectedMonth = filter.month;
    this.selectedReason = filter.reason;
    this.filterSubject = new BehaviorSubject<DriveFilter>(filter);

    this.allDrives$ = this.refresh$.pipe(
      switchMap(() => this.driveService.findAll()),
      map(drives => {
        const years = new Set<number>();
        years.add(this.now.getFullYear());
        drives.forEach(d => {
          if (d.date) {
            years.add(new Date(d.date).getFullYear());
          }
        });
        this.availableYears = Array.from(years).sort((a, b) => b - a);
        return drives;
      }),
      shareReplay(1)
    );

    this.drives$ = combineLatest([this.allDrives$, this.filterSubject]).pipe(
      map(([drives, filter]) => {
        return drives.filter(d => {
          if (!d.date) return false;
          const driveDate = new Date(d.date);
          const yearMatch = !filter.year || driveDate.getFullYear() === filter.year;
          const monthMatch = !filter.month || (driveDate.getMonth() + 1) === filter.month;
          const reasonMatch = !filter.reason || d.reason === filter.reason;
          return yearMatch && monthMatch && reasonMatch;
        });
      })
    );
  }

  onYearChange(): void {
    if (this.selectedYear === null) {
      this.selectedMonth = null;
    }
    this.updateFilter();
  }

  onMonthChange(): void {
    this.updateFilter();
  }

  onReasonChange(): void {
    this.updateFilter();
  }

  private updateFilter(): void {
    const filter = {
      year: this.selectedYear,
      month: this.selectedMonth,
      reason: this.selectedReason
    };
    this.driveService.setFilter(filter);
    this.filterSubject.next(filter);
  }

  editDrive(id: string): void {
    if (this.isActuallySwiping) return;
    this.router.navigate(['/drives/edit', id]);
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
        this.deleteDrive(elementId);
        this.isActuallySwiping = false;
      }, 50);
    } else {
      setTimeout(() => {
        this.isActuallySwiping = false;
      }, 50);
    }
  }

  deleteDrive(id: string): void {
    if (this.confirmDeletion('Fahrt')) {
      this.driveService.delete(id).subscribe({
        next: () => {
          this.snackBar.open('Fahrt erfolgreich gelöscht', 'OK', {
            duration: 4000,
            panelClass: ['success-snackbar']
          });
          this.refresh$.next();
        },
        error: () => {
          this.snackBar.open('Fehler beim Löschen der Fahrt', 'OK', {
            duration: 4000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  exportToCsv(): void {
    this.drives$.pipe(take(1)).subscribe(drives => {
      const separator = ';';
      const escape = '"';

      const headers = ['Datum', 'Vorlage', 'Von', 'Nach', 'Grund', 'Länge', 'Summe'];

      let runningTotal = 0;
      const rows = drives.map(drive => {
        let dateStr = '';
        if (drive.date) {
          const d = new Date(drive.date);
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const year = d.getFullYear();
          dateStr = `${day}.${month}.${year}`;
        }
        const templateName = drive.template?.name || '';
        const from = drive.template?.from_location || '';
        const to = drive.template?.to_location || '';
        const reason = Reason.toString(drive.reason || drive.template?.reason);
        const length = drive.template?.drive_length || 0;
        runningTotal += length;

        return [
          dateStr,
          templateName,
          from,
          to,
          reason,
          length.toString().replace('.', ','),
          runningTotal.toString().replace('.', ',')
        ].map(val => `${escape}${val.replace(new RegExp(escape, 'g'), escape + escape)}${escape}`);
      });

      const csvContent = [
        headers.map(h => `${escape}${h}${escape}`).join(separator),
        ...rows.map(row => row.join(separator))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      const reasonPart = this.selectedReason ? Reason.toString(this.selectedReason) : 'Alle';
      const yearPart = this.selectedYear || 'Alle';
      const monthPart = this.selectedMonth ? this.months.find(m => m.value === this.selectedMonth)?.name : 'Alle';
      const filename = `Fahrtenbuch_${reasonPart}_${yearPart}_${monthPart}.csv`;

      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }

  protected confirmDeletion(type: string): boolean {
    return window.confirm(`Möchten Sie diese ${type} wirklich löschen?`);
  }

  protected readonly Reason = Reason;
}
