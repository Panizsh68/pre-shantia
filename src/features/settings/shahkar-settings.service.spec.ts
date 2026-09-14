import { ShahkarSettingsService } from './shahkar-settings.service';

describe('ShahkarSettingsService', () => {
  const state = { key: 'registration', enabled: false };
  const model = {
    findOneAndUpdate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(state) }),
  } as any;
  const config = { get: jest.fn().mockReturnValue(false) } as any;
  const shahkar = { getCapability: jest.fn().mockReturnValue({ available: true }) } as any;

  beforeEach(() => jest.clearAllMocks());

  it('initializes the persisted setting from the environment default', async () => {
    const service = new ShahkarSettingsService(model, config, shahkar);
    await service.getState();
    expect(model.findOneAndUpdate).toHaveBeenCalledWith(
      { key: 'registration' },
      { $setOnInsert: { key: 'registration', enabled: false } },
      expect.objectContaining({ upsert: true, new: true }),
    );
  });

  it('rejects enabling when provider configuration is unavailable', async () => {
    shahkar.getCapability.mockReturnValue({ available: false, reason: 'configuration_missing' });
    const service = new ShahkarSettingsService(model, config, shahkar);
    await expect(service.setEnabled(true)).rejects.toThrow(/configuration is incomplete/);
    expect(model.findOneAndUpdate).not.toHaveBeenCalled();
  });
});
