import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PublicSubmission, PublicSubmissionSchema } from './entities/public-submission.entity';
import { PublicSubmissionsController } from './public-submissions.controller';
import { PublicSubmissionsService } from './public-submissions.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PublicSubmission.name, schema: PublicSubmissionSchema },
    ]),
  ],
  controllers: [PublicSubmissionsController],
  providers: [PublicSubmissionsService],
  exports: [PublicSubmissionsService],
})
export class PublicSubmissionsModule {}
