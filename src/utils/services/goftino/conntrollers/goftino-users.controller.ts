import { Body, Controller, Get, Param, Post, UseFilters } from "@nestjs/common";
import { GoftinoExceptionFilter } from "../goftino.exception-filter";
import { GoftinoUsersService } from "../services/goftino-users.service";
import { UserDataDto } from "../dto/user-data.dto";
import { BanUserDto } from "../dto/ban-user.dto";
import { GoftinoResponse } from "../interfaces/goftino-response.interface";

@Controller('goftino/users')
@UseFilters(GoftinoExceptionFilter)
export class GoftinoUsersController {
    constructor(
        private readonly goftinoUsersService: GoftinoUsersService,
    ) {}

    @Get(':userId')
    async getUser(@Param('userId') userId: string): Promise<GoftinoResponse<UserDataDto>> {
      return this.goftinoUsersService.getUser(userId);
    }
  
    @Post()
    async setUser(@Body() dto: UserDataDto): Promise<GoftinoResponse<void>> {
      return this.goftinoUsersService.setUser(dto);
    }
  
    @Post('ban')
    async banUser(@Body() dto: BanUserDto): Promise<GoftinoResponse<void>> {
      return this.goftinoUsersService.banUser(dto);
    }
  
    @Get(':userId/visited-pages')
    async getUserVisitedPages(@Param('userId') userId: string): Promise<GoftinoResponse<string[]>> {
      return this.goftinoUsersService.getUserVisitedPages(userId);
    }
}