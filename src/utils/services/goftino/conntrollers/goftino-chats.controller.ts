import { Body, Controller, Get, Param, Post, Query, UseFilters, UseInterceptors } from "@nestjs/common";
import { GoftinoExceptionFilter } from "../goftino.exception-filter";
import { GoftinoResponse } from "../interfaces/goftino-response.interface";
import { Chat } from "../interfaces/chat.interface";
import { SendMessageDto } from "../dto/send_message.dto";
import { MessageResponse } from "../interfaces/message-response.interface";
import { SendFileDto } from "../dto/send-file.dto";
import { FileInterceptor } from "@nestjs/platform-express";
import { CloseChatDto } from "../dto/close-chat.dto";
import { SendMessageFromUserDto } from "../dto/send_message_from_user.dto";
import { TransferChatDto } from "../dto/transfer-chat.dto";
import { CreateChatDto } from "../dto/create-chat.dto";
import { UnassignChatDto } from "../dto/unassign-chat.dto";
import { OperatorTypingDto } from "../dto/operator-typing.dto";
import { RemoveChatDto } from "../dto/remove-chat.dto";
import { EditMessageDto } from "../dto/edit-message.dto";
import { SendPollDto } from "../dto/send-poll.dto";
import { GoftinoChatsService } from "../services/goftino-chats.service";
import { ApiBody, ApiParam, ApiQuery } from "@nestjs/swagger";

@Controller('goftino/chats')
@UseFilters(GoftinoExceptionFilter)
export class GoftinoChatsController {
    constructor(
        private readonly goftinoChatService: GoftinoChatsService,
    ) {}

    @Get()
    async getChats(): Promise<GoftinoResponse<Chat[]>> {
      return this.goftinoChatService.getChats();
    }
  
    @Get(':chat_data')
    @ApiParam({ name: 'chat_id', required: true})
    @ApiQuery({ name: 'from_date', required: false })
    async getChatData(
      @Param('chat_id') chat_id: string,
      @Query('from_date') from_date?: string,
    ): Promise<GoftinoResponse<Chat>> {
      return this.goftinoChatService.getChatData(chat_id, from_date);
    }
  
    @Post('send-message')
    @ApiBody({ type: SendMessageDto })
    async sendMessage(@Body() dto: SendMessageDto): 
      Promise<GoftinoResponse<MessageResponse>> {
      return this.goftinoChatService.sendMessage(dto);
    }


    @Post('send-message-from-user')
    @ApiBody({ type: SendMessageFromUserDto })
    async sendMessageFromUser(@Body() dto: SendMessageFromUserDto): 
      Promise<GoftinoResponse<MessageResponse>> {
      return this.goftinoChatService.sendMessageFromUser(dto);
    }
  
  
    @Post('send-file')
    @UseInterceptors(FileInterceptor('file'))
    @ApiBody({ type: SendFileDto })
    async sendFile(@Body() dto: SendFileDto): 
      Promise<GoftinoResponse<MessageResponse>> {
      return this.goftinoChatService.sendFile(dto);
    }
  

    @Post('operator-typing')
    @ApiBody({ type: OperatorTypingDto })
    async operatorTyping(@Body() dto: OperatorTypingDto): 
      Promise<GoftinoResponse<void>> {
      return this.goftinoChatService.operatorTyping(dto);
    }
  
    @Post('close-chat')
    @ApiBody({ type: CloseChatDto })
    async closeChat(@Body() dto: CloseChatDto): 
      Promise<GoftinoResponse<void>> {
      return this.goftinoChatService.closeChat(dto);
    }

    @Post('unassign-chat')
    @ApiBody({ type: UnassignChatDto })
    async unassignChat(@Body() dto: UnassignChatDto): 
    Promise<GoftinoResponse<void>> {
    return this.goftinoChatService.unassignChat(dto);
  }

    @Post('create-chat')
    @ApiBody({ type: CreateChatDto })
    async createChat(@Body() dto: CreateChatDto): 
      Promise<GoftinoResponse<Chat>> {
      return this.goftinoChatService.createChat(dto);
    }
  
    @Post('remove-chat')
    @ApiBody({ type: RemoveChatDto })
    async removeChat(@Body() dto: RemoveChatDto): 
      Promise<GoftinoResponse<void>> {
      return this.goftinoChatService.removeChat(dto);
    }
  
  @Post('transfer-chat')
  @ApiBody({ type: TransferChatDto })
  async transferChat(@Body() dto: TransferChatDto): 
    Promise<GoftinoResponse<void>> {
      return this.goftinoChatService.transferChat(dto);
    }
  
  @Get(':chat_id/unread-messages')
  @ApiParam({ name: 'chatId', required: true})
  async getUserUnreadMessages(@Param('chatId') chatId: string): 
    Promise<GoftinoResponse<MessageResponse[]>> {
    return this.goftinoChatService.getUserUnreadMessages(chatId);
  }

  @Post(':chat_id/edit-message')
  @ApiBody({ type: EditMessageDto })
  async editMessage(@Body() dto: EditMessageDto): 
    Promise<GoftinoResponse<MessageResponse>> {
    return this.goftinoChatService.editMessage(dto);
  }

  @Get('edited-message/:message_id')
  @ApiParam({ name: 'messageId', required: true})
  async getEditedMessage(@Param('messageId') messageId: string): 
    Promise<GoftinoResponse<MessageResponse>> {
    return this.goftinoChatService.getEditedMessage(messageId);
  }

  @Post('send-poll')
  @ApiBody({ type: SendPollDto })
  async sendPoll(@Body() dto: SendPollDto): 
    Promise<GoftinoResponse<void>> {
    return this.goftinoChatService.sendPoll(dto);
  }
}