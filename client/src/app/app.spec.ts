import 'zone.js';
import 'zone.js/testing';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { App } from './app';
import { provideRouter } from '@angular/router';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const titleSpan = Array.from(compiled.querySelectorAll('span')).find(s => s.textContent?.includes('Fahrtenbuch'));
    expect(titleSpan).toBeTruthy();
    expect(titleSpan?.textContent?.trim()).toBe('Fahrtenbuch');
  });
});
