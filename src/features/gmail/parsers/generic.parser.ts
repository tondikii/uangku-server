import { Injectable } from '@nestjs/common';
import {
  BaseBankParser,
  ParserInput,
  ParsedTransaction,
} from './base-bank.parser';

/**
 * Parser fallback untuk bank/ewallet yang tidak ada parser spesifiknya.
 * Tidak pernah cocok via canParse() — harus dipanggil manual
 * via tryParseFallback() sebagai last resort.
 */
@Injectable()
export class GenericBankParser extends BaseBankParser {
  readonly sourceName = 'Other';
  readonly senderPatterns = [];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  canParse(_from: string): boolean {
    return false;
  }

  parse(input: ParserInput): ParsedTransaction | null {
    return this.tryParseFallback(input);
  }

  tryParseFallback(input: ParserInput): ParsedTransaction | null {
    // Hanya proses kalau subject email mengandung kata kunci transaksi
    // Ini filter supaya tidak salah parse email non-transaksi
    const isTransactionEmail =
      /\b(transaksi|pembayaran|transfer|debit|kredit|mutasi|notifikasi|receipt|payment)\b/i.test(
        input.subject,
      );
    if (!isTransactionEmail) return null;

    const text = `${input.subject} ${input.body} ${input.snippet}`;
    const amount = this.extractAmount(text);
    if (!amount) return null;

    const transactionType = this.isIncome(text)
      ? 'income'
      : this.isTransfer(text)
        ? 'transfer'
        : 'expense';

    // confidence 'low' karena kita tidak yakin 100% hasilnya benar
    return this.buildResult(input, amount, transactionType, {
      confidence: 'low',
    });
  }
}
