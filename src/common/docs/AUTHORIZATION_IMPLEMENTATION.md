# دستورالعمل پیاده‌سازی Authorization برای باقی Features

## ✅ Features که درست هستند

### 1. Ticketing ✓
- ✅ Owner check دارند
- ✅ Helper functions استفاده می‌کنند
- ✅ Nested resources protected هستند

### 2. Wallets ✓
- ✅ Owner check دارند
- ✅ `ownerId` و `ownerType` check شده‌اند
- ✅ User فقط خودش rو می‌تونه credit/debit کنه

### 3. Auth ✓
- ✅ routes protected هستند
- ✅ Public routes واضح هستند

### 4. Ratings ✓
- ✅ Public read
- ✅ Protected create

### 5. Categories ✓
- ✅ Public read
- ✅ Protected modify

## ⚠️ Features نیاز update دارند

### 1. Carts - High Priority

**مشکل**: 
- `GET /carts/active` باید owner check داشته باشه
- `GET /carts/populated` باید owner check داشته باشه

**راه حل**:
```typescript
// src/features/carts/carts.controller.ts

@Get('active')
@UseGuards(AuthenticationGuard)
@ApiOperation({ summary: 'Get the active cart for current user' })
@ApiResponse({ status: 200, description: 'User active cart returned' })
async getUserActiveCart(@CurrentUser() user: TokenPayload) {
  // فقط cart خودش
  // No need for PermissionsGuard - فقط auth
  return this.cartsService.getActiveCart(user.userId);
}
```

### 2. Orders - High Priority

**مشکل**:
- User می‌تونه orders دیگران رو ببینه
- باید filter شه

**راه حل**:
```typescript
// src/features/orders/orders.controller.ts

@Get()
@UseGuards(AuthenticationGuard)
@ApiOperation({ 
  summary: 'Get user orders',
  description: 'Regular users see only their own orders. Admins see all.'
})
async findAll(@CurrentUser() user: TokenPayload, @Query() options: FindManyOptions) {
  // Admin/staff with ORDERS.READ → all
  const isAdmin = hasPermission(user, Resource.ORDERS, Action.READ);
  
  if (!isAdmin) {
    // Regular user → فقط خودش
    if (!options.conditions) options.conditions = {};
    options.conditions.userId = user.userId;
  }
  
  return this.ordersService.findAll(options);
}

@Get(':id')
@UseGuards(AuthenticationGuard)
async findOne(@CurrentUser() user: TokenPayload, @Param('id') id: string) {
  const order = await this.ordersService.findOne(id);
  
  // Owner check
  if (order.userId !== user.userId && !isSuperAdmin(user)) {
    throw new ForbiddenException('Cannot access another user\'s order');
  }
  
  return order;
}
```

### 3. Transactions - High Priority

**مشکل**:
- User می‌تونه transactions دیگران رو ببینه
- باید filter شه

**راه حل**:
```typescript
// src/features/transaction/transaction.controller.ts

@Get()
@UseGuards(AuthenticationGuard)
@ApiOperation({ 
  summary: 'Get user transactions',
  description: 'Regular users see only their own transactions. Admins see all.'
})
async getAllTransactions(@CurrentUser() user: TokenPayload) {
  const isAdmin = isSuperAdmin(user);
  
  if (isAdmin) {
    // Admin → همه
    return this.transactionService.getAllTransactions();
  } else {
    // User → فقط خودش
    return this.transactionService.getByUserId(user.userId);
  }
}
```

### 4. Products - Medium Priority

**مشکل**:
- Admin routes و user routes مختلط شده‌اند
- نیاز separation دارند

**راه حل**:
```typescript
// src/features/products/products.controller.ts

// Route 1: Public search (همگی)
@Get('search')
@ApiOperation({ summary: 'Search products publicly' })
async searchProducts(@Query('q') q: string) {
  return this.productsService.search(q);
}

// Route 2: Admin list (فقط admin)
@Get('admin/all')
@UseGuards(AuthenticationGuard, PermissionsGuard)
@Permission(Resource.PRODUCTS, Action.READ)
@ApiOperation({ summary: 'Get all products for admin' })
async findAllForAdmin() {
  return this.productsService.findAll();
}

// Route 3: User list (فقط خودش یا public)
@Get()
@ApiOperation({ summary: 'Get public products list' })
async findAll() {
  return this.productsService.findAllPublished();
}
```

### 5. Companies - Medium Priority

**مشکل**:
- بعضی operations company-scoped هستند
- نیاز validation دارند

