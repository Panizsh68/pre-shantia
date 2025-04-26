import { Inject, Injectable } from '@nestjs/common';
import { GoftinoService } from './goftino.service';
import { UserDataDto } from '../dto/user-data.dto';
import { BanUserDto } from '../dto/ban-user.dto';
import { GoftinoResponse } from '../interfaces/goftino-response.interface';
import { User } from '../interfaces/user.interface';

@Injectable()
export class GoftinoUsersService extends  GoftinoService {
    @Inject('BASE_GOFTINO_SERVICE') private readonly goftinoService: GoftinoService

    async getUser(user_id: string): Promise<GoftinoResponse<User>> {
        const response = await this.getApiClient().get('/user_data', {
            params: { user_id },
        });
        return response.data;
    }

    async setUser(dto: UserDataDto): Promise<GoftinoResponse<void>> {
        const response = await this.getApiClient().post('/user_data', dto);
        return response.data;
    }

    async banUser(dto: BanUserDto): Promise<GoftinoResponse<void>> {
        const response = await this.getApiClient().post('/ban_user', dto);
        return response.data;
    }

    async getUserVisitedPages(user_id: string): Promise<GoftinoResponse<string[]>> {
        const response = await this.getApiClient().get('/user_visited_pages', {
            params: { user_id },
        });
        return response.data;
    }
}
