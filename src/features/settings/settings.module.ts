import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ShahkarModule } from 'src/utils/services/shahkar/shahkar.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { ShahkarSetting, ShahkarSettingSchema } from './shahkar-setting.schema';
import { ShahkarSettingsController } from './shahkar-settings.controller';
import { ShahkarSettingsService } from './shahkar-settings.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: ShahkarSetting.name, schema: ShahkarSettingSchema }]), ShahkarModule, PermissionsModule],
  controllers: [ShahkarSettingsController],
  providers: [ShahkarSettingsService],
  exports: [ShahkarSettingsService],
})
export class SettingsModule {}
