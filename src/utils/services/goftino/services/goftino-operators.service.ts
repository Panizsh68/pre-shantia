import { Inject, Injectable } from '@nestjs/common';
import { GoftinoService } from './goftino.service';
import { GoftinoResponse } from '../interfaces/goftino-response.interface';
import { Operator } from '../interfaces/operator.interface';

@Injectable()
export class GoftinoOperatorsService extends GoftinoService {

    @Inject('BASE_GOFTINO_SERVICE') private readonly goftinoService: GoftinoService

    async getOperators(): Promise<GoftinoResponse<Operator[]>> {
        const response = await this.getApiClient().get('/operators');
        return response.data;
      }
    
      async getOperatorData(operator_id: string, email: string): Promise<GoftinoResponse<Operator>> {
        const response = await this.getApiClient().get('/operator_data', {
          params: { operator_id, email},
        });
        return response.data;
    }
}
