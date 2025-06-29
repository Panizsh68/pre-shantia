import { Global, Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Role, RoleSchema } from './entities/role.entity';

@Global()
@Module({
  imports: [MongooseModule.forFeature([{ name: Role.name, schema: RoleSchema }])],
  controllers: [RolesController],
  providers: [
    RolesService,
    {
      provide: 'IRolesService',
      useClass: RolesService,
    },
  ],
  exports: ['IRolesService', MongooseModule],
})
export class RolesModule {}
