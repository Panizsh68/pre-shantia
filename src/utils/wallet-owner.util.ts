import { Action } from 'src/features/permissions/enums/actions.enum';
import { IPermission } from 'src/features/permissions/interfaces/permissions.interface';
import { WalletOwnerType } from 'src/features/wallets/enums/wallet-ownertype.enum';

const actionToOwnerTypeMap: Record<string, WalletOwnerType> = {
  deposit_company: WalletOwnerType.COMPANY,
  deposit_intermediary: WalletOwnerType.INTERMEDIARY,
  deposit_user: WalletOwnerType.USER,
};

const ownerPriority: WalletOwnerType[] = [
  WalletOwnerType.COMPANY,
  WalletOwnerType.INTERMEDIARY,
  WalletOwnerType.USER,
];

export function determineOwnerTypeFromPermissions(permissions: IPermission[]): WalletOwnerType {
  const foundTypes: Set<WalletOwnerType> = new Set();

  for (const perm of permissions) {
    for (const action of perm.actions) {
      const ownerType = actionToOwnerTypeMap[action];
      if (ownerType) {
        foundTypes.add(ownerType);
      }
    }
  }

  for (const type of ownerPriority) {
    if (foundTypes.has(type)) {
      return type;
    }
  }

  return WalletOwnerType.USER;
}
