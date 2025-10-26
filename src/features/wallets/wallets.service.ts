import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from '../../database/entities/wallet.entity';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class WalletsService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
  ) {}

  async findAll(user: User) {
    return this.walletRepo.find({
      where: { user },
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number, user: User) {
    const wallet = await this.walletRepo.findOne({ where: { id, user } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    return wallet;
  }

  async create(user: User, dto: CreateWalletDto) {
    const wallet = this.walletRepo.create({
      ...dto,
      user,
    });
    return this.walletRepo.save(wallet);
  }

  async update(id: number, user: User, dto: UpdateWalletDto) {
    const wallet = await this.findOne(id, user);
    Object.assign(wallet, dto);
    return this.walletRepo.save(wallet);
  }

  async remove(id: number, user: User) {
    const wallet = await this.findOne(id, user);
    await this.walletRepo.remove(wallet);
    return { deleted: true };
  }
}
