# Auth feature — Technical Reference

This document is a technical reference for the `auth` feature. It describes routes, DTOs, service logic, cache usage, tokens, data models, transactions, external dependencies and known issues detected in the code. No opinions or unrelated suggestions are included — only facts, flows and detected problems.

---

## Routes (controller)
All routes are under the `/auth` controller.

1. POST /auth/signup
   - Public route.
   - Input: `CreateUserDto` (phoneNumber, nationalId) — validation via `class-validator` (`IsPhoneNumber('IR')`, `IsIdentityCard('IR')`).
   - Service: `AuthService.signUp(createUserDto)`
     - Checks user existence via `usersService.findUserByPhoneNumber(phoneNumber)` → 409 if exists.
     - Verifies nationalId & phoneNumber with `ShahkarService.verifyMelicodeWithPhonenumber` → 400 if mismatch.
     - Stores `{ phoneNumber, nationalId }` in cache under key `signup:${phoneNumber}` with TTL `app.OTP_TTL` (config).
     - Calls `OtpService.sendOtpToPhone(phoneNumber)` which stores OTP in cache under key equal to `phoneNumber` (TTL same as OTP_TTL) and logs/mock-sends SMS.
   - Response: 201 `{ phoneNumber }`.

2. POST /auth/signin
   - Public route.
   - Input: `SignInDto` (phoneNumber).
   - Service: `AuthService.signIn(signInDto)`
     - Finds user by phone number → 404 if not found.
     - Calls `OtpService.sendOtpToPhone(phoneNumber)` (OTP stored in cache).
   - Response: 200 `{ phoneNumber }`.

3. POST /auth/verify-otp
   - Public route.
   - Input: `VerifyOtpDto` { phoneNumber, otp } and `RequestContext` (provided by a decorator that extracts `ip` and `userAgent` from the request). Response passed-through via Express `res` to set header and cookie.
   - Service: `AuthService.verifyOtp(verifyOtpDto, context)`
     - Validates OTP via `OtpService.verifyOtp(phoneNumber, otp)` (compares cached OTP under key `phoneNumber`).
     - Reads sign-up temp data from cache at `signup:${phoneNumber}`.
     - Looks up user via `usersService.findUserByPhoneNumber(phoneNumber)`.

     Two flows:
     a) New user (user not found):
       - If no `signup:${phoneNumber}` in cache → 400 `User not found and no sign-up data`.
       - Determine `permissions` (super-admin detection via config `SUPERADMIN_MELICODE` and `SUPERADMIN_PHONE`).
       - Start DB transaction via `authRepository.startTransaction()` (BaseTransactionRepository).
       - Create user: `usersService.create(userCreateInput, session)`.
       - Determine wallet owner type with `determineOwnerTypeFromPermissions(permissions)`.
       - Create wallet: `walletsService.createWallet({ ownerId: user.id, ownerType }, session)`.
       - Create profile with `walletId`: `profileService.create({ phoneNumber, nationalId, walletId }, session)`.
       - Commit transaction and delete `signup:${phoneNumber}` cache entry.
     b) Existing user:
       - Skip create flow.

     - Generate tokens:
       - Build `TokenPayload` (userId, permissions, tokenType).
       - `TokensService.getAccessToken(payload)` → signed JWT (HS256, 1h) with encrypted payload fields.
       - `TokensService.getRefreshToken(payload)` → signed JWT (HS512, 48h) with encrypted payload fields.
     - Store refresh session info in cache key `refresh-info:${refreshToken}` with value `{ ip, userAgent, userId }` and TTL `JWT_REFRESH_EXPIRES`.
     - Read profile via `profileService.getByUserId(user.id)` and return `{ accessToken?, refreshToken?, profile? }`.
   - Controller behavior: sets `Authorization` header with `Bearer <accessToken>` and sets `refreshToken` cookie (httpOnly, secure, sameSite=strict, maxAge 48h) if provided.

4. POST /auth/refresh
   - Public route.
   - Input: either `{ refreshToken }` in request body or cookie `refreshToken`.
   - Controller extracts refresh token from body or cookie and throws `BadRequestException('Refresh token not provided')` if missing.
   - Service: `AuthService.refreshAccessTokenByRefreshToken(refreshToken, context)`
     - `TokensService.validateRefreshToken(refreshToken, context)`:
       - Verifies JWT with `JWT_REFRESH_SECRET` (HS512), decrypts payload.
       - Reads `refresh-info:${refreshToken}` from cache and compares `ip` and `userAgent` with `context`.
       - Throws `UnauthorizedException` if mismatch or not found.
     - Loads user by `payload.userId` via `usersService.findOne`.
     - Generates new access token via `TokensService.getAccessToken`.
     - Returns `{ accessToken }` and controller sets `Authorization` header.

5. POST /auth/signout
   - Protected (AuthenticationGuard validates access token and puts payload into `request.user`).
   - Controller clears cookie `refreshToken` (if `res` provided) and calls `AuthService.signOut(user.userId, refreshToken?)`.
   - Service `AuthService.signOut`:
     - If refreshToken provided → deletes `refresh-info:${refreshToken}` from cache.
     - Deletes `permissions:${userId}` cache.
     - (Removed: previously deleted profile via `profileService.deleteByUserId(userId)` — this code was removed to avoid data loss.)
     - Returns `{ message: 'Signed out successfully' }`.

6. GET /auth/me
   - Protected.
   - Returns `{ userId, permissions, profile? }` where `profile` is retrieved via `profileService.getByUserId(user.userId)` and `permissions` are taken from token payload or fallback to a hard-coded default list in controller.

