import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { Socket } from "socket.io";
import { TokenPayload } from "src/features/users/auth/interfaces/token-payload.interface";
import { TokensService } from "src/utils/services/tokens/tokens.service";

export class WsAuthenticationGuard {

    constructor(private readonly tokensService: TokensService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const client: Socket  = context.switchToWs().getClient<Socket>();
        const token = client.handshake.auth?.token;

        if (!token) {
            throw new UnauthorizedException('Missing token')
        }

        try { 
            const payload : TokenPayload = await this.tokensService.validate(token);
            const user = client.data.user as TokenPayload;
        } catch (error) {
            throw new UnauthorizedException('Invalid token')
        }

        return true;
    }
}