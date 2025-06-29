import { WalletOwnerType } from 'src/features/wallets/enums/wallet-ownertype.enum';

const roleToOwnerTypeMap: Record<string, WalletOwnerType> = {
  company: WalletOwnerType.COMPANY,
  intermediary: WalletOwnerType.INTERMEDIARY,
  user: WalletOwnerType.USER,
};

const rolePriority = ['company', 'intermediary', 'user'];

export function determineOwnerType(roles: string[]): WalletOwnerType {
  for (const role of rolePriority) {
    if (roles.includes(role)) {
      return roleToOwnerTypeMap[role];
    }
  }
  return WalletOwnerType.USER;
}
