import { Module } from '@nestjs/common';
import { TicketingService } from './ticketing.service';
import { TicketingController } from './ticketing.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Ticket, TicketDocument } from './entities/ticketing.entity';
import { TicketRepository } from './repository/ticket.repository';
import { JwtService } from '@nestjs/jwt';
import { TokensService } from 'src/utils/services/tokens/tokens.service';
import { CachingService } from 'src/infrastructure/caching/caching.service';
import { UsersService } from 'src/features/users/users.service';
import { User, UserSchema } from 'src/features/users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Ticket.name, schema: TicketDocument},
      { name: User.name, schema: UserSchema}
    ]),
  ],
  controllers: [TicketingController],
  providers: [TicketingService, TicketRepository, JwtService, TokensService, CachingService, UsersService],
  exports: [TicketRepository]
})
export class TicketingModule {}

