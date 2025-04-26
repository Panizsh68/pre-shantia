import { Controller, Get, Param, Query, UseFilters } from "@nestjs/common";
import { GoftinoExceptionFilter } from "../goftino.exception-filter";
import { GoftinoOperatorsService } from "../services/goftino-operators.service";
import { GoftinoResponse } from "../interfaces/goftino-response.interface";
import { Operator } from "../interfaces/operator.interface";

@Controller('goftino/operators')
@UseFilters(GoftinoExceptionFilter)
export class GoftinoOperatorsController {
    constructor(
        private readonly goftinoOperatorsService: GoftinoOperatorsService,
    ) {}

    @Get()
    async getOperators(): Promise<GoftinoResponse<Operator[]>> {
      return this.goftinoOperatorsService.getOperators();
    }
  
    @Get(':operatorId')
    async getOperatorData(
      @Param('operatorId') operatorId: string,
      @Query('email') email: string,
    ): Promise<GoftinoResponse<Operator>> {
      return this.goftinoOperatorsService.getOperatorData(operatorId, email);
    }
}