import { Injectable } from '@nestjs/common';
import {
  BaseBankParser,
  ParserInput,
  ParsedTransaction,
} from './base-bank.parser';

@Injectable()
export class BriParser extends BaseBankParser {
  readonly sourceName = 'BRI';
  readonly senderPatterns = [
    /noreply@bri\.co\.id/,
    /info@bri\.co\.id/,
    /notifikasi@bri\.co\.id/,
    /bri@infobri\.com/,
  ];

  parse(input: ParserInput): ParsedTransaction | null {
    const text = `${input.subject} ${input.body} ${input.snippet}`;
    const amount = this.extractAmount(text);
    if (!amount) return null;

    const transactionType = /masuk|kredit|\bCR\b/i.test(text)
      ? 'income'
      : this.isTransfer(text)
        ? 'transfer'
        : 'expense';

    const merchant = this.extractMerchant(text, [
      /(?:kepada|tujuan|beneficiary)\s*:\s*(.+?)[\n\r]/i,
      /transfer\s+ke\s+(.+?)(?:\s+Rp|\n|$)/i,
    ]);

    return this.buildResult(input, amount, transactionType, { merchant });
  }
}
