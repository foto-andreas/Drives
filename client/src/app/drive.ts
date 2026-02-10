import { ReasonKey } from './reason';
import { DriveTemplate } from './drive-template';

export interface Drive {
  id?: string | null;
  template: DriveTemplate | null;
  date: Date;
  reason?: ReasonKey | null;
}

export interface DriveRequest {
  id?: string | null;
  templateId: string | null;
  date: string;
  reason?: ReasonKey | null;
}
