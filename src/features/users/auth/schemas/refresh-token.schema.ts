import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { User } from "src/features/users/schemas/user.schema";

@Schema() 
export  class RefreshToken {
    @Prop() 
    refreshToken: string

    @Prop()
    userId: string
}


export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken)