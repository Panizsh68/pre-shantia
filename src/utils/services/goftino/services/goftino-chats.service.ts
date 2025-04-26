import { Inject, Injectable } from '@nestjs/common';
import { GoftinoService } from './goftino.service';
import { GoftinoResponse } from '../interfaces/goftino-response.interface';
import { Chat } from '../interfaces/chat.interface';
import { MessageResponse } from '../interfaces/message-response.interface';
import { SendMessageDto } from '../dto/send_message.dto';
import { SendFileDto } from '../dto/send-file.dto';
import { SendMessageFromUserDto } from '../dto/send_message_from_user.dto';
import { EditMessageDto } from '../dto/edit-message.dto';
import { UnassignChatDto } from '../dto/unassign-chat.dto';
import { TransferChatDto } from '../dto/transfer-chat.dto';
import { CloseChatDto } from '../dto/close-chat.dto';
import { OperatorTypingDto } from '../dto/operator-typing.dto';
import { RemoveChatDto } from '../dto/remove-chat.dto';
import { SendPollDto } from '../dto/send-poll.dto';
import { CreateChatDto } from '../dto/create-chat.dto';

@Injectable()
export class GoftinoChatsService extends GoftinoService {
    @Inject('BASE_GOFTINO_SERVICE') private readonly goftinoService: GoftinoService

    async getChats(): Promise<GoftinoResponse<Chat[]>> {
        const response = await this.getApiClient().get('/chats');
        return response.data;
    }

    async getChatData(chat_id: string, from_date?: string): Promise<GoftinoResponse<Chat>> {
        const response = await this.getApiClient().get('/chat_data', {
            params: { chat_id, from_date}
        })
        return response.data
    }

    async sendMessage(dto: SendMessageDto): Promise<GoftinoResponse<MessageResponse>> {
        const response = await this.getApiClient().post('/send_message', dto);
        return response.data;
      }
    
    async sendFile(dto: SendFileDto): Promise<GoftinoResponse<MessageResponse>> {
        const response = await this.getApiClient().post('/send_file', dto);
        return response.data;
    }

    async sendMessageFromUser(dto: SendMessageFromUserDto): Promise<GoftinoResponse<MessageResponse>> {
        const response = await this.getApiClient().post('/send_message_from_user', dto);
        return response.data;
    }

    async operatorTyping(dto: OperatorTypingDto): Promise<GoftinoResponse<void>> {
        const response = await this.getApiClient().post('/operator_typing', dto);
        return response.data;
    }

    async closeChat(dto: CloseChatDto): Promise<GoftinoResponse<void>> {
        const response = await this.getApiClient().post('/close_chat', dto);
        return response.data;
      }
    
    async transferChat(dto: TransferChatDto): Promise<GoftinoResponse<void>> {
        const response = await this.getApiClient().post('/transfer_chat', dto);
        return response.data;
    }

    async unassignChat(dto: UnassignChatDto): Promise<GoftinoResponse<void>> {
        const response = await this.getApiClient().post('/unassign_chat', dto);
        return response.data;
    }

    async getUserUnreadMessages(chat_id: string): Promise<GoftinoResponse<MessageResponse[]>> {
        const response = await this.getApiClient().get('/user_unread_messages', {
            params: { chat_id },
        });
        return response.data;
    }

    async editMessage(dto: EditMessageDto): Promise<GoftinoResponse<MessageResponse>> {
        const response = await this.getApiClient().post('/edit_message', dto);
        return response.data;
      }
    
    async getEditedMessage(message_id: string): Promise<GoftinoResponse<MessageResponse>> {
        const response = await this.getApiClient().get('/edit_message', {
            params: { message_id },
        });
        return response.data;
    }

    async sendPoll(dto: SendPollDto): Promise<GoftinoResponse<void>> {
        const response = await this.getApiClient().post('/send_poll', dto);
        return response.data;
    }

    async createChat(dto: CreateChatDto): Promise<GoftinoResponse<Chat>> {
        const response = await this.getApiClient().post('/create_chat', dto);
        return response.data;
    }

    async removeChat(dto: RemoveChatDto): Promise<GoftinoResponse<void>> {
        const response = await this.getApiClient().post('/remove_chat', dto);
        return response.data;
    }
}
