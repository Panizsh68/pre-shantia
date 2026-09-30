import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PermissionsModule } from '../permissions/permissions.module';
import { CustomerRequest, CustomerRequestSchema } from './entities/customer-request.entity';
import { CustomerRequestsController } from './customer-requests.controller';
import { CustomerRequestsService } from './customer-requests.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: CustomerRequest.name, schema: CustomerRequestSchema }]),
    PermissionsModule,
  ],
  controllers: [CustomerRequestsController],
  providers: [CustomerRequestsService],
  exports: [CustomerRequestsService],
})
export class CustomerRequestsModule {}
