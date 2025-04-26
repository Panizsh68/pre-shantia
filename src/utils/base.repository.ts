import { Injectable, InjectionToken } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, HydratedDocument } from 'mongoose';

// Interface defining the contract for repository operations
export interface IBaseRepository<T> {
  create(data: Partial<T>): Promise<T>;
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  update(id: string, data: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}

export class BaseRepository<T> implements IBaseRepository<T> {
    private readonly model: Model<T>

    constructor(model: Model<T>) {
        this.model = model;
    }

    async create(data: Partial<T>): Promise<T> {
        const createdDoc = await this.model.create(data);
        return createdDoc;
    }

    async findById(id: string): Promise<T | null> {
        const doc = await this.model.findById(id).exec();
        return doc;
    }

    async findAll(): Promise<T[]> {
        const docs = await this.model.find().exec();
        return docs;
    }

    async update(id: string, data: Partial<T>): Promise<T | null> {
        const updatedDoc = await this.model.findByIdAndUpdate(id, data, {new: true,}).exec();
        return updatedDoc;  
    }

    async delete(id: string): Promise<boolean> {
        const result = await this.model.findByIdAndDelete(id).exec();
        return !!result;
    }
            
}