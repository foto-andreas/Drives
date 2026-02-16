import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { SUPPRESS_GLOBAL_ERROR_TOAST } from './core/interceptors/error.interceptor';
import { ScanEntry, ScanType } from './scan-entry';
import { Drive } from './drive';

@Injectable({
  providedIn: 'root',
})
export class ScanService {
  private readonly http = inject(HttpClient);

  public upload(type: ScanType, timestamp: Date, latitude: number, longitude: number, file: File): Observable<ScanEntry> {
    const formData = new FormData();
    formData.append('type', type);
    formData.append('timestamp', timestamp.toISOString());
    formData.append('latitude', String(latitude));
    formData.append('longitude', String(longitude));
    formData.append('photo', file);

    const context = new HttpContext().set(SUPPRESS_GLOBAL_ERROR_TOAST, true);
    return this.http.post<ScanEntryApiResponse>('/api/scan-entries', formData, { context }).pipe(
      map(entry => this.toScanEntry(entry))
    );
  }

  public getLatestStartIfLatest(): Observable<ScanEntry | null> {
    return this.http.get<ScanEntryApiResponse | null>('/api/scan-entries/latest-start').pipe(
      map(entry => entry ? this.toScanEntry(entry) : null)
    );
  }

  public commitDrive(
    startId: string,
    endId: string,
    startKmStand: number | null,
    endKmStand: number | null,
    startAddress: string | null,
    endAddress: string | null
  ): Observable<Drive> {
    const context = new HttpContext().set(SUPPRESS_GLOBAL_ERROR_TOAST, true);
    return this.http.post<Drive>('/api/scan-entries/commit', {
      startId,
      endId,
      startKmStand,
      endKmStand,
      startAddress,
      endAddress
    }, { context }).pipe(
      map(response => this.toDrive(response))
    );
  }

  private toScanEntry(response: ScanEntryApiResponse): ScanEntry {
    return {
      id: response.id,
      type: response.type,
      timestamp: new Date(response.timestamp),
      latitude: response.latitude,
      longitude: response.longitude,
      address: response.address ?? null,
      kmStand: response.kmStand,
    };
  }

  private toDrive(response: Drive): Drive {
    return {
      ...response,
      date: this.parseDate(response.date as unknown as string | Date),
    };
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

type ScanEntryApiResponse = Omit<ScanEntry, 'timestamp'> & { timestamp: string };
