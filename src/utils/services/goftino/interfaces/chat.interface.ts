export interface Chat {
    chat_id: string;
    user_id: string;
    status: 'open' | 'closed';
    created_at: string;
}   