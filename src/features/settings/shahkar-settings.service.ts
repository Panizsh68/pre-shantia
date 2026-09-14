import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { ShahkarService } from 'src/utils/services/shahkar/shahkar.service';
import { ShahkarSetting } from './shahkar-setting.schema';

@Injectable()
export class ShahkarSettingsService {
  constructor(
    @InjectModel(ShahkarSetting.name) private readonly model: Model<ShahkarSetting>,
    private readonly config: ConfigService,
    private readonly shahkar: ShahkarService,
  ) {}

  private defaultEnabled(): boolean {
    const configured = this.config.get<boolean | string>('SHAHKAR_ENABLED') ?? this.config.get<boolean | string>('config.SHAHKAR_ENABLED');
    return configured === true || (typeof configured === 'string' && configured.trim().toLowerCase() === 'true');
  }

  async getState() {
    const setting = await this.model.findOneAndUpdate(
      { key: 'registration' },
      { $setOnInsert: { key: 'registration', enabled: this.defaultEnabled() } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();
    const capability = this.shahkar.getCapability();
    return { enabled: setting.enabled, available: capability.available, ...(capability.reason ? { reason: capability.reason } : {}) };
  }

  async isEnabled(): Promise<boolean> {
    return (await this.getState()).enabled;
  }

  async setEnabled(enabled: boolean) {
    if (enabled && !this.shahkar.getCapability().available) {
      throw new BadRequestException('Shahkar cannot be enabled because provider configuration is incomplete.');
    }
    await this.model.findOneAndUpdate(
      { key: 'registration' },
      { $set: { enabled }, $setOnInsert: { key: 'registration' } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();
    return this.getState();
  }
}
