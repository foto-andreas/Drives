import { Reason } from './reason';
import { ReasonHelper } from './reason-helper';

describe('ReasonHelper', () => {
  it('should return correct string for Reason enum', () => {
    expect(ReasonHelper.toString(Reason.PRIVATE)).toBe('privat');
    expect(ReasonHelper.toString(Reason.WORK)).toBe('Arbeit');
    expect(ReasonHelper.toString(Reason.ESTATE)).toBe('Haus');
    expect(ReasonHelper.toString(Reason.OTHER)).toBe('sonstiges');
    expect(ReasonHelper.toString('PRIVATE')).toBe('privat');
    expect(ReasonHelper.toString('WORK')).toBe('Arbeit');
    expect(ReasonHelper.toString('unknown')).toBe('unknown');
    expect(ReasonHelper.toString(null)).toBe('sonstiges');
  });

  it('should return keys', () => {
    const keys = ReasonHelper.keys();
    expect(keys).toContain('PRIVATE');
    expect(keys).toContain('WORK');
    expect(keys).toContain('ESTATE');
    expect(keys).toContain('OTHER');
  });
});
