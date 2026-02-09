import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Drive } from './drive';

@Injectable({
  providedIn: 'root',
})
export class DriveService {
  private lastSelectedDate: Date = new Date();

  constructor(private http: HttpClient) {}

  public getLastSelectedDate(): Date {
    return this.lastSelectedDate;
  }

  public setLastSelectedDate(date: Date): void {
    this.lastSelectedDate = date;
  }

  public findAll(): Observable<Drive[]> {
    return this.http.get<Drive[]>('/api/drives');
  }

  public get(id: string): Observable<Drive> {
    return this.http.get<Drive>(`/api/drives/${id}`);
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
}
