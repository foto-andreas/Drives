import { routes } from './app.routes';
import { DriveForm } from './drive-form/drive-form';
import { DriveList } from './drive-list/drive-list';
import { DriveTemplateForm } from './drive-template-form/drive-template-form';
import { DriveTemplateList } from './drive-template-list/drive-template-list';
import { Scan } from './scan/scan';

describe('routes', () => {
  it('should define expected route mappings', async () => {
    const byPath = new Map(routes.map(route => [route.path, route]));

    await expect(byPath.get('drives')?.loadComponent?.()).resolves.toBe(DriveList);
    await expect(byPath.get('drives/new')?.loadComponent?.()).resolves.toBe(DriveForm);
    await expect(byPath.get('drives/edit/:id')?.loadComponent?.()).resolves.toBe(DriveForm);
    await expect(byPath.get('scan')?.loadComponent?.()).resolves.toBe(Scan);
    await expect(byPath.get('driveTemplates')?.loadComponent?.()).resolves.toBe(DriveTemplateList);
    await expect(byPath.get('driveTemplates/new')?.loadComponent?.()).resolves.toBe(DriveTemplateForm);
    await expect(byPath.get('driveTemplates/edit/:id')?.loadComponent?.()).resolves.toBe(DriveTemplateForm);

    const rootRedirect = byPath.get('');
    expect(rootRedirect?.redirectTo).toBe('drives/new');
    expect(rootRedirect?.pathMatch).toBe('full');
  });
});
