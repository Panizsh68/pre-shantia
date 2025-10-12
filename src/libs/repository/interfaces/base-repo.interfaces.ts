import { ClientSession, FilterQuery, UpdateQuery, Document, Model, PipelineStage } from 'mongoose';
import {
  FindOptions,
  FindManyOptions,
  UpdateOptions,
  PopulateOptions,
} from './base-repo-options.interface';

/**
 * Prefixing unused parameters with `_` signals ESLint to ignore
 * the "no-unused-vars" rule for these parameters, which is common
 * practice for interface/type declarations where parameters are
 * only part of the signature and not used directly.
 */
export interface IBaseCrudRepository<T extends Document> {
  createOne(data: Partial<T>, _session?: ClientSession): Promise<T>;
  saveOne(_document: T, _session?: ClientSession): Promise<T>;

  findById(_id: string, _options?: FindOptions): Promise<T | null>;
  findOneByCondition(_condition: FilterQuery<T>, _options?: FindOptions): Promise<T | null>;
  findManyByCondition(_condition: FilterQuery<T>, _options?: FindManyOptions): Promise<T[]>;
  findAll(_options?: FindManyOptions): Promise<T[]>;

  updateById(_id: string, _data: UpdateQuery<T>, _session?: ClientSession): Promise<T>;
  updateOneByCondition(
    _condition: FilterQuery<T>,
    _data: UpdateQuery<T>,
    _options?: UpdateOptions,
  ): Promise<T>;

  deleteById(_id: string, _session?: ClientSession): Promise<boolean>;
  // Delete a single document matching condition
  deleteOneByCondition?(_condition: FilterQuery<T>, _session?: ClientSession): Promise<boolean>;

  countByCondition(_condition: FilterQuery<T>, _session?: ClientSession): Promise<number>;
  existsByCondition(_condition: FilterQuery<T>, _session?: ClientSession): Promise<boolean>;
}

export interface IBasePopulateRepository<T extends Document> {
  populate(data: T[], fields: string | string[] | PopulateOptions[], session?: ClientSession): Promise<T[]>;
}

export interface IBaseAggregateRepository<_T extends Document> {
  aggregate<R = unknown>(_pipeline: PipelineStage[], _session?: ClientSession): Promise<R[]>;
}

export interface IBaseTransactionRepository<_T extends Document> {
  startTransaction(): Promise<ClientSession>;
  commitTransaction(_session: ClientSession): Promise<void>;
  abortTransaction(_session: ClientSession): Promise<void>;
  // Optional: atomic update helper for transactions keyed by trackId
  findOneByTrackIdAndStatusAndUpdate?(_trackId: string, _expectedStatus: any, _update: any, _session?: ClientSession): Promise<_T | null>;
}
