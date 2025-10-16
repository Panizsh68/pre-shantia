import { ApiProperty } from '@nestjs/swagger';

export class CountDto {
  @ApiProperty({ example: 42 })
  count: number;
}

export class ExistsDto {
  @ApiProperty({ example: true })
  exists: boolean;
}

export class TopProductDto {
  @ApiProperty({ description: 'Product id' })
  id: string;

  @ApiProperty({ description: 'Product name' })
  name: string;

  @ApiProperty({ description: 'Average rating for the product' })
  avgRating: number;
}
