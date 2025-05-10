// src/wallets/schemas/wallet.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { WalletOwnerType } from '../enums/wallet-ownertype.enum';

export type WalletDocument = HydratedDocument<Wallet>;

@Schema({ timestamps: true })
export class Wallet {
  @Prop({ type: Types.ObjectId, required: true })
  ownerId: Types.ObjectId;

  @Prop({ type: String, enum: WalletOwnerType, required: true })
  ownerType: string;

  @Prop({ type: Number, required: true, min: 0, default: 0 })
  balance: number;

  @Prop({ type: String, required: true, match: /^[A-Z]{3}$/ })
  currency: string;

  _id: Types.ObjectId;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);

// Indexes
WalletSchema.index({ ownerId: 1, ownerType: 1 }, { unique: true });
WalletSchema.index({ balance: 1 });

// Sharding: Configure at MongoDB level with shard key: { ownerId: "hashed" }