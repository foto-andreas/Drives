import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { NgIf, NgClass } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-notification-toast',
  standalone: true,
  imports: [NgIf, NgClass, MatIconModule, MatButtonModule],
  template: `
    <div class="app-toast" [ngClass]="type">
      <span class="app-toast__icon" *ngIf="type === 'error'">
        <mat-icon>error</mat-icon>
      </span>
      <span class="app-toast__icon" *ngIf="type === 'success'">
        <mat-icon>check_circle</mat-icon>
      </span>
      <span class="app-toast__message">{{ message }}</span>
      <button class="app-toast__action" mat-icon-button aria-label="Schließen" (click)="close.emit()">
        <mat-icon>close</mat-icon>
      </button>
    </div>
  `,
  styles: [
    `
    .app-toast { display: flex; align-items: center; gap: 8px; padding: 12px 14px; border-radius: 6px; box-shadow: 0 6px 12px rgba(0,0,0,.2); color: #fff; min-width: 280px; max-width: 520px; }
    .app-toast.error { background: #c62828; }
    .app-toast.success { background: #2e7d32; }
    .app-toast__icon mat-icon { color: #fff; }
    .app-toast__message { flex: 1; line-height: 1.3; }
    .app-toast__action mat-icon { color: #fff; }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationToastComponent {
  @Input() message = '';
  @Input() type: 'error' | 'success' = 'success';
  @Output() close = new EventEmitter<void>();
}
