import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { hashPassword, comparePassword } from '../../common/utils/bcrypt.util';

// Mock bcrypt utils
jest.mock('../../common/utils/bcrypt.util', () => ({
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: jest.Mocked<Repository<User>>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepo = module.get(getRepositoryToken(User));
    jwtService = module.get(JwtService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('signUp', () => {
    it('should register user successfully', async () => {
      userRepo.findOne.mockResolvedValue(null);
      (hashPassword as jest.Mock).mockResolvedValue('hashedPass');
      userRepo.create.mockReturnValue({
        email: 'a@b.com',
        password: 'hashedPass',
      } as any);
      userRepo.save.mockResolvedValue({
        id: '1',
        email: 'a@b.com',
        name: 'John Doe',
      } as any);

      const result = await service.signUp({
        email: 'a@b.com',
        password: '12345678',
        name: 'John Doe',
      });

      expect(result.user.email).toBe('a@b.com');
      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { email: 'a@b.com' },
      });
      expect(hashPassword).toHaveBeenCalledWith('12345678');
      expect(userRepo.save).toHaveBeenCalled();
    });

    it('should throw if email already exists', async () => {
      userRepo.findOne.mockResolvedValue({ id: '1' } as any);

      await expect(
        service.signUp({
          email: 'a@b.com',
          password: '12345678',
          name: 'John Doe',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('signIn', () => {
    it('should return access token when credentials are valid', async () => {
      userRepo.findOne.mockResolvedValue({
        id: '1',
        email: 'a@b.com',
        password: 'hashed',
      } as any);
      (comparePassword as jest.Mock).mockResolvedValue(true);
      jwtService.signAsync.mockResolvedValue('jwt-token');

      const result = await service.signIn({
        email: 'a@b.com',
        password: '12345678',
      });

      expect(result.accessToken).toBe('jwt-token');
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        id: '1',
        email: 'a@b.com',
      });
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.signIn({ email: 'a@b.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      userRepo.findOne.mockResolvedValue({
        id: '1',
        email: 'a@b.com',
        password: 'hashed',
      } as any);
      (comparePassword as jest.Mock).mockResolvedValue(false);

      await expect(
        service.signIn({ email: 'a@b.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
