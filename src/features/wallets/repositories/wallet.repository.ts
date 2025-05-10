import { BaseRepository, IBaseRepository } from "src/utils/base.repository";
import { Injectable } from "@nestjs/common";
import { Wallet } from "../entities/wallet.entity";

export interface IWalletRepository extends IBaseRepository<Wallet> {}

@Injectable()
export class WalletRepository extends BaseRepository<Wallet> implements IWalletRepository {}