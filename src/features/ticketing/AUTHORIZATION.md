# Authorization System - یکپارچه و ساده

## مشکل اصلی
سیستم authorization پیچیده بود زیرا:
1. هر جا permission check می‌شد، کد تکراری می‌شد
2. سوپرادمین و کاربران عادی متفاوت شناسایی می‌شدند
3. Helper methods یکپارچه‌ای برای بررسی دسترسی نبود

## راه حل: Utility Functions

### `src/common/utils/auth-helpers.ts`

این file شامل تابع‌های helper یکپارچه‌ای است:

#### 1. `isSuperAdmin(user?: TokenPayload): boolean`
```typescript
// Superadmin = کسی که Resource.ALL + Action.MANAGE دارد
if (isSuperAdmin(user)) {
  // دسترسی کامل
}
```

#### 2. `hasPermission(user, resource, action): boolean`
```typescript
// بررسی permission برای یک resource و action
// اگر superadmin است → true
// اگر یک permission specific دارد → check آن
if (hasPermission(user, Resource.TICKETING, Action.READ)) {
  // دسترسی داره
}
```

#### 3. `checkResourceAccess(user, resource, action): boolean`
```typescript
// همان hasPermission
```

## اصول طراحی

### اصل 1: Superadmin شناسایی
```typescript
// تمام جا یک روش
const isSuperAdmin = user?.permissions?.some(
  p => p.resource === Resource.ALL && p.actions.includes(Action.MANAGE)
);
```

### اصل 2: Permission Check یکپارچه
```typescript
// بجای این:
const hasPermission = user?.permissions?.some(p =>
  p.resource === Resource.TICKETING &&
  p.actions.includes(Action.READ)
);

// استفاده از این:
const hasPermission = hasPermission(user, Resource.TICKETING, Action.READ);
```

### اصل 3: Hierarchical Access
```typescript
// RULES:
// 1. اگر superadmin → همه دسترسی‌ها
// 2. اگر specific permission → فقط آن دسترسی
// 3. اگر نه → forbidden (یا owner check)
```

## الگوی استفاده در Controllers

### الگو 1: Public Routes (فقط Auth)
```typescript
@Get()
@UseGuards(AuthenticationGuard)
async findAll(
  @CurrentUser() user: TokenPayload,
  @Query() options: FindManyOptions
) {
  // Superadmin یا TICKETING.READ → see all
  const canSeeAll = hasPermission(user, Resource.TICKETING, Action.READ);
  
  if (!canSeeAll) {
    // Regular user → فقط خودش
    options.conditions.createdBy = user.userId;
  }
}
```

### الگو 2: Protected Routes (Auth + Specific Permission)
```typescript
@Patch(':id')
@UseGuards(AuthenticationGuard, PermissionsGuard)
@Permission(Resource.TICKETING, Action.UPDATE)
async update(
  @Param('id') id: string,
  @Body() dto: UpdateTicketDto
) {
  // Guard اطمینان دارد که یا superadmin است یا TICKETING.UPDATE دارد
  // برای owner checks اضافی، می‌تونیم در اینجا check کنیم:
  const ticket = await this.ticketingService.findOne(id);
  if (ticket.createdBy !== user.userId && !isSuperAdmin(user)) {
    throw new BadRequestException('Forbidden');
  }
}
```

### الگو 3: Nested Resources (Child Ownership Check)
```typescript
@Post(':ticketId/comments')
@UseGuards(AuthenticationGuard)
async addComment(
  @CurrentUser() user: TokenPayload,
  @Param('ticketId') ticketId: string,
  @Body() dto: CreateCommentDto
) {
  const ticket = await this.ticketingService.findOne(ticketId);
  
  // Superadmin یا TICKETING.UPDATE → همه چیز
  const canUpdate = hasPermission(user, Resource.TICKETING, Action.UPDATE);
  
  // Regular user → فقط ticket خودش
  if (!canUpdate && ticket.createdBy !== user.userId) {
    throw new BadRequestException('Forbidden');
  }
}
```

## فلو بررسی دسترسی

```
درخواست کاربر
    ↓
آیا authenticated است؟ (AuthenticationGuard)
    ├─ خیر → 401 Unauthorized
    └─ بله → ادامه
         ↓
آیا route نیاز به specific permission دارد؟
    ├─ خیر → دسترسی داره (public to auth'd users)
    └─ بله → PermissionsGuard check می‌کنه
         ↓
hasPermission(user, resource, action) check می‌کنه:
    ├─ isSuperAdmin? → true
    ├─ دارای specific permission? → true
    └─ نه → false (PermissionsGuard deny می‌کنه)
         ↓
Controller route execute می‌شه
         ↓
اگر owner-specific باشه، اضافی check:
    ├─ isSuperAdmin? → allow
    ├─ createdBy === userId? → allow
    └─ نه → 403 Forbidden
```

## معادلات Permission

### برای Ticketing:

| User Type | Permission | GET | GET :id | POST | PATCH | DELETE | Comments |
|-----------|-----------|-----|---------|------|-------|--------|----------|
| Regular | TICKETING.CREATE | Own | Own | ✓ | ✗ | ✗ | Own |
| Staff | TICKETING.READ+UPDATE | All | All | ✓ | ✓ | ✗ | All |
| Admin | TICKETING.* | All | All | ✓ | ✓ | ✓ | All |
| Superadmin | Resource.ALL + MANAGE | All | All | ✓ | ✓ | ✓ | All |

## پیاده‌سازی در Ticketing

### مثال از فیلتر برای Regular Users:

```typescript
// GET /tickets → فقط تیکت‌های خودش
if (!hasPermission(user, Resource.TICKETING, Action.READ)) {
  options.conditions.createdBy = user.userId;
}
```

### مثال از Owner Check:

```typescript
// GET /tickets/:id
const ticket = await this.ticketingService.findOne(id);
if (!hasPermission(user, Resource.TICKETING, Action.READ) 
    && ticket.createdBy !== user.userId) {
  throw new BadRequestException('Forbidden');
}
```

## خلاصه مزایا

✅ **ساده**: تنها یک روش برای check permission  
✅ **Consistent**: تمام جا یکپارچه  
✅ **Readable**: کد خوانا و واضح  
✅ **Scalable**: برای resources جدید کپی‌پیست می‌شود  
✅ **Secure**: Superadmin detection یکپارچه  
✅ **Maintainable**: اگر logic change شود، یک جا تغيير  

## نکات مهم

1. **Guard آخرین مرحله نیست**:
   - `PermissionsGuard` check می‌کنه که permission دارند
   - اما `owner check` داخل route باید شود

2. **Public routes**:
   - فقط `AuthenticationGuard` استفاده کنند
   - Permission check داخل route body

3. **Protected routes**:
   - `PermissionsGuard` + `@Permission()` برای بزرگ operations
   - Owner check اگر لازم باشه

4. **Superadmin**:
   - همیشه `isSuperAdmin()` check می‌شود
   - دسترسی کامل به همه resources
