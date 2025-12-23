# Authorization Quick Reference

## آج (Today) - Quick Summary

### 🎯 امروز انجام شده (Completed Today)

#### High Priority ✅
1. **Carts** - Removed PermissionsGuard from user routes
2. **Orders** - Added user filtering + ownership check  
3. **Transactions** - Added superadmin conditional access

#### Medium Priority ✅
4. **Products** - Already correct (no changes)
5. **Companies** - Added company admin checks

#### Documentation ✅
6. **Integration Tests** - Created (auth-helpers, ticketing, orders)
7. **API Guide** - Complete documentation

---

## 🔑 Helper Functions Cheat Sheet

```typescript
// Check if superadmin
isSuperAdmin(user)
// true/false

// Check permission
hasPermission(user, Resource.ORDERS, Action.READ)
// true/false → superadmin always true

// Check resource ownership
canAccessOwnResource(user, ticket.createdBy)
// true/false → owner or superadmin true

// Check with error
ensureOwnResourceAccess(user, order.userId, 'order')
// throws if not owner/superadmin

// Filter list for non-admins
applyUserOwnershipFilter(user, false, {status: 'active'})
// {status: 'active'} for admin
// {status: 'active', userId: user.userId} for user

// Check company access
canAccessCompanyResource(user, 'company123')
// true if has COMPANIES permission

// Comprehensive check
canPerformAction(user, Resource.TICKETS, Action.UPDATE, {ownerId: ticket.createdBy})
// true if: has permission AND (no ownershipCheck OR owns resource)
```

---

## 🛣️ Route Patterns

### Pattern: Public
```typescript
@Get('/products')
// No guards - everyone can access
```

### Pattern: Auth Only
```typescript
@Get('/carts/active')
@UseGuards(AuthenticationGuard)
async handler(@CurrentUser() user: TokenPayload) {
  return this.service.getCart(user.userId);
}
// Just check authenticated
```

### Pattern: Permission-Based
```typescript
@Post('/products')
@UseGuards(AuthenticationGuard, PermissionsGuard)
@Permission(Resource.PRODUCTS, Action.CREATE)
async create(@Body() dto) {
  // Requires specific permission
}
```

### Pattern: Ownership-Based
```typescript
@Get('/orders/:id')
@UseGuards(AuthenticationGuard)
async getOrder(@CurrentUser() user, @Param('id') id) {
  const order = await this.service.findById(id);
  ensureOwnResourceAccess(user, order.userId, 'order');
  return order;
}
// User must own it
```

### Pattern: Filtered List
```typescript
@Get('/orders')
@UseGuards(AuthenticationGuard)
async list(@CurrentUser() user: TokenPayload) {
  if (!hasPermission(user, Resource.ORDERS, Action.READ)) {
    // User - only their orders
    return await this.service.findByUserId(user.userId);
  }
  // Admin - all orders
  return await this.service.findAll();
}
```

---

## 👥 Access Levels

### Level 1: Superadmin
**Condition:** `Resource.ALL` + `Action.MANAGE`
**Access:** Everything

### Level 2: Permission-Based
**Condition:** Specific `Resource` + `Action`
**Access:** What permission grants

### Level 3: Ownership-Based
**Condition:** User owns the resource
**Access:** Only their own

---

## 📁 File Locations

**Helper Functions:**
`src/common/utils/auth-helpers.ts`

**Authorization Audit:**
`src/common/docs/AUTHORIZATION_AUDIT.md`

**Implementation Guide:**
`src/common/docs/AUTHORIZATION_IMPLEMENTATION.md`

**API Documentation:**
`docs/API_AUTHORIZATION_GUIDE.md`

**This Summary:**
`AUTHORIZATION_SUMMARY.md`

---

## ❌ Common Mistakes

❌ Using PermissionsGuard on user-specific routes
```typescript
@Get('/carts/active')
@UseGuards(AuthenticationGuard, PermissionsGuard) // Wrong!
```

❌ Forgetting superadmin bypass
```typescript
if (!await this.isCompanyAdmin(id, user.userId)) {
  throw new ForbiddenException(); // Superadmin blocked!
}
```

❌ No filtering on list routes
```typescript
@Get('/orders')
async list() {
  return this.service.findAll(); // Regular user sees all!
}
```

---

## 💡 Tips

✅ Always check superadmin first before permission checks
✅ Use helpers instead of duplicating permission logic
✅ Filter lists for non-admin users
✅ Check ownership on sensitive operations
✅ Import `isSuperAdmin` and `hasPermission` from helpers

---

## 🧪 Testing Template

```typescript
// User accessing own resource ✅
const user = mockRegularUser;
const resource = { userId: 'user123' };
ensureOwnResourceAccess(user, resource.userId); // OK

// User accessing another's resource ❌
const otherUser = mockOtherUser;
expect(() => {
  ensureOwnResourceAccess(otherUser, resource.userId);
}).toThrow(ForbiddenException);

// Superadmin accessing any resource ✅
const admin = mockSuperAdmin;
ensureOwnResourceAccess(admin, 'anyone'); // OK
```

---

## 📞 Quick Links

- **auth-helpers.ts** - All helper functions
- **API_AUTHORIZATION_GUIDE.md** - Complete guide
- **AUTHORIZATION_IMPLEMENTATION.md** - How to implement for other features
- **\*\*.integration.spec.ts** - Test examples

---

**Everything is ready to use! 🚀**
