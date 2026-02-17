import { describe, it, expect, vi } from 'vitest';

describe('main bootstrap', () => {
  it('should register locale and bootstrap application', async () => {
    const registerLocaleDataMock = vi.fn();
    const bootstrapMock = vi.fn().mockResolvedValue({});

    vi.resetModules();
    vi.doMock('@angular/platform-browser', () => ({ bootstrapApplication: bootstrapMock }));
    vi.doMock('@angular/common', async () => {
      const actual = await vi.importActual<typeof import('@angular/common')>('@angular/common');
      return { ...actual, registerLocaleData: registerLocaleDataMock };
    });
    vi.doMock('@angular/common/locales/de', () => ({ default: {} }));

    await import('./main');

    expect(registerLocaleDataMock).toHaveBeenCalled();
    expect(bootstrapMock).toHaveBeenCalled();
  });

  it('should log bootstrap errors', async () => {
    const error = new Error('boom');
    const registerLocaleDataMock = vi.fn();
    const bootstrapMock = vi.fn().mockRejectedValue(error);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.resetModules();
    vi.doMock('@angular/platform-browser', () => ({ bootstrapApplication: bootstrapMock }));
    vi.doMock('@angular/common', async () => {
      const actual = await vi.importActual<typeof import('@angular/common')>('@angular/common');
      return { ...actual, registerLocaleData: registerLocaleDataMock };
    });
    vi.doMock('@angular/common/locales/de', () => ({ default: {} }));

    await import('./main');
    await Promise.resolve();

    expect(consoleSpy).toHaveBeenCalledWith(error);
    consoleSpy.mockRestore();
  });
});
