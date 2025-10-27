import {
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { hashPassword, comparePassword } from '../../common/utils/bcrypt.util';
import TRANSACTION_CATEGORIES from '../../common/constants/transaction-categories.constant';

jest.mock('../../common/utils/bcrypt.util', () => ({
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let dataSource: jest.Mocked<DataSource>;
  let queryRunner: jest.Mocked<QueryRunner>;
  let userRepo: jest.Mocked<Repository<User>>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(() => {
    queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
      },
    } as unknown as jest.Mocked<QueryRunner>;

    dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
    } as unknown as jest.Mocked<DataSource>;

    userRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as any;

    jwtService = {
      signAsync: jest.fn(),
    } as any;

    service = new AuthService(dataSource, userRepo, jwtService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('signUp', () => {
    const dto = { email: 'test@mail.com', password: '12345678', name: 'John' };

    it('should create user, wallet, and categories successfully', async () => {
      (queryRunner.manager.findOne as jest.Mock).mockResolvedValue(null);
      (hashPassword as jest.Mock).mockResolvedValue('hashed');

      (queryRunner.manager.create as jest.Mock)
        .mockImplementation((_entity, obj) => obj)
        .mockReturnValueOnce({ id: 1, ...dto })
        .mockReturnValueOnce({ id: 2, name: 'Cash' })
        .mockReturnValueOnce({ name: 'Salary' });

      (queryRunner.manager.save as jest.Mock)
        .mockResolvedValueOnce({ id: 1, ...dto, password: 'hashed' })
        .mockResolvedValueOnce({ id: 2, name: 'Cash' })
        .mockResolvedValueOnce(TRANSACTION_CATEGORIES);

      const result = await service.signUp(dto);

      expect(queryRunner.connect).toHaveBeenCalled();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.manager.findOne).toHaveBeenCalledWith(User, {
        where: { email: dto.email },
      });
      expect(hashPassword).toHaveBeenCalledWith(dto.password);
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(result.user.email).toBe(dto.email);
      expect(result.user.password).toBeUndefined();
    });

    it('should throw BadRequestException if email already exists', async () => {
      (queryRunner.manager.findOne as jest.Mock).mockResolvedValue({ id: 1 });

      await expect(service.signUp(dto)).rejects.toThrow(BadRequestException);
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException on unexpected error', async () => {
      (queryRunner.manager.findOne as jest.Mock).mockRejectedValue(
        new Error('DB error'),
      );

      await expect(service.signUp(dto)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('signIn', () => {
    const dto = { email: 'test@mail.com', password: '12345678' };
    const mockUser = {
      id: 1,
      email: dto.email,
      password: 'hashed',
    } as User;

    it('should return user and token on success', async () => {
      userRepo.findOne.mockResolvedValue({ ...mockUser });
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
      userRepo.findOne.mockResolvedValue(mockUser);
      (comparePassword as jest.Mock).mockResolvedValue(false);

      await expect(service.signIn(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw InternalServerErrorException on unexpected error', async () => {
      userRepo.findOne.mockRejectedValue(new Error('DB error'));

      await expect(service.signIn(dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
