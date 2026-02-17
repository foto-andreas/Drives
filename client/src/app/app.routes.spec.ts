import { routes } from './app.routes';
import { DriveForm } from './drive-form/drive-form';
import { DriveList } from './drive-list/drive-list';
import { DriveTemplateForm } from './drive-template-form/drive-template-form';
import { DriveTemplateList } from './drive-template-list/drive-template-list';
import { Scan } from './scan/scan';

describe('routes', () => {
  it('should define expected route mappings', () => {
    const byPath = new Map(routes.map(route => [route.path, route]));

    expect(byPath.get('drives')?.component).toBe(DriveList);
    expect(byPath.get('drives/new')?.component).toBe(DriveForm);
    expect(byPath.get('drives/edit/:id')?.component).toBe(DriveForm);
    expect(byPath.get('scan')?.component).toBe(Scan);
    expect(byPath.get('driveTemplates')?.component).toBe(DriveTemplateList);
    expect(byPath.get('driveTemplates/new')?.component).toBe(DriveTemplateForm);
    expect(byPath.get('driveTemplates/edit/:id')?.component).toBe(DriveTemplateForm);

    const rootRedirect = byPath.get('');
    expect(rootRedirect?.redirectTo).toBe('drives/new');
    expect(rootRedirect?.pathMatch).toBe('full');
  });
});
