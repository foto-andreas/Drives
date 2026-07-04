import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'drives', loadComponent: () => import('./drive-list/drive-list').then(m => m.DriveList), title: "Fahrten" },
  { path: 'drives/new', loadComponent: () => import('./drive-form/drive-form').then(m => m.DriveForm), title: "Neue Fahrt" },
  { path: 'drives/edit/:id', loadComponent: () => import('./drive-form/drive-form').then(m => m.DriveForm), title: "Fahrt bearbeiten" },
  { path: 'scan', loadComponent: () => import('./scan/scan').then(m => m.Scan), title: "Scannen" },
  { path: 'driveTemplates', loadComponent: () => import('./drive-template-list/drive-template-list').then(m => m.DriveTemplateList), title: "Vorlagenliste" },
  { path: 'driveTemplates/new', loadComponent: () => import('./drive-template-form/drive-template-form').then(m => m.DriveTemplateForm), title: "Neue Vorlage" },
  { path: 'driveTemplates/edit/:id', loadComponent: () => import('./drive-template-form/drive-template-form').then(m => m.DriveTemplateForm), title: "Vorlage bearbeiten" },
  { path: '', redirectTo: 'drives/new', pathMatch: 'full' },
];
