import { CreateUserDto } from "src/features/users/dto/create-user.dto";

export class SignUpDto extends CreateUserDto{
    userAgent?: string
    ip?: string
    otp?: string | undefined
}