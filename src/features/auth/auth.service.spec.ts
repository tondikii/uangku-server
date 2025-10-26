import {
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { Wallet } from '../../database/entities/wallet.entity';
import { JwtService } from '@nestjs/jwt';
import { hashPassword, comparePassword } from '../../common/utils/bcrypt.util';

jest.mock('../../common/utils/bcrypt.util', () => ({
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: jest.Mocked<Repository<User>>;
  let walletRepo: jest.Mocked<Repository<Wallet>>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(() => {
    userRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as any;

    walletRepo = {
      create: jest.fn(),
      save: jest.fn(),
    } as any;

    jwtService = {
      signAsync: jest.fn(),
    } as any;

    service = new AuthService(userRepo, jwtService, walletRepo);
  });

  afterEach(() => jest.clearAllMocks());

  // --- SIGN UP ---
  describe('signUp', () => {
    const dto = { email: 'a@b.com', password: '123456', name: 'John' };

    it('should create new user and wallet successfully', async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue(null);
      (hashPassword as jest.Mock).mockResolvedValue('hashedpass');
      const mockUser = {
        id: 1,
        email: dto.email,
        name: dto.name,
        password: 'hashedpass',
      };
      (userRepo.create as jest.Mock).mockReturnValue(mockUser);
      (userRepo.save as jest.Mock).mockResolvedValue({ ...mockUser });
      (walletRepo.create as jest.Mock).mockReturnValue({ id: 1, name: 'Cash' });
      (walletRepo.save as jest.Mock).mockResolvedValue({ id: 1, name: 'Cash' });

      const result = await service.signUp(dto);

      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { email: dto.email },
      });
      expect(hashPassword).toHaveBeenCalledWith(dto.password);
      expect(userRepo.create).toHaveBeenCalled();
      expect(walletRepo.create).toHaveBeenCalledWith({
        name: 'Cash',
        user: mockUser,
      });
      expect(result.user.email).toBe(dto.email);
      expect(result.user.password).toBeUndefined(); // password should be deleted
    });

    it('should throw BadRequestException if email already in use', async () => {
      userRepo.findOne.mockResolvedValueOnce({ id: 1 } as any);

      await expect(service.signUp(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw InternalServerErrorException on unexpected error', async () => {
      userRepo.findOne.mockRejectedValueOnce(new Error('DB error'));

      await expect(service.signUp(dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  // --- SIGN IN ---
  describe('signIn', () => {
    const dto = { email: 'a@b.com', password: '123456' };

    it('should return user and access token successfully', async () => {
      const mockUser = {
        id: 1,
        email: dto.email,
        password: 'hashedpass',
      } as User;
      userRepo.findOne.mockResolvedValue({ ...mockUser }); // clone disini ✅
      (comparePassword as jest.Mock).mockResolvedValue(true);
      jwtService.signAsync.mockResolvedValue('jwt-token');

      const result = await service.signIn(dto);

      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { email: dto.email },
      });
      expect(comparePassword).toHaveBeenCalledWith(
        dto.password,
        mockUser.password,
      );
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        id: mockUser.id,
        email: mockUser.email,
      });
      expect(result.accessToken).toBe('jwt-token');
      expect(result.user.password).toBeUndefined();
    });

    it('should throw UnauthorizedException if user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.signIn(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password mismatch', async () => {
      const mockUser = {
        id: 1,
        email: dto.email,
        password: 'hashedpass',
      } as User;
      userRepo.findOne.mockResolvedValue(mockUser);
      (comparePassword as jest.Mock).mockResolvedValue(false);

      await expect(service.signIn(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw InternalServerErrorException on unexpected error', async () => {
      userRepo.findOne.mockRejectedValueOnce(new Error('DB error'));

      await expect(service.signIn(dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
