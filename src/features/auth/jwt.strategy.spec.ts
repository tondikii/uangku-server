import { JwtStrategy } from './jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';

describe('JwtStrategy', () => {
  let jwtStrategy: JwtStrategy;
  let configService: ConfigService;
  let userRepo: jest.Mocked<Repository<User>>;

  beforeEach(() => {
    configService = {
      get: jest.fn().mockReturnValue('super-secret-key'),
    } as any;

    userRepo = {
      findOne: jest.fn(),
    } as any;

    jwtStrategy = new JwtStrategy(configService, userRepo);
  });

  it('should be defined', () => {
    expect(jwtStrategy).toBeDefined();
  });

  describe('constructor', () => {
    it('should initialize strategy with JWT secret', () => {
      expect(configService.get).toHaveBeenCalledWith('JWT_SECRET');
    });
  });

  describe('validate', () => {
    it('should return user without password', async () => {
      const mockUser: any = {
        id: 1,
        email: 'test@example.com',
        password: 'hashed',
      };
      userRepo.findOne.mockResolvedValueOnce({ ...mockUser });

      const result = await jwtStrategy.validate({ sub: 1 });

      expect(userRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual({ id: 1, email: 'test@example.com' });
      expect((result as any).password).toBeUndefined();
    });

    it('should throw error if user not found', async () => {
      userRepo.findOne.mockResolvedValueOnce(null);

      await expect(jwtStrategy.validate({ sub: 999 })).rejects.toThrowError();
    });
  });
});
