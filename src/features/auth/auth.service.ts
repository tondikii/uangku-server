import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { Wallet } from '../../database/entities/wallet.entity';
import { TransactionCategory } from '../../database/entities/transaction-category.entity';
import { comparePassword, hashPassword } from '../../common/utils/bcrypt.util';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { JwtPayload } from './types/jwt-payload.type';
import { JwtService } from '@nestjs/jwt';
import TRANSACTION_CATEGORIES from '../../common/constants/transaction-categories.constant';

@Injectable()
export class AuthService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    private readonly jwtService: JwtService,
  ) {}

  async signUp(dto: SignUpDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existing = await queryRunner.manager.findOne(User, {
        where: { email: dto.email },
      });
      if (existing) throw new BadRequestException('Email already in use');

      const hashed = await hashPassword(dto.password);
      const newUser = queryRunner.manager.create(User, {
        ...dto,
        password: hashed,
      });
      const savedUser = await queryRunner.manager.save(User, newUser);

      const wallet = queryRunner.manager.create(Wallet, {
        name: 'Cash',
        user: savedUser,
      });
      await queryRunner.manager.save(Wallet, wallet);

      const categories = TRANSACTION_CATEGORIES.map((c) =>
        queryRunner.manager.create(TransactionCategory, {
          name: c.name,
          transactionType: c.transactionType,
          user: savedUser,
        }),
      );
      await queryRunner.manager.save(TransactionCategory, categories);

      await queryRunner.commitTransaction();

      delete savedUser.password;

      return { user: savedUser };
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof BadRequestException) throw error;

      throw new InternalServerErrorException(
        'Something went wrong during sign-up',
      );
    } finally {
      await queryRunner.release();
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
