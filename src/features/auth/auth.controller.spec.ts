import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { successResponse } from '../../common/utils/response.util';

jest.mock('../../common/utils/response.util', () => ({
  successResponse: jest.fn((data, message) => ({
    success: true,
    message,
    data,
  })),
}));

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            signUp: jest.fn(),
            signIn: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('signUp', () => {
    it('should return success response when user registers', async () => {
      const dto = { email: 'a@b.com', password: '12345678', name: 'John' };
      const userData = { id: '1', email: dto.email, name: dto.name };
      (service.signUp as jest.Mock).mockResolvedValue({ user: userData });

      const result = await controller.signUp(dto);

      expect(service.signUp).toHaveBeenCalledWith(dto);
      expect(successResponse).toHaveBeenCalledWith(
        { user: userData },
        'User registered successfully',
      );
      expect(result).toEqual({
        success: true,
        message: 'User registered successfully',
        data: { user: userData },
      });
    });
  });

  describe('signIn', () => {
    it('should return success response with token', async () => {
      const dto = { email: 'a@b.com', password: '12345678' };
      const mockResult = {
        user: { id: '1', email: dto.email, name: 'John' },
        accessToken: 'jwt-token',
      };
      (service.signIn as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.signIn(dto);

      expect(service.signIn).toHaveBeenCalledWith(dto);
      expect(successResponse).toHaveBeenCalledWith(
        mockResult,
        'User signed in successfully',
      );
      expect(result).toEqual({
        success: true,
        message: 'User signed in successfully',
        data: mockResult,
      });
    });
  });
});
