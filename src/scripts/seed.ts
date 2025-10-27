import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { config as dotenvConfig } from 'dotenv';
import { getTypeOrmConfig } from '../config/ormconfig';
import { ConfigService } from '@nestjs/config';
import { seedInitialData } from '../database/seeders/seed-initial-data';

dotenvConfig();

const configService = new ConfigService();
const typeOrmConfig = getTypeOrmConfig(configService);

const dataSourceOptions: DataSourceOptions = {
  ...(typeOrmConfig as unknown as Record<string, any>),
  type: 'postgres',
  synchronize: false,
};

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
