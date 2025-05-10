import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TransportingsService } from './transportings.service';
import { CreateTransportingDto } from './dto/create-transporting.dto';
import { UpdateTransportingDto } from './dto/update-transporting.dto';
import { QueryOptionsDto } from 'src/utils/query-options.dto';

@Controller('transportings')
export class TransportingsController {
  constructor(private readonly transportingsService: TransportingsService) {}

  @Post()
  create(@Body() createTransportingDto: CreateTransportingDto) {
    return this.transportingsService.create(createTransportingDto);
  }

  @Get()
  findAll(@Body() options: QueryOptionsDto) {
    return this.transportingsService.findAll(options);
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
