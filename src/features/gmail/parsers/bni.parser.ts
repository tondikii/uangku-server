import { Injectable } from '@nestjs/common';
import {
  BaseBankParser,
  ParserInput,
  ParsedTransaction,
} from './base-bank.parser';

@Injectable()
export class BniParser extends BaseBankParser {
  readonly sourceName = 'BNI';
  readonly senderPatterns = [
    /bni@bni\.co\.id/,
    /noreply@bni\.co\.id/,
    /notifikasi@bni\.co\.id/,
    /info@bni\.co\.id/,
  ];

  parse(input: ParserInput): ParsedTransaction | null {
    const text = `${input.subject} ${input.body} ${input.snippet}`;
    const amount = this.extractAmount(text);
    if (!amount) return null;

    const transactionType = /kredit|\bCR\b|masuk/i.test(text)
      ? 'income'
      : this.isTransfer(text)
        ? 'transfer'
        : 'expense';

    const merchant = this.extractMerchant(text, [
      /(?:kepada|beneficiary|tujuan transfer)\s*:\s*(.+?)[\n\r]/i,
      /transfer\s+ke\s+(.+?)(?:\s+Rp|\n|$)/i,
    ]);

    return this.buildResult(input, amount, transactionType, { merchant });
  }
}
