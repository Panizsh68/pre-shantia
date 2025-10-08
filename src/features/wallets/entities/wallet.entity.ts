// src/wallets/schemas/wallet.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { WalletOwnerType } from '../enums/wallet-ownertype.enum';

@Schema({ timestamps: true })
export class Wallet extends Document {
  @Prop({ type: String, required: true })
  ownerId: string;

  @Prop({ type: String, enum: WalletOwnerType, required: true })
  ownerType: string;

  @Prop({ type: Number, required: true, min: 0, default: 0 })
  balance: number;

  @Prop({ type: Number, required: true, min: 0, default: 0 })
  blockedBalance: number;

  @Prop({ type: String, required: true, match: /^[A-Z]{3}$/ })
  currency: string;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);
