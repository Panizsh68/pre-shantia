import { Module } from '@nestjs/common';
import { TicketingService } from './ticketing.service';
import { TicketingController } from './ticketing.controller';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Ticket, TicketSchema } from './entities/ticketing.entity';
import { TicketRepository } from './repository/ticket.repository';
import { JwtService } from '@nestjs/jwt';
import { TokensService } from 'src/utils/services/tokens/tokens.service';
import { CachingService } from 'src/infrastructure/caching/caching.service';
import { UsersService } from 'src/features/users/users.service';
import { User, UserSchema } from 'src/features/users/entities/user.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { Model } from 'mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Ticket.name, schema: TicketSchema},
      { name: User.name, schema: UserSchema}
    ]),
    ScheduleModule.forRoot(),
  ],
  controllers: [TicketingController],
  providers: [
    {
      provide: 'TicketRepository',
      useFactory: (ticketModel: Model<Ticket>) => {
        return new TicketRepository(ticketModel);
      }, 
      inject: [getModelToken(Ticket.name)],
    },
    TicketingService, JwtService, TokensService, CachingService],
})
export class TicketingModule {}

