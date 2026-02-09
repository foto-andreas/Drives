import { Routes } from '@angular/router';
import {DriveTemplateList} from './drive-template-list/drive-template-list';
import {DriveList} from './drive-list/drive-list';
import {DriveTemplateForm} from './drive-template-form/drive-template-form';
import {DriveForm} from './drive-form/drive-form';

export const routes: Routes = [
  { path: 'drives', component: DriveList, title: "Fahrten" },
  { path: 'drives/new', component: DriveForm, title: "Neue Fahrt" },
  { path: 'drives/edit/:id', component: DriveForm, title: "Fahrt bearbeiten" },
  { path: 'driveTemplates', component: DriveTemplateList, title: "Vorlagenliste" },
  { path: 'driveTemplates/new', component: DriveTemplateForm, title: "Neue Vorlage" },
  { path: 'driveTemplates/edit/:id', component: DriveTemplateForm, title: "Vorlage bearbeiten" },
  { path: '', redirectTo: 'drives/new', pathMatch: 'full' },
];
