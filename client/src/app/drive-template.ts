import { ReasonKey } from './reason';

export interface DriveTemplate {
  id?: string | null;
  name: string;
  driveLength: number;
  fromLocation: string;
  toLocation: string;
  reason: ReasonKey;
}
