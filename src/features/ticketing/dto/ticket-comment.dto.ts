import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TicketCommentDto {
  @ApiProperty({
    description: 'Comment ID',
    example: '507f1f77bcf86cd799439011',
  })
  id: string;

  @ApiProperty({
    description: 'User ID who made the comment',
    example: '507f1f77bcf86cd799439011',
  })
  userId: string;

  @ApiProperty({
    description: 'Content of the comment',
    example: 'This is a reply to the ticket...',
  })
  content: string;

  @ApiPropertyOptional({
    description: 'Comment created timestamp',
  })
  createdAt?: Date;

  @ApiPropertyOptional({
    description: 'Comment updated timestamp',
  })
  updatedAt?: Date;
}
