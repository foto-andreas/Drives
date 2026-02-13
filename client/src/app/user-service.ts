import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface UserResponse { name: string; version: string; }

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly nameSignal = signal<string | null>(null);
  private readonly versionSignal = signal<string | null>(null);

  public readonly name = this.nameSignal.asReadonly();
  public readonly version = this.versionSignal.asReadonly();

  public load(): void {
    this.http.get<UserResponse>('/api/user').subscribe({
      next: (res) => {
        this.nameSignal.set(res?.name ?? null);
        this.versionSignal.set(res?.version ?? null);
      },
      error: () => {
        this.nameSignal.set(null);
        this.versionSignal.set(null);
      },
    });
  }
}
