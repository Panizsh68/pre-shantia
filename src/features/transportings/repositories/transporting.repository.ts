import { BaseRepository, IBaseRepository } from "src/utils/base.repository";
import { Transporting } from "../entities/transporting.entity";
import { Injectable } from "@nestjs/common";

export interface ITransportingRepository extends IBaseRepository<Transporting> {}

@Injectable()
export class TransportingRepository extends BaseRepository<Transporting> {}