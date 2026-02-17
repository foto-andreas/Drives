import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserService } from './user-service';
import { InitializationService } from './initialization-service';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    RouterOutlet,
    MatToolbarModule,
    MatSidenavModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatSnackBarModule,
  ],
})
export class App implements OnInit {
  private readonly userService = inject(UserService);
  private readonly initializationService = inject(InitializationService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly title = signal('Fahrtenbuch');
  protected readonly userName = this.userService.name;
  protected readonly isMobile = signal(false);

  ngOnInit() {
    this.breakpointObserver.observe([Breakpoints.Handset])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => this.isMobile.set(result.matches));

    this.userService.load();
    this.initializationService.getStatus().subscribe({
      next: (res) => {
        if (res?.initialized) {
          this.snackBar.open('Datenbank wurde initialisiert', 'Schließen', {
            duration: 4000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            panelClass: ['success-snackbar']
          });
        }
      },
      error: () => {
        return;
      }
    });
  }
}
