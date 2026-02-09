import {Reason} from './reason';

export class DriveTemplate {

  id!: string | null;
  name!: string;
  drive_length!: number;
  from_location!: string;
  to_location!: string;
  reason!: Reason;

}
