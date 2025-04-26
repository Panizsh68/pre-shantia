export interface GoftinoResponse<T> {
    status: 'success' | 'error';
    code?: string;
    message?: string;
    data?: T;
}