import { Prop, Schema } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { Cart } from "src/features/carts/entities/cart.entity";

@Schema()
export class Profile {
    @Prop({ type: String, required: true })
    firstName: string;

    @Prop({ type: String, required: true})
    lastName: string;

    @Prop({ type: String, required: true })
    email: string;

    @Prop({ type: String, required: true })
    phoneNumber: string;

    @Prop({ type: String, required: true })
    address: string;

    @Prop({ type: String, required: true }) 
    meliCode: string;

    @Prop({ type: Types.ObjectId, ref: 'Wallet' })
    walletId?: Types.ObjectId; 

    @Prop({ type: [{ type: Types.ObjectId, ref: 'Order' }], default: [] })
    orders: Types.ObjectId[]; 

    @Prop({ type: [{ type: Types.ObjectId, ref: 'Transaction' }], default: [] })
    transactions: Types.ObjectId[]; 

    @Prop({ type: [{ type: Types.ObjectId, ref: 'Product' }], default: [] })
    favorites: Types.ObjectId[]; 

    @Prop({ type: Cart, default: [] })
    cart: Cart; 
}
