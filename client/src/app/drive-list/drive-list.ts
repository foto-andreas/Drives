import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterLink } from '@angular/router';
import { take } from 'rxjs';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, switchMap } from 'rxjs';
import { DriveService } from '../drive-service';
import { DriveFilter } from '../drive-filter';
import { Reason } from '../reason';
import { ReasonHelper } from '../reason-helper';

@Component({
  selector: 'app-drive-list',
  templateUrl: './drive-list.html',
  styleUrls: ['./drive-list.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatFormFieldModule,
    MatSelectModule,
    RouterLink,
  ],
})
export class DriveList {
  private readonly driveService = inject(DriveService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private readonly now = new Date();
  private readonly refresh$ = new BehaviorSubject<void>(undefined);
  private readonly initialFilter = this.driveService.currentFilter();
  private readonly filterSignal = signal<DriveFilter>(this.initialFilter);

  protected readonly displayedColumns: string[] = ['Datum', 'Template', 'Länge', 'Grund', 'Aktion'];
  protected readonly reasons = ReasonHelper.keys();
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

  protected readonly filterForm = new FormGroup({
    year: new FormControl<number | null>(this.initialFilter.year),
    month: new FormControl<number | null>(this.initialFilter.month),
    reason: new FormControl<string | null>(this.initialFilter.reason),
  });

  protected readonly allDrives = toSignal(
    this.refresh$.pipe(switchMap(() => this.driveService.findAll())),
    { initialValue: [] }
  );

  protected readonly availableYears = computed(() => {
    const years = new Set<number>();
    years.add(this.now.getFullYear());
    this.allDrives().forEach(drive => years.add(drive.date.getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  });

  protected readonly drives = computed(() => {
    const filter = this.filterSignal();
    return this.allDrives().filter(drive => {
      const driveDate = drive.date;
      const yearMatch = !filter.year || driveDate.getFullYear() === filter.year;
      const monthMatch = !filter.month || driveDate.getMonth() + 1 === filter.month;
      const reasonMatch = !filter.reason || drive.reason === filter.reason;
      return yearMatch && monthMatch && reasonMatch;
    });
  });

  private touchStartX = 0;
  private touchStartY = 0;
  private isActuallySwiping = false;
  protected swipedRowId: string | null = null;
  protected currentSwipeOffset = 0;

  constructor() {
    this.filterForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        const filter: DriveFilter = {
          year: value.year ?? null,
          month: value.month ?? null,
          reason: value.reason ?? null,
        };
        if (!filter.year && filter.month) {
          filter.month = null;
          this.filterForm.controls.month.setValue(null, { emitEvent: false });
        }
        this.filterSignal.set(filter);
        this.driveService.setFilter(filter);
      });
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
    const drives = this.drives();
    const filter = this.filterSignal();
    const isHomeOffice = filter.reason === 'HOME';
    const headers = ['Datum', 'Vorlage', 'Von', 'Nach', 'Grund', isHomeOffice ? 'Anzahl' : 'Länge', isHomeOffice ? 'Summierung' : 'Summe'];

    let runningTotal = 0;
    const rows = drives.map(drive => {
      const separator = ';';
      const escape = '"';
      const date = drive.date;
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const dateStr = `${day}.${month}.${year}`;
      const templateName = drive.template?.name ?? '';
      const from = drive.template?.fromLocation ?? '';
      const to = drive.template?.toLocation ?? '';
      const reason = ReasonHelper.toString(drive.reason || drive.template?.reason);
      const length = isHomeOffice ? 1 : drive.template?.driveLength ?? 0;
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
      headers.map(h => `"${h}"`).join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const reasonPart = filter.reason ? ReasonHelper.toString(filter.reason) : 'Alle';
    const yearPart = filter.year ?? 'Alle';
    const monthPart = filter.month ? this.months.find(m => m.value === filter.month)?.name : 'Alle';
    const filename = `Fahrtenbuch_${reasonPart}_${yearPart}_${monthPart}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  protected confirmDeletion(type: string): boolean {
    return window.confirm(`Möchten Sie diese ${type} wirklich löschen?`);
  }

  protected readonly Reason = Reason;
  protected readonly ReasonHelper = ReasonHelper;
}
