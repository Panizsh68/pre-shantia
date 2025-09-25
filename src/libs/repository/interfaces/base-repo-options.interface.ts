import { ClientSession, FilterQuery } from 'mongoose';

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export interface SortOption {
  field: string;
  order: SortOrder;
}

export interface PopulateOptions {
  path: string;
  select?: string | string[];
  session?: ClientSession;
}

export interface FindOptions {
  select?: string | string[];
  populate?: string | string[] | PopulateOptions[];
  conditions?: FilterQuery<unknown>;
  session?: ClientSession;
}

export interface FindManyOptions extends FindOptions {
  page?: number;
  perPage?: number;
  sort?: SortOption[];
}

export interface UpdateOptions {
  new?: boolean;
  session?: ClientSession;
}
