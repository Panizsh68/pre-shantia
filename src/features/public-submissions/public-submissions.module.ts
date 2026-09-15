import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PublicSubmission, PublicSubmissionSchema } from './entities/public-submission.entity';
import { PublicSubmissionsController } from './public-submissions.controller';
import { PublicSubmissionsService } from './public-submissions.service';
import { forwardRef } from '@nestjs/common';
import { CompaniesModule } from '../companies/companies.module';
import { ProfileModule } from '../users/profile/profile.module';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PublicSubmission.name, schema: PublicSubmissionSchema },
    ]),
    forwardRef(() => CompaniesModule),
    ProfileModule,
    PermissionsModule,
  ],
  controllers: [PublicSubmissionsController],
  providers: [PublicSubmissionsService],
  exports: [PublicSubmissionsService],
})
export class PublicSubmissionsModule {}
