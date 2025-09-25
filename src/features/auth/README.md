# Auth Feature — Flow & Dependencies

## Purpose (internal / dev-facing)
This document is a **compact, precise, and developer-friendly reference** for the Auth feature.  
It explains what each route does, what data flows through it, which services/DB/cache it touches, the **token lifecycle**, and known bugs with recommended fixes.  
Audience: internal team. Focus: clear, actionable, implementation-focused.

---

## Files Reviewed
- `src/features/auth/auth.controller.ts`  
- `src/features/auth/auth.service.ts`  
- `src/features/auth/auth.module.ts`  
- `src/features/auth/repositories/auth.repository.ts`  
- `src/features/auth/guards/auth.guard.ts`  
- `src/features/auth/schemas/refresh-token.schema.ts`  
- `src/features/auth/dto/sign-up.dto.ts`  
- `src/features/auth/dto/sign-in.dto.ts`  
- `src/features/auth/dto/verify-otp.dto.ts`  
- `src/features/auth/dto/sign-up.response.dto.ts`  
- `src/features/auth/dto/signn-in.response.dto.ts`  
- `src/features/auth/interfaces/auth-response.interface.ts`  
- `src/features/auth/interfaces/token-payload.interface.ts`  
- `src/utils/services/tokens/tokens.service.ts`  
- `src/utils/services/tokens/tokentype.enum.ts`  
- `src/utils/services/tokens/Itokens.interface.ts`  
- `src/utils/services/otp/otp.service.ts`  
- `src/infrastructure/caching/caching.service.ts`  
- `src/utils/services/shahkar/shahkar.service.ts` (module imported; implementation examined in module)  
- `src/features/users/users.service.ts`  
- `src/features/users/profile/profile.service.ts`  
- `src/features/wallets/wallets.service.ts`  
- `src/utils/wallet-owner.util.ts`  
- `src/features/wallets/enums/wallet-ownertype.enum.ts`  
- `src/features/permissions/decoratorss/permissions.decorators.ts`  
- `src/features/permissions/guard/permission.guard.ts`  
- `src/features/permissions/enums/resources.enum.ts`  
- `src/features/permissions/enums/actions.enum.ts`  
- `src/features/permissions/interfaces/permissions.interface.ts`  
- `src/common/decorators/current-user.decorator.ts`  
- `src/common/decorators/request-context.decorator.ts`  
- `src/common/types/request-context.interface.ts`  
- `src/features/users/dto/create-user.dto.ts`  

---

## High-Level Overview
Auth is **OTP-based** for both sign-up and sign-in.  

### Main Routes
- **`POST /auth/signup`** — start sign-up, save temp data in cache, send OTP  
- **`POST /auth/signin`** — request OTP for existing user  
- **`POST /auth/verify-otp`** — verify OTP; if new user → create user + wallet + profile (in DB transaction); always issue tokens  
- **`POST /auth/refresh`** — exchange refresh token for new access token (checks session context in cache)  
- **`POST /auth/signout`** — clear refresh session and permissions cache (⚠️ current code deletes profile — bug)  
- **`GET /auth/me`** — return current profile + permissions from token or cache  
- **`POST /auth/admin-signup`** — admin creates user without OTP and tokens are issued  

---

## DTOs / Shapes (Quick Reference)
```ts
// CreateUserDto
{ phoneNumber: string; nationalId: string; }

// SignInDto
{ phoneNumber: string }

// VerifyOtpDto
{ phoneNumber: string; otp: string } // 4-digit OTP

// SignUpDto extends CreateUserDto
{ phoneNumber, nationalId, permissions?: PermissionDto[] }

// SignUpResponseDto
{ phoneNumber, accessToken?, refreshToken?, profile? }

// TokenPayload
{
  userId: string;
  permissions: IPermission[];
  tokenType: 'access' | 'refresh';
  userAgent?: string;
  ip?: string;
  iat?: number;
  exp?: number;
}
Cache Keys & Behaviors
signup:${phoneNumber} → { phoneNumber, nationalId } (TTL = OTP_TTL)

${phoneNumber} → OTP string (TTL = OTP_TTL)

refresh-info:${refreshToken} → { ip, userAgent, userId } (TTL = JWT_REFRESH_EXPIRES)

permissions:${userId} → cached permissions (cleared on signOut)

Tokens — Generation & Validation
Access token

Created via TokensService.getAccessToken(payload)

Payload encrypted with AES-256-GCM

Signed with JWT_ACCESS_SECRET (HS256), expiry = 1h

Refresh token

Similar creation, signed with JWT_REFRESH_SECRET (HS512), expiry = 48h

Session info stored in cache (refresh-info:${token})

Validation

validateAccessToken() — verify + decrypt

validateRefreshToken() — verify + decrypt + match cache context (ip, userAgent)

Route-by-Route Details
Each route includes request shape, guards, checks, actions, and response.
(See main text for full step-by-step breakdown, including signup, signin, verify-otp, refresh, signout, me, admin-signup.)

External Dependencies & Modules
ShahkarService — validates national ID ↔ phone number

OtpService — OTP generation & SMS sending

TokensService — JWT + AES encrypt/decrypt

CachingService — Redis abstraction

UsersService / ProfileService — user/profile creation & queries

WalletsService — wallet creation logic

Permissions system — decorators, enums, guards

AuthRepository — DB transactions

Known Issues & Fixes (Prioritized)
❌ Bug: signOut deletes profile
→ Remove or move to a dedicated "delete account" endpoint.

❌ Refresh token missing throws plain Error
→ Replace with BadRequestException or UnauthorizedException.

❌ Admin signup saves empty ip/userAgent in cache
→ Fix by storing request context.

❌ Double profile creation risk
→ Centralize logic / add createProfile? flag.

❌ No refresh token rotation
→ Implement rotation to reduce replay attack risk.

⚠️ Cookie secure: true in dev
→ Make environment-dependent.

Testing Coverage (Needed)
Integration tests for:

signup → verify-otp → /auth/me

signin → verify-otp → refresh → signout

Transactional wallet/profile creation race conditions

Refresh token validation with mismatched context

Suggested PR Checklist
 Remove profile deletion in signOut

 Improve refresh error handling

 Store real ip/userAgent in admin signup cache

 Prevent double profile creation

 Implement refresh token rotation

 Make cookie secure flag configurable

 Add OTP + refresh integration tests