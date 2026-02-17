export type ScanType = 'START' | 'ZIEL';

export interface ScanEntry {
  id: string;
  type: ScanType;
  timestamp: Date;
  latitude: number;
  longitude: number;
  address: string | null;
  kmStand: number | null;
}
