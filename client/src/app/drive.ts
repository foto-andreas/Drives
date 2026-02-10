import { Reason } from './reason';
import { DriveTemplate } from './drive-template';

export interface Drive {
  id?: string | null;
  template: DriveTemplate | null;
  date: Date;
  reason?: Reason | null;
}

export interface DriveRequest {
  id?: string | null;
  templateId: string | null;
  date: string;
  reason?: Reason | null;
}
