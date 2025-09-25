// src/libs/repository/repository-helper.module.ts
import { Module, DynamicModule, Provider } from '@nestjs/common';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Document, Model, Schema, SchemaDefinition } from 'mongoose';
import {
  IBaseCrudRepository,
  IBasePopulateRepository,
  IBaseAggregateRepository,
  IBaseTransactionRepository,
} from './interfaces/base-repo.interfaces';
import {
  BaseCrudRepository,
  BasePopulateRepository,
  BaseAggregateRepository,
  BaseTransactionRepository,
} from './base-repos';
import {
  BASE_AGGREGATE_REPOSITORY,
  BASE_CRUD_REPOSITORY,
  BASE_POPULATE_REPOSITORY,
  BASE_TRANSACTION_REPOSITORY,
} from './constants/tokens.constants';

export class RepositoryHelperModule {
  static register<T extends Document>(entityName: string, schema: Schema | SchemaDefinition | Function): DynamicModule {
    const providers: Provider[] = [
      {
        provide: BASE_CRUD_REPOSITORY,
        useFactory: (model: Model<T>): IBaseCrudRepository<T> => new BaseCrudRepository<T>(model),
        inject: [getModelToken(entityName)],
      },
      {
        provide: BASE_POPULATE_REPOSITORY,
        useFactory: (model: Model<T>): IBasePopulateRepository<T> =>
          new BasePopulateRepository<T>(model),
        inject: [getModelToken(entityName)],
      },
      {
        provide: BASE_AGGREGATE_REPOSITORY,
        useFactory: (model: Model<T>): IBaseAggregateRepository<T> =>
          new BaseAggregateRepository<T>(model),
        inject: [getModelToken(entityName)],
      },
      {
        provide: BASE_TRANSACTION_REPOSITORY,
        useFactory: (model: Model<T>): IBaseTransactionRepository<T> =>
          new BaseTransactionRepository<T>(model),
        inject: [getModelToken(entityName)],
      },
    ];

    return {
      module: RepositoryHelperModule,
      imports: [MongooseModule.forFeature([{ name: entityName, schema }])],
      providers,
      exports: providers,
    } as DynamicModule;
  }
}
