import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";
import { Permission } from "../auth/interfaces/permission.interface";

@Schema()
export class User {
    @Prop()
    phoneNumber: string

    @Prop()
    meliCode:  string

    @Prop({ type: [{ action: String, resource: String }], default: [] })
    permissions: Permission[]

    _id: mongoose.Types.ObjectId
}

export const UserSchema = SchemaFactory.createForClass(User)
