import { Module } from '@nestjs/common';
import { TicketingService } from './ticketing.service';
import { TicketingController } from './ticketing.controller';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Ticket, TicketSchema } from './entities/ticketing.entity';
import { JwtService } from '@nestjs/jwt';
import { TokensService } from 'src/utils/services/tokens/tokens.service';
import { CachingService } from 'src/infrastructure/caching/caching.service';
import { User, UserSchema } from 'src/features/users/entities/user.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { Model } from 'mongoose';
import { ITicketRepository, TicketRepository } from './repository/ticket.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Ticket.name, schema: TicketSchema },
      { name: User.name, schema: UserSchema },
    ]),
    ScheduleModule.forRoot(),
  ],
  controllers: [TicketingController],
  providers: [
    {
      provide: 'TicketRepository',
      useFactory: (ticketModel: Model<Ticket>): ITicketRepository => {
        return new TicketRepository(ticketModel);
      },
      inject: [getModelToken(Ticket.name)],
    },
    {
      provide: 'ITicketingService', 
      useClass: TicketingService
    },
    JwtService,
    TokensService,
    CachingService,
  ],
  exports: ['ITicketingService']
})
export class TicketingModule {}
