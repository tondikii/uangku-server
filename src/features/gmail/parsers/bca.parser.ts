import { Injectable } from '@nestjs/common';
import {
  BaseBankParser,
  ParserInput,
  ParsedTransaction,
} from './base-bank.parser';

@Injectable()
export class BcaParser extends BaseBankParser {
  readonly sourceName = 'BCA';
  readonly senderPatterns = [
    /notifikasi@klikbca\.com/,
    /info@klikbca\.com/,
    /noreply@mybca\.com/,
    /notif@bca\.co\.id/,
  ];

  parse(input: ParserInput): ParsedTransaction | null {
    const text = `${input.subject} ${input.body} ${input.snippet}`;
    const amount = this.extractAmount(text);
    if (!amount) return null;

    // BCA pakai notasi DB (Debit/keluar) dan CR (Credit/masuk)
    const isCr = /\bCR\b|kredit|credited/i.test(text);
    const transactionType = isCr
      ? 'income'
      : this.isTransfer(text)
        ? 'transfer'
        : 'expense';

    const merchant = this.extractMerchant(text, [
      /(?:toko|merchant|kepada|tujuan)\s*:\s*(.+?)[\n\r]/i,
      /transfer\s+(?:ke|to)\s+(.+?)(?:\s+Rp|\n|$)/i,
    ]);

    return this.buildResult(input, amount, transactionType, { merchant });
  }
}
