import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Drive } from './drive';
import { DriveFilter } from './drive-filter';

@Injectable({
  providedIn: 'root',
})
export class DriveService {
  private lastSelectedDate: Date = new Date();
  private currentFilter: DriveFilter = {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    reason: null
  };

  constructor(private http: HttpClient) {}

  public getLastSelectedDate(): Date {
    return this.lastSelectedDate;
  }

  public setLastSelectedDate(date: Date): void {
    this.lastSelectedDate = date;
  }

  public getFilter(): DriveFilter {
    return this.currentFilter;
  }

  public setFilter(filter: DriveFilter): void {
    this.currentFilter = filter;
  }

  public findAll(): Observable<Drive[]> {
    return this.http.get<Drive[]>('/api/drives').pipe(
      map(drives => drives.map(d => ({ ...d, date: this.parseDate(d.date) })))
    );
  }

  public get(id: string): Observable<Drive> {
    return this.http.get<Drive>(`/api/drives/${id}`).pipe(
      map(d => ({ ...d, date: this.parseDate(d.date) }))
    );
  }

  public save(drive: any): Observable<Drive> {
    if (!drive.id) {
      return this.http.put<Drive>('/api/drives', drive);
    } else {
      return this.http.post<Drive>('/api/drives', drive);
    }
  }

  public delete(id: string): Observable<void> {
    return this.http.delete<void>(`/api/drives/${id}`);
  }

  public getLatestDriveDate(): Observable<Date | null> {
    return this.http.get<string | null>('/api/latestDrive').pipe(
      map(dateStr => (dateStr ? this.parseDate(dateStr) : null))
    );
  }

  private parseDate(dateStr: any): Date {
    if (dateStr instanceof Date) return dateStr;
    if (typeof dateStr === 'string' && dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      }
    }
    return new Date(dateStr);
  }
}
