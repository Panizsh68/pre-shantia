import { OnGatewayConnection, WebSocketGateway } from "@nestjs/websockets";
import { Socket } from "socket.io";
import { TokensService } from "src/utils/services/tokens/tokens.service";

@WebSocketGateway()
export abstract class WsGateway implements OnGatewayConnection {
  constructor(protected readonly tokensService: TokensService) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;

    if (token) {
      try {
        const payload = await this.tokensService.validate(token);
        client.data.user = payload;
      } catch (err) {
        // Don't disconnect — just unauthenticated
        console.warn('Invalid token on socket connect, continuing without auth');
      }
    }
    // No token = public access
  }
} 