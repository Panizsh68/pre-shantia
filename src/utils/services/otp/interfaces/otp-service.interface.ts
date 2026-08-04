export interface IOtpService {
  sendOtpToPhone(phoneNumber: string): Promise<void>;
  verifyOtp(identifier: string, otp: string): Promise<boolean>;
}

export interface IOtpGenerator {
  generate(): string;
}

export interface ISmsProvider {
  sendTemplate(phoneNumber: string, template: string, otp: string): Promise<void>;
  sendDirectMessage(phoneNumber: string, otp: string): Promise<string>;
}

export interface ISmsResponse {
  return: {
    status: number;
    message: string;
  };
  entries: {
    messageid: number;
    message: string;
    status: number;
    statustext: string;
    sender: string;
    receptor: string;
    date: number;
    cost: number;
  }[];
}
