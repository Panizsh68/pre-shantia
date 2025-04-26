import { Inject, Injectable } from '@nestjs/common';
import { CreateTransportingDto } from './dto/create-transporting.dto';
import { UpdateTransportingDto } from './dto/update-transporting.dto';
import { ITransportingRepository } from './repositories/transporting.repository';
import { Transporting } from './entities/transporting.entity';

@Injectable()
export class TransportingsService {

  constructor(
    @Inject('TransportingRepository') 
    private readonly transportingRepository: ITransportingRepository
  ) {}

  async create(createTransportingDto: CreateTransportingDto): Promise<Transporting> {
    return this.transportingRepository.create(createTransportingDto);
  }

  async findAll(): Promise<Transporting[]>  {
    return await this.transportingRepository.findAll();
  }

  async findOne(id: string): Promise<Transporting | null>  {
    return await this.transportingRepository.findById(id);
  }

  async update(id: string, updateTransportingDto: UpdateTransportingDto): Promise<Transporting | null>  {
    return await this.transportingRepository.update(id, updateTransportingDto);
  }

  async remove(id: string): Promise<boolean>  {
    return await this.transportingRepository.delete(id);
  }
}