7. POST /auth/admin-signup
   - Protected and guarded by `PermissionsGuard` with `Permission(Resource.USERS, Action.MANAGE)`.
   - Input: `SignUpDto` (extends `CreateUserDto`, optional `permissions`).
   - Service: `AuthService.adminSignUp(signUpDto)`
     - Creates user directly (`usersService.create(signUpDto)`).
     - Generates access and refresh tokens for the created user and saves `refresh-info:${refreshToken}` in cache with `{ ip: '', userAgent: '', userId }`.
     - Returns `{ phoneNumber, accessToken, refreshToken }`.

---

## DTOs and types
- `CreateUserDto` (src/features/users/dto/create-user.dto.ts)
  - phoneNumber: string (validated `IsPhoneNumber('IR')`)
  - nationalId: string (validated `IsIdentityCard('IR')`, regex `^\d{10}$`)

- `SignInDto` (src/features/auth/dto/sign-in.dto.ts)
  - phoneNumber: string

- `VerifyOtpDto` (src/features/auth/dto/verify-otp.dto.ts)
  - phoneNumber: string
  - otp: string (4 digits)

- `SignUpDto` (src/features/auth/dto/sign-up.dto.ts) extends `CreateUserDto` and adds optional `permissions?: PermissionDto[]`.

- `VerifyOtpResponse` / `SignUpResponseDto` (src/features/auth/dto/sign-up.response.dto.ts)
  - phoneNumber: string
  - accessToken?: string
  - refreshToken?: string
  - profile?: { phoneNumber, nationalId, firstName?, lastName?, address?, walletId? }

- `TokenPayload` (src/features/auth/interfaces/token-payload.interface.ts)
  - userId: string
  - tokenType: TokenType (access | refresh)
  - permissions: IPermission[]
  - ip?: string
  - userAgent?: string
  - iat?, exp?

---

## Cache keys (Redis) and TTLs
- `signup:${phoneNumber}` — stores `{ phoneNumber, nationalId }`. TTL: `app.OTP_TTL` (config, default ~300s).
- `${phoneNumber}` — stores current OTP as a plain string. TTL: `app.OTP_TTL`.
- `refresh-info:${refreshToken}` — stores `{ ip, userAgent, userId }`. TTL: `JWT_REFRESH_EXPIRES` (config, default 48*3600s).
- `permissions:${userId}` — cached permissions for user; cleared on sign-out.

---

## Tokens and cryptography
- Access token
  - Generated by `TokensService.getAccessToken(payload)`.
  - Payload fields are encrypted using AES-256-GCM with `ENCRYPTION_KEY` (hex, 32 bytes). Encrypted key/value pairs are placed into the JWT payload as strings.
  - Signed using `JWT_ACCESS_SECRET` with HS256 algorithm. Expiry: 1 hour.

- Refresh token
  - Generated by `TokensService.getRefreshToken(payload)`.
  - Signed using `JWT_REFRESH_SECRET` with HS512 algorithm. Expiry: 48 hours.
  - After generation the server stores `refresh-info:${refreshToken}` in Redis with `ip` and `userAgent` to bind the refresh token to the client context.

- Validation
  - `validateAccessToken(token)` verifies signature using `JWT_ACCESS_SECRET`, decrypts payload and returns `TokenPayload`.
  - `validateRefreshToken(token, context)` verifies signature using `JWT_REFRESH_SECRET`, decrypts payload, then validates `refresh-info:${token}` matches provided `context.ip` and `context.userAgent`. If mismatch → `UnauthorizedException`.

---

## Data models (Mongoose schemas)
- User (src/features/users/entities/user.entity.ts)
  - phoneNumber: string (required)
  - nationalId: string (required)
  - permissions: IPermission[] (default: [])
  - Timestamps active (createdAt/updatedAt)

- Profile (src/features/users/profile/entities/profile.entity.ts)
  - firstName?: string
  - lastName?: string
  - email?: string
  - phoneNumber: string (required)
  - address?: string
  - nationalId: string (required)
  - walletId?: string (ref 'Wallet')
  - orders, transactions, favorites, cart references

- Wallet (src/features/wallets/entities/wallet.entity.ts)
  - ownerId: string (required)
  - ownerType: WalletOwnerType (enum: 'user' | 'company' | 'intermediary')
  - balance: number (min 0, default 0)
  - currency: string (3-letter uppercase, e.g. 'IRR')

- RefreshToken (src/features/auth/schemas/refresh-token.schema.ts)
  - token: string
  - userId: string
  - createdAt: Date (document TTL expires: '7d')

---

## Repository transaction helper
- `BaseTransactionRepository` provides `startTransaction()`, `commitTransaction(session)` and `abortTransaction(session)`.
- Implementations of transaction flows in `AuthService.verifyOtp` use the repository to ensure user, wallet and profile creation are atomic.
- Errors in start/commit/abort are mapped to `BadRequestException` by the repository helper.

---

## External dependencies used by auth
- `ShahkarService` (src/utils/services/shahkar/shahkar.service.ts)
  - Verifies nationalId vs phoneNumber. Current implementation is mocked (returns true) and logs `shahkar passed`.
  - Real integration would call an external HTTP API. Config keys: `SHAHKAR_BASE_URL`, `SHAHKAR_API_KEY`.

- `OtpService` — generates 4-digit OTP, stores in Redis under key `${phoneNumber}`, TTL `app.OTP_TTL`.

- `CachingService` — Redis client (ioredis) wrapper; used as the main store for OTPs and refresh session info.

- `TokensService` — JWT sign/verify plus AES encryption of payloads. Requires `ENCRYPTION_KEY`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`.

- `WalletsService`, `UsersService`, `ProfileService` — internal feature services used to create/read user, wallet and profile documents.

---

---

End of file.
