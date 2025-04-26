import { BaseRepository, IBaseRepository } from "src/utils/base.repository";
import { Transaction } from "../entities/transaction.entity";
import { Injectable } from "@nestjs/common";

export interface ITransactionRepository extends IBaseRepository<Transaction> {}

@Injectable()
export class TransactionRepository extends BaseRepository<Transaction> {}