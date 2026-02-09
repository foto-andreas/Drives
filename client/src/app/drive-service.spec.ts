import { TestBed } from '@angular/core/testing';
import { DriveService } from './drive-service';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

describe('DriveService', () => {
  let service: DriveService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DriveService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(DriveService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should store and retrieve the last selected date', () => {
    const testDate = new Date(2023, 10, 15);
    service.setLastSelectedDate(testDate);
    expect(service.getLastSelectedDate()).toEqual(testDate);
  });

  it('should findAll via GET', () => {
    const mockDrives = [{ id: '1' }];
    service.findAll().subscribe(drives => {
      expect(drives).toEqual(mockDrives as any);
    });
    const req = httpMock.expectOne('/api/drives');
    expect(req.request.method).toBe('GET');
    req.flush(mockDrives);
  });

  it('should get by id via GET', () => {
    const mockDrive = { id: '1' };
    service.get('1').subscribe(drive => {
      expect(drive).toEqual(mockDrive as any);
    });
    const req = httpMock.expectOne('/api/drives/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockDrive);
  });

  it('should save new via PUT', () => {
    const drive = { name: 'test' };
    service.save(drive).subscribe();
    const req = httpMock.expectOne('/api/drives');
    expect(req.request.method).toBe('PUT');
    req.flush(drive);
  });

  it('should save existing via POST', () => {
    const drive = { id: '1', name: 'test' };
    service.save(drive).subscribe();
    const req = httpMock.expectOne('/api/drives');
    expect(req.request.method).toBe('POST');
    req.flush(drive);
  });

  it('should delete via DELETE', () => {
    service.delete('1').subscribe();
    const req = httpMock.expectOne('/api/drives/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
