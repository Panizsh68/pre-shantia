import { DynamicModule, Module, Type } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Document, Schema, SchemaDefinition } from 'mongoose';
import { RepositoryHelperModule } from './repository-helper.module';

@Module({})
export class GenericRepositoryModule {
  static forFeature<T extends Document>(
    entityName: string,
    entity: Type<T>,
    schema: Schema | SchemaDefinition | Function,
  ): DynamicModule {
    return {
      module: GenericRepositoryModule,
      imports: [
        MongooseModule.forFeature([{ name: entityName, schema }]),
        RepositoryHelperModule.register<T>(entityName, schema),
      ],
      exports: [MongooseModule, RepositoryHelperModule],
    };
  }
}
