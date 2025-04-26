import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { LoggerService } from "src/common/logger/logger.service";

@WebSocketGateway({ cors: { origin: '*' }})
export class GoftinoGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;

    constructor(private readonly loggerService: LoggerService) {}

    handleConnection(client: Socket) {
        this.loggerService.log(`Client connected: ${client.id}`, 'GoftinoGateway');
    }

    handleDisconnect(client: Socket) {
        this.loggerService.log(`Client disconnected: ${client.id}`, 'GoftinoGateway');
    }

    @SubscribeMessage('joinChat')
    handleJoinChat(client: Socket, chatId: string) {
        client.join(chatId);
        this.loggerService.log(`Client ${client.id} joined chat: ${chatId}`, 'GoftinoGateway');
    }

    notifyNewMessage(chatId: string, message: any) {
        this.server.to(chatId).emit('newMessage', message);
        this.loggerService.log(`New message in chat: ${chatId}`, 'GoftinoGateway');
    }

    notifyWebhookEvent(chatId: string, event: string, data: any) {
        this.server.to(chatId).emit(event, data);
        this.loggerService.log(`Notified event ${event} to chat ${chatId}`, 'GoftinoGateway');
    }
}