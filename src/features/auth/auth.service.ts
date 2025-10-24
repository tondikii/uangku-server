// src/features/auth/auth.service.ts
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { comparePassword, hashPassword } from '../../common/utils/bcrypt.util';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { JwtPayload } from './types/jwt-payload.type';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async signUp(dto: SignUpDto) {
    try {
      const existing = await this.userRepo.findOne({
        where: { email: dto.email },
      });
      if (existing) throw new BadRequestException('Email already in use');

      const hashed = await hashPassword(dto.password);
      const user = this.userRepo.create({ ...dto, password: hashed });
      const savedUser = await this.userRepo.save(user);

      delete savedUser.password;

      return {
        user: savedUser,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(
        'Something went wrong during sign-up',
      );
    }
  }

  async signIn(dto: SignInDto): Promise<{ user: User; accessToken: string }> {
    try {
      const user = await this.userRepo.findOne({ where: { email: dto.email } });
      if (!user) throw new UnauthorizedException('Invalid email or password');

      const isMatch = await comparePassword(dto.password, user.password);
      if (!isMatch)
        throw new UnauthorizedException('Invalid email or password');

      const payload: JwtPayload = { id: user.id, email: user.email };
      const accessToken = await this.jwtService.signAsync(payload);

      delete user.password;

      return {
        user,
        accessToken,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new InternalServerErrorException(
        'Something went wrong during sign-in',
      );
    }
  }
}
