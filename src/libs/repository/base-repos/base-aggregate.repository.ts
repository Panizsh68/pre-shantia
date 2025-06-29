import { Model, Document, PipelineStage, ClientSession } from 'mongoose';
import { BadRequestException } from '@nestjs/common';
import { IBaseAggregateRepository } from '../interfaces/base-repo.interfaces';

export class BaseAggregateRepository<T extends Document> implements IBaseAggregateRepository<T> {
  constructor(protected readonly model: Model<T>) {
    if (!model) {
      throw new Error('Model instance is required');
    }
  }

  async aggregate<R = unknown>(pipeline: PipelineStage[], session?: ClientSession): Promise<R[]> {
    try {
      const aggregation = this.model.aggregate<R>(pipeline);
      if (session) {
        aggregation.session(session);
      }
      return await aggregation.exec();
    } catch (error) {
      throw new BadRequestException(`Failed to execute aggregation: ${(error as Error).message}`);
    }
  }
}
