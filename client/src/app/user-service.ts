import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface UserResponse { name: string; version: string; }

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly nameSignal = signal<string | null>(null);
  private readonly versionSignal = signal<string | null>(null);
  private static readonly invalidVersionTokens = new Set(['undefined', 'unknown', 'null', 'n/a', 'na']);

  public readonly name = this.nameSignal.asReadonly();
  public readonly version = this.versionSignal.asReadonly();

  public load(): void {
    this.http.get<UserResponse>('/api/user').subscribe({
      next: (res) => {
        this.nameSignal.set(res?.name ?? null);
        this.versionSignal.set(this.normalizeVersion(res?.version));
      },
      error: () => {
        this.nameSignal.set(null);
      },
    });
  }

  private normalizeVersion(version: unknown): string | null {
    if (typeof version !== 'string') return null;
    const trimmed = version.trim();
    if (!trimmed) return null;
    const stripped = trimmed.replace(/^['"]+|['"]+$/g, '').trim();
    if (!stripped) return null;
    if (UserService.invalidVersionTokens.has(stripped.toLowerCase())) return null;
    return stripped;
  }
}
