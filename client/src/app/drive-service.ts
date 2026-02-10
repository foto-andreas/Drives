import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { SUPPRESS_GLOBAL_ERROR_TOAST } from './core/interceptors/error.interceptor';
import { Drive, DriveRequest } from './drive';
import { DriveFilter } from './drive-filter';

@Injectable({
  providedIn: 'root',
})
export class DriveService {
  private readonly http = inject(HttpClient);
  private readonly lastSelectedDateSignal = signal<Date>(new Date());
  private readonly currentFilterSignal = signal<DriveFilter>({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    reason: null,
  });

  public readonly lastSelectedDate = this.lastSelectedDateSignal.asReadonly();
  public readonly currentFilter = this.currentFilterSignal.asReadonly();

  public setLastSelectedDate(date: Date): void {
    this.lastSelectedDateSignal.set(date);
  }

  public setFilter(filter: DriveFilter): void {
    this.currentFilterSignal.set(filter);
  }

  public findAll(filter?: DriveFilter | null): Observable<Drive[]> {
    const params: Record<string, string> = {};
    const effective = filter ?? this.currentFilter();
    if (effective.year) params['year'] = String(effective.year);
    if (effective.month) params['month'] = String(effective.month);
    if (effective.reason) params['reason'] = String(effective.reason);
    const options = Object.keys(params).length ? { params } : {};
    return this.http.get<DriveApiResponse[]>('/api/drives', options).pipe(
      map(drives => drives.map(drive => this.toDrive(drive)))
    );
  }

  public get(id: string): Observable<Drive> {
    return this.http.get<DriveApiResponse>(`/api/drives/${id}`).pipe(
      map(drive => this.toDrive(drive))
    );
  }

  public save(drive: Drive): Observable<Drive> {
    const request = this.toRequest(drive);
    const context = new HttpContext().set(SUPPRESS_GLOBAL_ERROR_TOAST, true);
    if (!drive.id) {
      return this.http.put<DriveApiResponse>('/api/drives', request, { context }).pipe(
        map(response => this.toDrive(response))
      );
    }
    return this.http.post<DriveApiResponse>('/api/drives', request, { context }).pipe(
      map(response => this.toDrive(response))
    );
  }

  public delete(id: string): Observable<void> {
    const context = new HttpContext().set(SUPPRESS_GLOBAL_ERROR_TOAST, true);
    return this.http.delete<void>(`/api/drives/${id}`, { context });
  }

  public getLatestDriveDate(): Observable<Date | null> {
    return this.http.get<string | null>('/api/latestDrive').pipe(
      map(dateStr => (dateStr ? this.parseDate(dateStr) : null))
    );
  }

  private toRequest(drive: Drive): DriveRequest {
    return {
      id: drive.id ?? null,
      templateId: drive.template?.id ?? null,
      date: this.toDateString(drive.date),
      reason: drive.reason ?? null,
    };
  }

  private toDrive(response: DriveApiResponse): Drive {
    return {
      id: response.id ?? null,
      template: response.template ?? null,
      date: this.parseDate(response.date),
      reason: response.reason ?? null,
    };
  }

  private toDateString(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private parseDate(dateStr: string | Date): Date {
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

type DriveApiResponse = Omit<Drive, 'date'> & { date: string };
