import { Injectable, Injector, inject } from '@angular/core';
import { Overlay, OverlayConfig, GlobalPositionStrategy, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { NotificationToastComponent } from './notification.component';

interface ToastInstance {
  overlayRef: OverlayRef;
  dispose: () => void;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly overlay = inject(Overlay);
  private readonly injector = inject(Injector);
  private activeToasts: ToastInstance[] = [];

  success(message: string, duration = 4000): void {
    this.open(message, 'success', duration);
  }

  error(message: string, duration = 4000): void {
    this.open(message, 'error', duration);
  }

  private open(message: string, type: 'success' | 'error', duration: number): void {
    const config = new OverlayConfig({
      positionStrategy: this.overlay.position().global().centerHorizontally().top('0px'),
      hasBackdrop: false,
      scrollStrategy: this.overlay.scrollStrategies.noop(),
      panelClass: ['app-toast-panel']
    });

    const overlayRef = this.overlay.create(config);
    const portal = new ComponentPortal(NotificationToastComponent, null, this.injector);
    const componentRef = overlayRef.attach(portal);
    componentRef.instance.message = message;
    componentRef.instance.type = type;

    const toastInstance: ToastInstance = {
      overlayRef,
      dispose: () => {
        if (overlayRef.hasAttached()) {
          overlayRef.detach();
        }
        overlayRef.dispose();
        this.activeToasts = this.activeToasts.filter(t => t !== toastInstance);
        this.updatePositions();
      }
    };

    this.activeToasts.push(toastInstance);
    this.updatePositions();

    const sub = componentRef.instance.close.subscribe(() => {
      toastInstance.dispose();
      sub.unsubscribe();
    });

    if (duration && duration > 0) {
      setTimeout(() => {
        toastInstance.dispose();
      }, duration);
    }
  }

  private updatePositions(): void {
    this.activeToasts.forEach((toast, index) => {
      const offsetY = 16 + index * 80;
      const positionStrategy = this.overlay
        .position()
        .global()
        .centerHorizontally()
        .top(`${offsetY}px`);

      toast.overlayRef.updatePositionStrategy(positionStrategy);
      toast.overlayRef.updatePosition();
    });
  }
}
