import { TestBed } from '@angular/core/testing';
import { DriveTemplateService } from './drive-template-service';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

describe('DriveTemplateService', () => {
  let service: DriveTemplateService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DriveTemplateService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(DriveTemplateService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should findAll via GET', () => {
    const mockTemplates = [{ id: '1' }];
    service.findAll().subscribe(templates => {
      expect(templates).toEqual(mockTemplates as any);
    });
    const req = httpMock.expectOne('/api/driveTemplates');
    expect(req.request.method).toBe('GET');
    req.flush(mockTemplates);
  });

  it('should get by id via GET', () => {
    const mockTemplate = { id: '1' };
    service.get('1').subscribe(template => {
      expect(template).toEqual(mockTemplate as any);
    });
    const req = httpMock.expectOne('/api/driveTemplates/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockTemplate);
  });

  it('should save new via PUT', () => {
    const template = { name: 'test' };
    service.save(template as any).subscribe();
    const req = httpMock.expectOne('/api/driveTemplates');
    expect(req.request.method).toBe('PUT');
    req.flush(template);
  });

  it('should save existing via POST', () => {
    const template = { id: '1', name: 'test' };
    service.save(template as any).subscribe();
    const req = httpMock.expectOne('/api/driveTemplates');
    expect(req.request.method).toBe('POST');
    req.flush(template);
  });

  it('should delete via DELETE', () => {
    service.delete('1').subscribe();
    const req = httpMock.expectOne('/api/driveTemplates/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
