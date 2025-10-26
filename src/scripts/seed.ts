import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { config as dotenvConfig } from 'dotenv';
import { getTypeOrmConfig } from '../config/ormconfig';
import { ConfigService } from '@nestjs/config';
import { seedInitialData } from '../database/seeders/seed-initial-data';

dotenvConfig(); // Load .env

const configService = new ConfigService();
const typeOrmConfig = getTypeOrmConfig(configService);

// 🧩 Buat salinan non-readonly dan buang properti yang tidak dikenal oleh DataSource
const dataSourceOptions: DataSourceOptions = {
  ...(typeOrmConfig as unknown as Record<string, any>),
  type: 'postgres', // pastikan ada type
  synchronize: false,
};

// Hapus properti-properti yang tidak ada di DataSourceOptions
delete (dataSourceOptions as any).autoLoadEntities;
delete (dataSourceOptions as any).retryAttempts;
delete (dataSourceOptions as any).retryDelay;
delete (dataSourceOptions as any).toRetry;
delete (dataSourceOptions as any).verboseRetryLog;
delete (dataSourceOptions as any).manualInitialization;

const dataSource = new DataSource(dataSourceOptions);

async function run() {
  await dataSource.initialize();
  await seedInitialData(dataSource);
  await dataSource.destroy();
  console.log('🌱 Seeding complete.');
}

run().catch(console.error);
