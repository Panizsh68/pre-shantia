import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, HydratedDocument } from "mongoose";

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true })
export class Product {
    @Prop({ required: true })
    name: string;
  
    @Prop({ required: true })
    price: number;
  
    @Prop({ required: true })
    companyId: string; 
  
    @Prop({ type: [String], default: [] }) // Aligned with DTO
    categories: string[];
  
    @Prop()
    description: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product)
