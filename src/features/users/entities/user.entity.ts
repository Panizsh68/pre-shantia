import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";
import { Permission } from "../auth/interfaces/permission.interface";

// Define the User schema using NestJS decorators
@Schema({ timestamps: true })
export class User {
    @Prop({ required: true })
    phoneNumber: string;

    @Prop({ required: true })
    meliCode: string;

    @Prop({ type: [{ action: String, resource: String }], default: [] })
    permissions: Permission[];

    _id: mongoose.Types.ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);