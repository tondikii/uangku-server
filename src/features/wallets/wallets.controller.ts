import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WalletsService } from './wallets.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { successResponse } from '../../common/utils/response.util';

@UseGuards(AuthGuard('jwt')) // 🔒 semua route di controller ini wajib login
@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get()
  async findAll(@Req() req) {
    const user = req.user; // diisi otomatis oleh JwtStrategy
    const result = await this.walletsService.findAll(user);
    return successResponse(
      result,
      'Wallets fetched successfully',
      HttpStatus.OK,
    );
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const user = req.user;
    const result = await this.walletsService.findOne(id, user);
    return successResponse(
      result,
      'Wallet fetched successfully',
      HttpStatus.OK,
    );
  }

  @Post()
  async create(@Body() dto: CreateWalletDto, @Req() req) {
    const user = req.user;
    const result = await this.walletsService.create(user, dto);
    return successResponse(
      result,
      'Wallet created successfully',
      HttpStatus.CREATED,
    );
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWalletDto,
    @Req() req,
  ) {
    const user = req.user;
    const result = await this.walletsService.update(id, user, dto);
    return successResponse(
      result,
      'Wallet updated successfully',
      HttpStatus.OK,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const user = req.user;
    await this.walletsService.remove(id, user);
    return successResponse(
      null,
      'Wallet deleted successfully',
      HttpStatus.NO_CONTENT,
    );
  }
}
