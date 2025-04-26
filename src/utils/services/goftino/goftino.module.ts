import { Module } from '@nestjs/common';
import { GoftinoService } from './services/goftino.service';
import { GoftinoGateway } from './gateway/goftino.gateway';
import { LoggerService } from 'src/common/logger/logger.service';
import { HttpModule } from '@nestjs/axios';
import { GoftinoChatsController } from './conntrollers/goftino-chats.controller';
import { GoftinoOperatorsService } from './services/goftino-operators.service';
import { GoftinoUsersService } from './services/goftino-users.service';
import { GoftinoChatsService } from './services/goftino-chats.service';
import { GoftinoOperatorsController } from './conntrollers/goftino-operators.controller';
import { GoftinoUsersController } from './conntrollers/goftino-users.controller';

@Module({
  imports: [HttpModule],
  providers: [
    {
      provide: 'BASE_GOFTINO_SERVICE',
      useClass: GoftinoService
    },
    GoftinoService, GoftinoGateway, LoggerService, GoftinoOperatorsService, GoftinoUsersService, GoftinoChatsService],
  controllers: [GoftinoChatsController, GoftinoOperatorsController, GoftinoUsersController],
})
export class GoftinoModule {}
