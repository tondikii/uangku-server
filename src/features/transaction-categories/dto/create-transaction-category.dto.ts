import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateTransactionCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  transactionTypeId: number;
}
