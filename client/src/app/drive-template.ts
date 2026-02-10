import { Reason } from './reason';

export interface DriveTemplate {
  id?: string | null;
  name: string;
  driveLength: number;
  fromLocation: string;
  toLocation: string;
  reason: Reason;
}
