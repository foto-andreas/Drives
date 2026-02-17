import { TestBed } from '@angular/core/testing';
import { ScanService } from './scan-service';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

describe('ScanService', () => {
  let service: ScanService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        ScanService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(ScanService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should upload scan entry via POST', () => {
    const file = new File(['123'], 'photo.jpg', { type: 'image/jpeg' });
    const timestamp = new Date('2025-01-01T10:00:00Z');

    service.upload('START', timestamp, 48.1, 11.6, file).subscribe(entry => {
      expect(entry.type).toBe('START');
      expect(entry.kmStand).toBe(12345);
    });

    const req = httpMock.expectOne('/api/scan-entries');
    expect(req.request.method).toBe('POST');
    const body = req.request.body as FormData;
    expect(body.get('type')).toBe('START');
    expect(body.get('timestamp')).toBe(timestamp.toISOString());
    expect(body.get('latitude')).toBe('48.1');
    expect(body.get('longitude')).toBe('11.6');
    expect(body.get('photo')).toBe(file);

    req.flush({
      id: '1',
      type: 'START',
      timestamp: '2025-01-01T10:00:00Z',
      latitude: 48.1,
      longitude: 11.6,
      address: 'Adresse',
      kmStand: 12345
    });
  });

  it('should get latest start entry', () => {
    service.getLatestStartIfLatest().subscribe(entry => {
      expect(entry).not.toBeNull();
      expect(entry?.timestamp).toBeInstanceOf(Date);
    });

    const req = httpMock.expectOne('/api/scan-entries/latest-start');
    expect(req.request.method).toBe('GET');
    req.flush({
      id: '1',
      type: 'START',
      timestamp: '2025-01-01T10:00:00Z',
      latitude: 48.1,
      longitude: 11.6,
      address: 'Adresse',
      kmStand: 12345
    });
  });

  it('should commit drive via POST', () => {
    service.commitDrive('s1', 'e1', 1000, 1012, 'Von', 'Nach', 'WORK').subscribe(drive => {
      expect(drive.id).toBe('d1');
      expect(drive.date).toBeInstanceOf(Date);
    });

    const req = httpMock.expectOne('/api/scan-entries/commit');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      startId: 's1',
      endId: 'e1',
      startKmStand: 1000,
      endKmStand: 1012,
      startAddress: 'Von',
      endAddress: 'Nach',
      reason: 'WORK'
    });

    req.flush({
      id: 'd1',
      date: '2025-01-01',
      template: null,
      reason: 'OTHER',
      fromLocation: 'Von',
      toLocation: 'Nach',
      driveLength: 12
    });
  });

  it('should keep Date instance in parseDate', () => {
    const now = new Date();
    const parsed = (service as any).parseDate(now);
    expect(parsed).toBe(now);
  });

  it('should parse non-iso date strings with Date constructor', () => {
    const parsed = (service as any).parseDate('2025/01/01');
    expect(parsed).toBeInstanceOf(Date);
  });
});
