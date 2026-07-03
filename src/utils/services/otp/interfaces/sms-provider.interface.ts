export interface ISmsProvider {
  sendTemplate(phoneNumber: string, template: string, otp: string): Promise<void>;
}