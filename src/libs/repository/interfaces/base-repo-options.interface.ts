import { ClientSession } from 'mongoose';

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
}

export interface FindOptions {
  select?: string | string[];
  populate?: string | string[] | PopulateOptions[];
  session?: ClientSession;
}

export interface FindManyOptions extends FindOptions {
  page?: number;
  perPage?: number;
  sort?: SortOption[];
}

export interface UpdateOptions {
  new?: boolean;
}
