import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

export class CreateTransactionDto {
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  adminFee?: number;

  @IsNumber()
  @IsNotEmpty()
  transactionTypeId: number;

  @IsNumber()
  @IsNotEmpty()
  transactionCategoryId: number;

  @IsNumber()
  @IsNotEmpty()
  walletId: number;

  @IsOptional()
  @IsNumber()
  targetWalletId?: number;

  @IsOptional()
  @IsDateString()
  createdAt?: string;
}
