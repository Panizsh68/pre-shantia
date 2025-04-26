import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { User } from "src/features/users/entities/user.entity";

@Schema() 
export  class RefreshToken {
    @Prop() 
    refreshToken: string

    @Prop()
    userId: string
}


export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken)