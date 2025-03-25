import { Injectable } from '@nestjs/common';
import { CreateTransportingDto } from './dto/create-transporting.dto';
import { UpdateTransportingDto } from './dto/update-transporting.dto';

@Injectable()
export class TransportingsService {
  create(createTransportingDto: CreateTransportingDto) {
    return 'This action adds a new transporting';
  }

  findAll() {
    return `This action returns all transportings`;
  }

  findOne(id: number) {
    return `This action returns a #${id} transporting`;
  }

  update(id: number, updateTransportingDto: UpdateTransportingDto) {
    return `This action updates a #${id} transporting`;
  }

  remove(id: number) {
    return `This action removes a #${id} transporting`;
  }
}
