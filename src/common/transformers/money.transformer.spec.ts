import { moneyTransformer } from './money.transformer';

describe('moneyTransformer', () => {
  describe('to()', () => {
    it('should return number as is', () => {
      expect(moneyTransformer.to(123.45)).toBe(123.45);
    });

    it('should return string as is', () => {
      expect(moneyTransformer.to('999.99')).toBe('999.99');
    });
  });

  describe('from()', () => {
    it('should convert string to number', () => {
      expect(moneyTransformer.from('123.45')).toBe(123.45);
    });

    it('should return 0 if null', () => {
      expect(moneyTransformer.from(null)).toBe(0);
    });

    it('should return 0 if empty string', () => {
      expect(moneyTransformer.from('')).toBe(0);
    });
  });
});
