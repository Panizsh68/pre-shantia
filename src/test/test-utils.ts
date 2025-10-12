import { Provider } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { CachingService } from 'src/infrastructure/caching/caching.service';
import { TokensService } from 'src/utils/services/tokens/tokens.service';
import { PermissionsService } from 'src/features/permissions/permissions.service';
import { ShahkarService } from 'src/utils/services/shahkar/shahkar.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OtpService } from 'src/utils/services/otp/otp.service';
import { OrderFactoryService } from 'src/features/orders/order-factory.service';

// A central list of common provider tokens used across the app. Tests can
// import and spread this array into their TestingModule providers to avoid
// repeatedly mocking the same repository/infra tokens.

const makeMock = (name: string) => ({
  provide: name,
  useValue: {},
});

export function defaultTestProviders(): Provider[] {
  return [
    // repository tokens (string tokens used across modules)
    makeMock('UserRepository'),
    makeMock('ProfileRepository'),
    makeMock('ProductRepository'),
    makeMock('CartRepository'),
    makeMock('OrderRepository'),
    makeMock('WalletRepository'),
    makeMock('TicketRepository'),
    makeMock('TransportingRepository'),
    makeMock('CategoryRepository'),
    makeMock('CompanyRepository'),
    makeMock('RatingRepository'),

    // service interface tokens
    makeMock('IUsersService'),
    makeMock('IProfileService'),
    makeMock('IProductsService'),
    makeMock('ICartsService'),
    makeMock('IOrdersService'),
    makeMock('IPaymentService'),
    makeMock('IWalletsService'),
    makeMock('ITransactionsService'),
    makeMock('ITicketingService'),
    makeMock('ITransportingsService'),
    makeMock('ICategoryService'),
    makeMock('ICompanyService'),
    makeMock('IImageUploadService'),

    // infra / utility services (class tokens)
    {
      provide: TokensService,
      useValue: { validateAccessToken: jest.fn(), getAccessToken: jest.fn(), getRefreshToken: jest.fn() },
    },
    // permissions and image upload
    {
      provide: PermissionsService,
      useValue: { hasPermission: jest.fn().mockReturnValue(true), ensurePermission: jest.fn() },
    },
    {
      provide: 'IImageUploadService',
      useValue: { upload: jest.fn(), delete: jest.fn() },
    },
    {
      provide: ShahkarService,
      useValue: { verify: jest.fn() },
    },
    {
      provide: CachingService,
      useValue: { get: jest.fn(), set: jest.fn(), delete: jest.fn(), del: jest.fn() },
    },
    {
      provide: 'JwtService',
      useValue: { signAsync: jest.fn(), verifyAsync: jest.fn() },
    },
    {
      provide: 'ConfigService',
      useValue: { get: jest.fn().mockReturnValue(undefined) },
    },
    // class-based providers for commonly injected classes
    {
      provide: ConfigService,
      useValue: { get: jest.fn().mockReturnValue(undefined) },
    },
    {
      provide: JwtService,
      useValue: { signAsync: jest.fn(), verifyAsync: jest.fn() },
    },
    {
      provide: OtpService,
      useValue: { send: jest.fn(), verify: jest.fn() },
    },
    {
      provide: OrderFactoryService,
      useValue: { buildOrdersFromCart: jest.fn() },
    },

    // Mongoose model tokens (return a lightweight mock model)
    {
      provide: getModelToken('User'),
      useValue: {},
    },
    {
      provide: getModelToken('Cart'),
      useValue: {},
    },
    {
      provide: getModelToken('Order'),
      useValue: {},
    },
    {
      provide: getModelToken('Wallet'),
      useValue: {},
    },
    // additional repository tokens used in tests
    makeMock('TransactionRepository'),
    makeMock('TicketRepository'),
    makeMock('AuthRepository'),
  ];
}

export default defaultTestProviders;
