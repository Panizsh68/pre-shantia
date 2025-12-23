# سیستم Authorization یکپارچه برای تمام Features

## 📋 خلاصه وضعیت فعلی

سیستم authorization پروژه از ترکیب موارد زیر استفاده می‌کند:
- **AuthenticationGuard**: بررسی که آیا کاربر logged in است
- **PermissionsGuard**: بررسی permission برای specific resource/action
- **@Permission()**: decorator برای مشخص کردن نیاز permission

## ✅ نقاط قوت سیستم

1. **Superadmin Detection**: `Resource.ALL + Action.MANAGE` برای superadmin
2. **Company-Scoped Permissions**: permissions می‌تونند به یک company مربوط باشند
3. **Flexible Permission Service**: `PermissionsService.hasPermission()` خوب کار می‌کنه

## ⚠️ مشاکل شناسایی‌شده

### 1. **تکرار کد Permission Check**
```typescript
// ❌ بد - تکرار شده تو بسیاری routes
const hasPermission = user?.permissions?.some(p =>
  p.resource === Resource.TICKETING &&
  p.actions.includes(Action.READ)
);

// ✅ بهتر - یک helper استفاده کن
const hasPermission = hasPermission(user, Resource.TICKETING, Action.READ);
```

### 2. **Owner-Based Access نامنسجم**
- بعضی features owner check دارند
- بعضی features نه
- باید یک الگو یکپارچه باشد

### 3. **Nested Resources بدون Protection**
مثال:
- `/tickets/:id/comments` - باید check کند ownership
- `/products/:id/reviews` - احتمالاً نیاز protection دارد

### 4. **User-Specific vs Admin-Specific Routes**
بعضی routes فقط برای خودش باید:
- `/carts/active` - فقط active cart خودش
- `/profile` - فقط profile خودش
- `/wallet` - فقط wallet خودش

## 🎯 راه حل پیشنهادی

### مرحله 1: Enhance Helper Utilities

```typescript
// src/common/utils/auth-helpers.ts

/**
 * بررسی آیا کاربر می‌تونه این resource رو ببینه
 * Rules:
 * 1. Superadmin → always yes
 * 2. دارای permission → yes
 * 3. owner check → optional
 */
export function canAccessResource(
  user: TokenPayload | undefined,
  resource: Resource,
  action: Action,
  ownerCheck?: {
    ownerId: string;
    userId: string;
  }
): boolean {
  if (!user) return false;

  // Superadmin always has access
  if (isSuperAdmin(user)) return true;

  // Check permission
  if (!hasPermission(user, resource, action)) return false;

  // If owner check needed and user doesn't have UPDATE/DELETE
  if (ownerCheck && action === Action.READ) {
    return ownerCheck.ownerId === ownerCheck.userId;
  }

  return true;
}

/**
 * برای user-specific routes مثل cart, profile, wallet
 * اگر user خودش نبود → forbidden
 */
export function isOwnResource(userId: string, requestedUserId: string): boolean {
  return userId === requestedUserId;
}

/**
 * برای company-scoped operations
 */
export function canAccessCompanyResource(
  user: TokenPayload | undefined,
  companyId: string,
  userCompanyId?: string
): boolean {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;
  
  // Check if user has company-scoped permission
  const hasCompanyPerm = user.permissions?.some(
    p => p.companyId && p.companyId.toString() === companyId
  );
  
  // یا اگر user برای این company کار می‌کنه
  return hasCompanyPerm || userCompanyId === companyId;
}
```

### مرحله 2: Helper برای Common Patterns

```typescript
/**
 * مثال الگو برای routes
 */

// Pattern 1: Public Routes (فقط Auth)
@Get()
@UseGuards(AuthenticationGuard)
async findAll() {
  // public
}

// Pattern 2: Permission-Based Routes
@Get()
@UseGuards(AuthenticationGuard, PermissionsGuard)
@Permission(Resource.PRODUCTS, Action.READ)
async findAllAdmin() {
  // فقط admin/superadmin
}

// Pattern 3: Owner-Based Routes
@Get('active')
@UseGuards(AuthenticationGuard)
async getActive(
  @CurrentUser() user: TokenPayload,
  @Param('userId') userId: string
) {
  // بررسی ownership
  if (!isSuperAdmin(user) && user.userId !== userId) {
    throw new ForbiddenException('Cannot access another user resource');
  }
}

// Pattern 4: Nested Resource with Owner Check
@Post(':parentId/comments')
@UseGuards(AuthenticationGuard)
async addComment(
  @CurrentUser() user: TokenPayload,
  @Param('parentId') parentId: string
) {
  const parent = await this.getParent(parentId);
  
  // Superadmin یا owner یا staff with UPDATE
  if (!isSuperAdmin(user) && 
      !hasPermission(user, Resource.TICKETING, Action.UPDATE) &&
      parent.createdBy !== user.userId) {
    throw new ForbiddenException('Cannot add comment to others resource');
  }
}
```

## 📊 جدول Authorization Patterns

