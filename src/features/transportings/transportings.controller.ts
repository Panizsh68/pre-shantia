import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TransportingsService } from './transportings.service';
import { CreateTransportingDto } from './dto/create-transporting.dto';
import { UpdateTransportingDto } from './dto/update-transporting.dto';

@Controller('transportings')
export class TransportingsController {
  constructor(private readonly transportingsService: TransportingsService) {}

  @Post()
  create(@Body() createTransportingDto: CreateTransportingDto) {
    return this.transportingsService.create(createTransportingDto);
  }

  @Get()
  findAll() {
    return this.transportingsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transportingsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTransportingDto: UpdateTransportingDto) {
    return this.transportingsService.update(id, updateTransportingDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.transportingsService.remove(id);
  }
}
