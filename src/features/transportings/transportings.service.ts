import { Inject, Injectable } from '@nestjs/common';
import { CreateTransportingDto } from './dto/create-transporting.dto';
import { UpdateTransportingDto } from './dto/update-transporting.dto';
import { ITransportingRepository } from './repositories/transporting.repository';
import { Transporting } from './entities/transporting.entity';
import { QueryOptionsDto } from 'src/utils/query-options.dto';

@Injectable()
export class TransportingsService {

  constructor(
    @Inject('TransportingRepository') 
    private readonly transportingRepository: ITransportingRepository
  ) {}

  async create(createTransportingDto: CreateTransportingDto): Promise<Transporting> {
    return this.transportingRepository.create(createTransportingDto);
  }

  async findAll(options: QueryOptionsDto): Promise<Transporting[]>  {
    return await this.transportingRepository.findAll(options);
  }

  async findOne(id: string): Promise<Transporting | null>  {
    return await this.transportingRepository.findOne(id);
  }

  async update(id: string, updateTransportingDto: UpdateTransportingDto): Promise<Transporting | null>  {
    return await this.transportingRepository.update(id, updateTransportingDto);
  }

  async remove(id: string): Promise<boolean>  {
    return await this.transportingRepository.delete(id);
  }
}
