import { Reason } from './reason';

describe('Reason', () => {
  it('should return correct string for Reason enum', () => {
    expect(Reason.toString(Reason.PRIVATE)).toBe('privat');
    expect(Reason.toString(Reason.WORK)).toBe('Arbeit');
    expect(Reason.toString(Reason.ESTATE)).toBe('Haus');
    expect(Reason.toString(Reason.OTHER)).toBe('sonstiges');
    expect(Reason.toString('PRIVATE')).toBe('privat');
    expect(Reason.toString('WORK')).toBe('Arbeit');
    expect(Reason.toString('unknown')).toBe('unknown');
    expect(Reason.toString(null)).toBe('sonstiges');
  });

  it('should return keys', () => {
    const keys = Reason.keys();
    expect(keys).toContain('PRIVATE');
    expect(keys).toContain('WORK');
    expect(keys).toContain('ESTATE');
    expect(keys).toContain('OTHER');
  });
});
