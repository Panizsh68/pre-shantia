import { Model, Document } from 'mongoose';
import { BadRequestException } from '@nestjs/common';
import { PopulateOptions, ClientSession } from 'mongoose';
import { IBasePopulateRepository } from '../interfaces/base-repo.interfaces';

export class BasePopulateRepository<T extends Document> implements IBasePopulateRepository<T> {
  constructor(protected readonly model: Model<T>) {
    if (!model) {
      throw new Error('Model instance is required');
    }
  }

  /**
   * Populates fields in a query.
   * @param query - The query to populate.
   * @param fields - The fields to populate (array of field names or populate options).
   * @returns The populated query result.
   */
  async populate(data: T[], fields: string | string[] | PopulateOptions[], session?: ClientSession): Promise<T[]> {
    try {
      // mongoose.populate does not accept session directly in its API for arrays,
      // so we accept session for API consistency but do not pass it through here.
      return (await this.model.populate(data, fields as PopulateOptions[])) as T[];
    } catch (error) {
      throw new BadRequestException(`Failed to populate fields: ${(error as Error).message}`);
    }
  }
}