**راه حل**:
```typescript
// src/features/companies/companies.controller.ts

@Patch(':id')
@UseGuards(AuthenticationGuard, PermissionsGuard)
@Permission(Resource.COMPANIES, Action.UPDATE)
@ApiOperation({ summary: 'Update company details' })
async update(@CurrentUser() user: TokenPayload, @Param('id') id: string, @Body() dto: UpdateCompanyDto) {
  // فقط company admins یا superadmin می‌تونند update کنند
  if (!isSuperAdmin(user)) {
    // Check if user is admin of this company
    const isCompanyAdmin = await this.companiesService.isUserAdmin(id, user.userId);
    if (!isCompanyAdmin) {
      throw new ForbiddenException('Not admin of this company');
    }
  }
  
  return this.companiesService.update(id, dto);
}
```

## 📋 Implementation Checklist

### High Priority (امروز)

- [ ] **Carts**
  - [ ] Add owner check to `/carts/active`
  - [ ] Add owner check to `/carts/populated`
  - [ ] Import helper functions
  - [ ] Test with different users

- [ ] **Orders**
  - [ ] Add filter by userId for regular users
  - [ ] Add owner check to GET /:id
  - [ ] Update API documentation
  - [ ] Test with different roles

- [ ] **Transactions**
  - [ ] Add filter by userId for regular users
  - [ ] Separate admin and user endpoints
  - [ ] Test with different roles

### Medium Priority (این هفته)

- [ ] **Products**
  - [ ] Separate admin endpoints
  - [ ] Add clarity to documentation
  - [ ] Update route descriptions

- [ ] **Companies**
  - [ ] Add company-scoped permission checks
  - [ ] Add admin verification

- [ ] **Update all controllers**
  - [ ] Import auth-helpers
  - [ ] Replace inline permission checks
  - [ ] Add consistent documentation

### Low Priority (بعداً)

- [ ] Review remaining features
- [ ] Add integration tests
- [ ] Update API documentation in README

## 🔧 Template برای اصلاح هر Controller

```typescript
import { hasPermission, isSuperAdmin, ensureOwnResourceAccess } from 'src/common/utils/auth-helpers';

@Controller('resource')
export class ResourceController {
  /**
   * Public/User list - with optional admin all
   */
  @Get()
  @UseGuards(AuthenticationGuard)
  async findAll(
    @CurrentUser() user: TokenPayload,
    @Query() options: FindManyOptions
  ) {
    // Check if user can see all
    const canSeeAll = hasPermission(user, Resource.RESOURCE, Action.READ);
    
    if (!canSeeAll) {
      // Filter by ownership
      if (!options.conditions) options.conditions = {};
      options.conditions.userId = user.userId;
    }
    
    return this.service.findAll(options);
  }

  /**
   * User-specific get
   */
  @Get(':id')
  @UseGuards(AuthenticationGuard)
  async findOne(
    @CurrentUser() user: TokenPayload,
    @Param('id') id: string
  ) {
    const resource = await this.service.findOne(id);
    
    // Ensure access
    ensureOwnResourceAccess(user, resource.userId, 'resource');
    
    return resource;
  }

  /**
   * Admin-only operations
   */
  @Patch(':id')
  @UseGuards(AuthenticationGuard, PermissionsGuard)
  @Permission(Resource.RESOURCE, Action.UPDATE)
  async update(
    @CurrentUser() user: TokenPayload,
    @Param('id') id: string,
    @Body() dto: UpdateResourceDto
  ) {
    // Already protected by guard, but can add extra checks
    return this.service.update(id, dto);
  }
}
```

## ✔️ Verification Checklist

قبل از commit کردن:

```typescript
// 1. تمام routes authenticated هستند یا public
// 2. Owner-specific routes owner check دارند
// 3. Admin routes Permission decorator دارند
// 4. Helper functions استفاده شده‌اند
// 5. API docs واضح هستند
// 6. Test coverage وجود دارد
// 7. No hardcoded permission checks
// 8. Consistent error messages
```

## مثال: اصلاح Carts

```typescript
// BEFORE
@Get('active')
@UseGuards(AuthenticationGuard, PermissionsGuard)
@Permission(Resource.CARTS, Action.READ)
async getUserActiveCart(@CurrentUser() user: TokenPayload) {
  return this.cartsService.getActiveCart(user.userId);
}

// AFTER
@Get('active')
@UseGuards(AuthenticationGuard)
@ApiOperation({ 
  summary: 'Get user active cart',
  description: 'Returns the active shopping cart for the current user only'
})
@ApiResponse({ status: 200, description: 'Active cart returned' })
@ApiResponse({ status: 404, description: 'No active cart found' })
async getUserActiveCart(@CurrentUser() user: TokenPayload) {
  // فقط auth needed - صرفاً user خودش می‌تونه ببینه
  return this.cartsService.getActiveCart(user.userId);
}
```

**نتیجه**: 
- PermissionsGuard حذف شد (نیاز نیست - user فقط خودش رو می‌بینه)
- API docs واضح تر شد
- Owner check implicit است (userId از user token گرفته می‌شود)
