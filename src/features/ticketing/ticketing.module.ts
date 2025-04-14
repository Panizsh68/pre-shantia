import { Module } from '@nestjs/common';
import { TicketingService } from './ticketing.service';
import { TicketingController } from './ticketing.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Ticket, TicketSchema } from './entities/ticketing.entity';
import { TicketRepository } from './repository/ticket.repository';
import { JwtService } from '@nestjs/jwt';
import { TokensService } from 'src/utils/services/tokens/tokens.service';
import { CachingService } from 'src/infrastructure/caching/caching.service';
import { UsersService } from 'src/features/users/users.service';
import { User, UserSchema } from 'src/features/users/schemas/user.schema';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Ticket.name, schema: TicketSchema},
      { name: User.name, schema: UserSchema}
    ]),
    ScheduleModule.forRoot(),
  ],
  controllers: [TicketingController],
  providers: [TicketingService, TicketRepository, JwtService, TokensService, CachingService, UsersService],
  exports: [TicketRepository]
})
export class TicketingModule {}

