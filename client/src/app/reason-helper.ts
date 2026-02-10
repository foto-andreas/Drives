import { Reason, ReasonKey } from './reason';

export class ReasonHelper {
  static toString(reason?: Reason | string | null): string {
    if (!reason) return Reason.OTHER;
    const entry = Object.entries(Reason).find(([key, value]) => key === reason || value === reason);
    if (entry) {
      return entry[1] as string;
    }
    return reason;
  }

  static keys(): ReasonKey[] {
    return Object.keys(Reason) as ReasonKey[];
  }
}
