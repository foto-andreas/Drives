import { LOCALE_ID, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { LayoutModule } from '@angular/cdk/layout';
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTooltipModule } from '@angular/material/tooltip';
import { provideLuxonDateAdapter } from '@angular/material-luxon-adapter';
import { App } from './app';
import { routes } from './app.routes';
import { MY_DATE_FORMATS } from './app.config';
import { DriveList } from './drive-list/drive-list';
import { DriveForm } from './drive-form/drive-form';
import { DriveTemplateList } from './drive-template-list/drive-template-list';
import { DriveTemplateForm } from './drive-template-form/drive-template-form';

registerLocaleData(localeDe);

@NgModule({
  declarations: [
    App,
    DriveList,
    DriveForm,
    DriveTemplateList,
    DriveTemplateForm,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    ReactiveFormsModule,
    LayoutModule,
    RouterModule.forRoot(routes, { useHash: true }),
    MatToolbarModule,
    MatSidenavModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatTableModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSnackBarModule,
    MatInputModule,
    MatDatepickerModule,
    MatTooltipModule,
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'de-DE' },
    { provide: MAT_DATE_LOCALE, useValue: 'de-DE' },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
    provideLuxonDateAdapter(MY_DATE_FORMATS),
  ],
  bootstrap: [App],
})
export class AppModule {}
