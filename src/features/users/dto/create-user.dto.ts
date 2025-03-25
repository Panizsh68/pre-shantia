import { ApiProperty } from "@nestjs/swagger"
import { IsArray, IsIdentityCard, IsNotEmpty, IsPhoneNumber, Matches, ValidateNested } from "class-validator"
import { Permission } from "../auth/interfaces/permission.interface";
import { Action } from "../auth/enums/actions.enum";
import { Resource } from "../auth/enums/resources.enum";
import { Type } from "class-transformer";

class PermissionDto {
    @ApiProperty({ enum: Action })
    @IsNotEmpty()
    action: Action;

    @ApiProperty({ enum: Resource })
    @IsNotEmpty()
    resource: Resource;
}

export class CreateUserDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsPhoneNumber('IR')
    phoneNumber: string

    @ApiProperty()
    @IsNotEmpty()
    @IsIdentityCard('IR')
    @Matches(/^\d{10}$/, { message: "Invalid Iranian National ID" })
    meliCode: string

    @ApiProperty({ type: [PermissionDto] }) // Documenting permissions
    @IsArray()
    @ValidateNested({ each: true }) 
    @Type(() => PermissionDto) 
    permissions?: PermissionDto[];
}
