export interface WebhookEvent {
    event: 'new_message' | 'close_chat' | 'transfer_chat' | 'rating' | 'click_button';
    data: {
      chat_id: string;
      user_id?: string;
      message_id?: string;
      sender?: { from: 'user' | 'operator'; id: string; name?: string };
      date?: string;
      content?: string;
      type?: string;
      current_owner?: string[];
      action_by?: string;
      to_operator?: string;
      rate?: string;
    };
}