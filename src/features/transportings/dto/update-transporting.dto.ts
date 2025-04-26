import { PartialType } from '@nestjs/swagger';
import { CreateTransportingDto } from './create-transporting.dto';

export class UpdateTransportingDto extends PartialType(CreateTransportingDto) {
    id: string;
}
