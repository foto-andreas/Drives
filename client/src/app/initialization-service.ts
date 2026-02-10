import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface InitializationStatusResponse { initialized: boolean }

@Injectable({ providedIn: 'root' })
export class InitializationService {
  private readonly http = inject(HttpClient);

  public getStatus(): Observable<InitializationStatusResponse> {
    return this.http.get<InitializationStatusResponse>('/api/initialization-status');
  }
}
