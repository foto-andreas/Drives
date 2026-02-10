export enum Reason {
  WORK = "Arbeit",
  ESTATE = "Haus",
  HOME = "HomeOffice",
  PRIVATE = "privat",
  OTHER = "sonstiges"
}

export namespace Reason {
  export function toString(reason?: Reason | string | null): string {
    if (!reason) return Reason.OTHER;
    const entry = Object.entries(Reason).find(([key, value]) => key === reason || value === reason);
    if (entry) {
      return entry[1] as string;
    }
    return reason;
  }

  export function keys(): string[] {
    return Object.keys(Reason);
  }
}
