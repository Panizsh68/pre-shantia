import { IProfile } from '../../users/profile/interfaces/profile.interface';
import { Types } from 'mongoose';

// We only need walletId as string in responses
export interface AuthResponseProfile extends Omit<Pick<IProfile, 'phoneNumber' | 'nationalId' | 'firstName' | 'lastName' | 'address' | 'walletId'>, 'walletId'> {
  walletId?: string;
}

export interface VerifyOtpResponse {
  accessToken?: string;
  refreshToken?: string;
  profile?: AuthResponseProfile;
}
