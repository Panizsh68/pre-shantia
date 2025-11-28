import { ApiProperty } from '@nestjs/swagger';

export class CountDto {
  @ApiProperty({ example: 42 })
  count: number;
}

export class ExistsDto {
  @ApiProperty({ example: true })
  exists: boolean;
}
