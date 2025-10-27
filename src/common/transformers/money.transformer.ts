import { ValueTransformer } from 'typeorm';

export const moneyTransformer: ValueTransformer = {
  to: (value: number | string) => value, // saved to DB as is
  from: (value: string | null) => (value ? Number(value) : 0), // converted to number
};
