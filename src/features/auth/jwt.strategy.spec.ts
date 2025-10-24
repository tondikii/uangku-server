import { JwtStrategy } from './jwt.strategy';
import { ConfigService } from '@nestjs/config';

describe('JwtStrategy', () => {
  let jwtStrategy: JwtStrategy;
  let mockConfigService: Partial<ConfigService>;

  beforeEach(() => {
    mockConfigService = {
      get: jest.fn().mockReturnValue('test-secret'),
    };

    jwtStrategy = new JwtStrategy(mockConfigService as ConfigService);
  });

  it('should be defined', () => {
    expect(jwtStrategy).toBeDefined();
  });

  it('should call ConfigService.get with "JWT_SECRET"', () => {
    expect(mockConfigService.get).toHaveBeenCalledWith('JWT_SECRET');
  });

  it('should return user object with userId and email in validate()', async () => {
    const payload = { id: 1, email: 'test@example.com' };
    const result = await jwtStrategy.validate(payload);

    expect(result).toEqual({
      userId: 1,
      email: 'test@example.com',
    });
  });
});
