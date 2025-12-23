import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTicketCommentDto {
  @ApiProperty({
    description: 'Content of the comment/reply',
    example: 'I have reviewed your issue and here is the solution...',
  })
  @IsNotEmpty({ message: 'Comment content cannot be empty' })
  @IsString({ message: 'Comment content must be a string' })
  content: string;

  // userId is set automatically from the authenticated user
}
