import { ClientSession } from 'mongoose';

export function toMongooseSession(session?: ClientSession): ClientSession | null {
  return session as unknown as ClientSession | null;
}
