import { Injectable } from '@nestjs/common';
import {
  BaseBankParser,
  ParserInput,
  ParsedTransaction,
} from './base-bank.parser';

@Injectable()
export class MandiriParser extends BaseBankParser {
  readonly sourceName = 'Mandiri';
  readonly senderPatterns = [
    /notif@bankmandiri\.co\.id/,
    /info@mandiri\.co\.id/,
    /livin@bankmandiri\.co\.id/,
    /noreply@bankmandiri\.co\.id/,
  ];

  parse(input: ParserInput): ParsedTransaction | null {
    const text = `${input.subject} ${input.body} ${input.snippet}`;
    const amount = this.extractAmount(text);
    if (!amount) return null;

    const transactionType = /\bKR\b|kredit|\bcr\b|masuk/i.test(text)
      ? 'income'
      : this.isTransfer(text)
        ? 'transfer'
        : 'expense';

    const merchant = this.extractMerchant(text, [
      /(?:kepada|beneficiary|tujuan)\s*:\s*(.+?)[\n\r]/i,
      /transfer\s+ke\s+(.+?)(?:\s+Rp|\n|$)/i,
    ]);

    return this.buildResult(input, amount, transactionType, { merchant });
  }
}
