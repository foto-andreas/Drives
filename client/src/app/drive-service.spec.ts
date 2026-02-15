import { TestBed } from '@angular/core/testing';
import { DriveService } from './drive-service';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

describe('DriveService', () => {
  let service: DriveService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
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
    expect(service.lastSelectedDate()).toEqual(testDate);
  });

  it('should store and retrieve the filter', () => {
    const filter = { year: 2022, month: 5, reason: 'Business' };
    service.setFilter(filter);
    expect(service.currentFilter()).toEqual(filter);
  });

  it('should have initial filter with current year and month', () => {
    const filter = service.currentFilter();
    const now = new Date();
    expect(filter.year).toBe(now.getFullYear());
    expect(filter.month).toBe(now.getMonth() + 1);
    expect(filter.reason).toBeNull();
  });

  it('should findAll via GET', () => {
    const mockDrives = [{ id: '1', date: '2023-10-15' }];
    service.findAll().subscribe(drives => {
      expect(drives.length).toBe(1);
      expect(drives[0].id).toBe('1');
      expect(drives[0].date).toBeInstanceOf(Date);
      expect(drives[0].date.getFullYear()).toBe(2023);
      expect(drives[0].date.getMonth()).toBe(9); // 0-based
      expect(drives[0].date.getDate()).toBe(15);
    });
    const now = new Date();
    const expectedUrl = `/api/drives?year=${now.getFullYear()}&month=${now.getMonth() + 1}`;
    const req = httpMock.expectOne(expectedUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockDrives);
  });

  it('should get by id via GET', () => {
    const mockDrive = { id: '1', date: '2023-10-15' };
    service.get('1').subscribe(drive => {
      expect(drive.id).toBe('1');
      expect(drive.date).toBeInstanceOf(Date);
      expect(drive.date.getFullYear()).toBe(2023);
      expect(drive.date.getMonth()).toBe(9);
      expect(drive.date.getDate()).toBe(15);
    });
    const req = httpMock.expectOne('/api/drives/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockDrive);
  });

  it('should save new via PUT', () => {
    const drive = { date: new Date(2023, 9, 15), template: null } as any;
    service.save(drive).subscribe();
    const req = httpMock.expectOne('/api/drives');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.templateId).toBeNull();
    expect(req.request.body.date).toBe('2023-10-15');
    req.flush({ id: '1', date: '2023-10-15', template: null, reason: null });
  });

  it('should save existing via POST', () => {
    const drive = { id: '1', date: new Date(2023, 9, 15), template: null } as any;
    service.save(drive).subscribe();
    const req = httpMock.expectOne('/api/drives');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.id).toBe('1');
    req.flush({ id: '1', date: '2023-10-15', template: null, reason: null });
  });

  it('should delete via DELETE', () => {
    service.delete('1').subscribe();
    const req = httpMock.expectOne('/api/drives/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should get years via GET', () => {
    const mockYears = [2024, 2023];
    service.getYears().subscribe(years => {
      expect(years).toEqual(mockYears);
    });
    const req = httpMock.expectOne('/api/drives/years');
    expect(req.request.method).toBe('GET');
    req.flush(mockYears);
  });
});
