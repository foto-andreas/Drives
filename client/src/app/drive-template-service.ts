import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SUPPRESS_GLOBAL_ERROR_TOAST } from './core/interceptors/error.interceptor';
import { DriveTemplate } from './drive-template';

@Injectable({
  providedIn: 'root',
})
export class DriveTemplateService {
  private readonly http = inject(HttpClient);

  public findAll(): Observable<DriveTemplate[]> {
    return this.http.get<DriveTemplate[]>('/api/driveTemplates');
  }

  public get(id: string): Observable<DriveTemplate> {
    return this.http.get<DriveTemplate>(`/api/driveTemplates/${id}`);
  }

  public save(driveTemplate: DriveTemplate): Observable<DriveTemplate> {
    if (!driveTemplate.id) {
      const context = new HttpContext().set(SUPPRESS_GLOBAL_ERROR_TOAST, true);
      return this.http.put<DriveTemplate>('/api/driveTemplates', driveTemplate, { context });
    }
    const context = new HttpContext().set(SUPPRESS_GLOBAL_ERROR_TOAST, true);
    return this.http.post<DriveTemplate>('/api/driveTemplates', driveTemplate, { context });
  }

  public delete(id: string): Observable<void> {
    return this.http.delete<void>(`/api/driveTemplates/${id}`);
  }

}
