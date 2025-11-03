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
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WalletsService } from './wallets.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { successResponse } from '../../common/utils/response.util';

@UseGuards(AuthGuard('jwt'))
@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get()
  async findAll(@Req() req) {
    const result = await this.walletsService.findAll(req.user);
    return successResponse(
      result,
      'Wallets fetched successfully',
      HttpStatus.OK,
    );
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const result = await this.walletsService.findOne(id);
    return successResponse(
      result,
      'Wallet fetched successfully',
      HttpStatus.OK,
    );
  }

  @Post()
  async create(@Body() dto: CreateWalletDto, @Req() req) {
    const result = await this.walletsService.create(req.user, dto);
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
    const result = await this.walletsService.update(req.user, id, dto);
    return successResponse(
      result,
      'Wallet updated successfully',
      HttpStatus.OK,
    );
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.walletsService.remove(id);
    return successResponse(
      null,
      'Wallet deleted successfully',
      HttpStatus.NO_CONTENT,
    );
  }
}