| Route Type | Guard | Permission Decorator | Owner Check | مثال |
|-----------|-------|---------------------|-------------|-----|
| Public | - | - | - | POST /tickets (create) |
| Auth-Only | AuthenticationGuard | - | - | GET /ratings |
| Permission-Based | PermissionsGuard | ✓ | - | PATCH /products/:id |
| Owner-Based | AuthenticationGuard | - | ✓ | GET /cart/active |
| Protected Nested | AuthenticationGuard | (check in route) | ✓ | POST /tickets/:id/comments |
| Admin-Only | PermissionsGuard | ✓ | - | DELETE /products/:id |

## 🔍 بررسی هر Feature

### ✅ Auth
- POST /auth/signup - public ✓
- POST /auth/signin - public ✓
- POST /auth/verify-otp - public ✓
- POST /auth/admin-signup - Protected (USERS.MANAGE) ✓
- GET /auth/me - AuthenticationGuard ✓
- PATCH /auth/users/:id/permissions - Protected (USERS.MANAGE) ✓

### ⚠️ Carts
- GET /carts/active - AuthenticationGuard ✓ (لازم owner check)
- GET /carts/populated - AuthenticationGuard ✓ (لازم owner check)
- POST /carts - AuthenticationGuard ✓ (لازم owner check)
- PATCH /carts/:id - PermissionsGuard ✓
- DELETE /carts/:id - PermissionsGuard ✓

**مشکل**: `/active` و `/populated` باید صرفاً cart خودش رو return کنند

### ✅ Categories
- GET /categories - Public ✓
- POST /categories - Protected (CATEGORIES.CREATE) ✓
- PATCH /categories/:id/status - Protected (CATEGORIES.UPDATE) ✓

### ⚠️ Companies
- GET /companies - Public ✓
- POST /companies - Protected (COMPANIES.CREATE) ✓
- PATCH /companies/:id - Protected (COMPANIES.UPDATE) ✓

**مشکل**: بعضی operations company-scoped هستند و باید check شود

### ⚠️ Orders
- POST /orders - Protected (ORDERS.CREATE) ✓ (لازم owner check)
- GET /orders - Protected (ORDERS.READ) ✓ (لازم owner filter)
- GET /orders/:id - Protected (ORDERS.READ) ✓ (لازم owner check)
- PATCH /orders/:id - Protected (ORDERS.UPDATE) ✓

**مشکل**: User فقط می‌تونه خودش رو orders ببینه

### ⚠️ Products
- GET /products - Public ✓
- POST /products - Protected (PRODUCTS.CREATE) ✓
- PATCH /products/:id - Protected (PRODUCTS.UPDATE) ✓
- GET /products/admin - Protected (PRODUCTS.READ/CREATE) ✓

**مشکل**: Admin routes و user routes مختلط شده‌اند

### ✅ Ratings
- POST /ratings - Protected (RATINGS.CREATE) ✓
- GET /ratings/product/:id - Public ✓

### ⚠️ Tickets (درست شده) ✓

### ⚠️ Transactions
- GET /transaction - Protected (TRANSACTION.READ) ✓ (لازم user filter)

**مشکل**: User فقط می‌تونه خودش rو transactions ببینه

### ⚠️ Transportings
- POST /transportings - Protected (TRANSPORTING.CREATE) ✓
- GET /transportings - Protected (TRANSPORTING.READ) ✓

### ⚠️ Users
- GET /users/created-by-super - Protected (ALL.MANAGE) ✓

### ⚠️ Wallets
- GET /wallet - Protected (WALLETS.READ) ✓ (لازم owner check)
- POST /wallet/credit - Protected (WALLETS.UPDATE) ✓ (لازم owner check)

**مشکل**: User فقط می‌تونه خودش wallet ببینه

## 🛠️ اقدامات توصیه‌شده

### 1. **Standardize User-Specific Routes**
Routes که فقط برای خودش باید:
```typescript
// Always check ownership
if (user.userId !== requestedUserId && !isSuperAdmin(user)) {
  throw new ForbiddenException('Cannot access another user resource');
}
```

### 2. **Implement Consistent Filtering**
```typescript
// برای routes که list رو می‌دونند
if (!hasPermission(user, resource, Action.READ)) {
  // Regular user → filter by ownership
  options.conditions.userId = user.userId;
}
```

### 3. **Use Helper Functions**
```typescript
// بجای تکرار
import { hasPermission, isSuperAdmin, isOwnResource } from 'src/common/utils/auth-helpers';
```

### 4. **Document Each Route**
```typescript
@Get()
@UseGuards(AuthenticationGuard)
@ApiOperation({
  summary: 'Get user tickets',
  description: 'Regular users see only their own tickets. Admins see all.'
})
async findAll(@CurrentUser() user: TokenPayload) {
  // ...
}
```

## 🎯 Priority Implementation

### High (امروز)
1. ✅ Ticketing - done
2. Wallets - user-specific routes
3. Carts - user-specific routes
4. Orders - user-specific routes
5. Transactions - user-specific routes

### Medium (این هفته)
1. Profile - user-specific
2. Products - admin vs user routes
3. Companies - company-scoped

### Low (بعداً)
1. Ratings - mostly correct
2. Categories - mostly correct
3. Auth - mostly correct

## 📝 نتیجه‌گیری

سیستم authorization:
- ✅ Base خوب دارد (PermissionsService)
- ✅ Superadmin detection صحیح است
- ❌ نیاز owner/user-specific checks دارد
- ❌ نیاز helper functions دارد
- ❌ نیاز standardization دارد

**Next Step**: انجام Priority High features
