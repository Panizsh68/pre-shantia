import { SetMetadata } from "@nestjs/common"
import { Permission } from "src/features/users/auth/interfaces/permission.interface"

export const WS_PERMISSIONS_KEY = 'ws_permissions'
export const WsPermissions = (permissions: Permission[]) => SetMetadata(WS_PERMISSIONS_KEY, permissions)