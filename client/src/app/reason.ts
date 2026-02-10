export enum Reason {
  WORK = "Arbeit",
  ESTATE = "Haus",
  HOME = "HomeOffice",
  PRIVATE = "privat",
  OTHER = "sonstiges"
}

export type ReasonKey = keyof typeof Reason;
