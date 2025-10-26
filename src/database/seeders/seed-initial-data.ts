import { DataSource } from 'typeorm';
import { TransactionType } from '../entities/transaction-type.entity';

export async function seedInitialData(dataSource: DataSource) {
  const transactionTypeRepo = dataSource.getRepository(TransactionType);

  const defaultTypes = ['Income', 'Expense', 'Transfer'];
  for (const name of defaultTypes) {
    const exists = await transactionTypeRepo.findOne({ where: { name } });
    if (!exists) {
      await transactionTypeRepo.save(transactionTypeRepo.create({ name }));
    }
  }

  console.log('✅ Seeded TransactionType');
}
