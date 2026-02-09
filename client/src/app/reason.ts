export enum Reason {
  PRIVATE = "privat",
  WORK = "Arbeit",
  ESTATE = "Haus",
  OTHER = "sonstiges",
  HOME = "HomeOffice"
}

export namespace Reason {
  export function toString(reason: any): string {
    if (!reason) return 'sonstiges';
    const entry = Object.entries(Reason).find(([key, value]) => key === reason || value === reason);
    if (entry) {
      return entry[1] as string;
    }
    return reason as string;
  }

  export function keys(): string[] {
    return Object.keys(Reason).filter(key => typeof (Reason as any)[key] === 'string');
  }
}
