import { ValueTransformer } from 'typeorm';

export const moneyTransformer: ValueTransformer = {
  to: (value: number | string) => value, // disimpan ke DB apa adanya
  from: (value: string | null) => (value ? Number(value) : 0), // dikonversi ke number waktu dibaca
};
