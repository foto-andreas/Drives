import { describe, it, expect, vi } from 'vitest';

async function importMainWithMocks(bootstrapMock: ReturnType<typeof vi.fn>) {
  vi.resetModules();
  vi.doMock('@angular/platform-browser', () => ({ bootstrapApplication: bootstrapMock }));

  await import('./main');
}

describe('main bootstrap', () => {
  it('should register locale and bootstrap application', async () => {
    const bootstrapMock = vi.fn().mockResolvedValue({});

    await importMainWithMocks(bootstrapMock);
    expect(bootstrapMock).toHaveBeenCalled();
  });

  it('should log bootstrap errors', async () => {
    const error = new Error('boom');
    const bootstrapMock = vi.fn().mockRejectedValue(error);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await importMainWithMocks(bootstrapMock);
    await Promise.resolve();

    expect(consoleSpy).toHaveBeenCalledWith(error);
    consoleSpy.mockRestore();
  });
});
