import {Inject, Injectable, Signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {DriveTemplate} from './drive-template';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DriveTemplateService {

  constructor(private http: HttpClient) {
  }

  public findAll(): Observable<DriveTemplate[]> {
    return this.http.get<DriveTemplate[]>("/api/driveTemplates");
  }

  public get(id: string): Observable<DriveTemplate> {
    return this.http.get<DriveTemplate>(`/api/driveTemplates/${id}`);
  }

  public save(driveTemplate: DriveTemplate): Observable<DriveTemplate> {
    if (!driveTemplate.id) {
      return this.http.put<DriveTemplate>("/api/driveTemplates", driveTemplate);
    } else {
      return this.http.post<DriveTemplate>("/api/driveTemplates", driveTemplate);
    }
  }

  public delete(id: string): Observable<void> {
    return this.http.delete<void>(`/api/driveTemplates/${id}`);
  }

}
