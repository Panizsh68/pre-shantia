import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { AuthenticationGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../permissions/guard/permission.guard';
import { Permission } from '../permissions/decorators/permissions.decorators';
import { Resource } from '../permissions/enums/resources.enum';
import { Action } from '../permissions/enums/actions.enum';
import { ShahkarSettingsService } from './shahkar-settings.service';

class UpdateShahkarSettingDto {
  @Transform(({ value }) => value)
  @IsBoolean()
  enabled: boolean;
}

@Controller('admin/settings/shahkar')
@UseGuards(AuthenticationGuard, PermissionsGuard)
@Permission(Resource.ALL, Action.MANAGE)
export class ShahkarSettingsController {
  constructor(private readonly service: ShahkarSettingsService) {}

  @Get()
  get() { return this.service.getState(); }

  @Patch()
  update(@Body() body: UpdateShahkarSettingDto) { return this.service.setEnabled(body.enabled); }
}
