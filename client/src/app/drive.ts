import {Reason} from './reason';
import {DriveTemplate} from './drive-template';

export class Drive {

  id!: string | null;
  template!: DriveTemplate;
  date!: Date;
  reason: Reason | undefined;

}
