import { Injectable } from '@nestjs/common';
import {
  BaseBankParser,
  ParserInput,
  ParsedTransaction,
} from './base-bank.parser';

@Injectable()
export class DanaParser extends BaseBankParser {
  readonly sourceName = 'DANA';
  readonly senderPatterns = [
    /noreply@dana\.id/,
    /no-reply@dana\.id/,
    /notification@dana\.id/,
    /help@dana\.id/,
  ];

  parse(input: ParserInput): ParsedTransaction | null {
    const text = `${input.subject} ${input.body} ${input.snippet}`;
    const amount = this.extractAmount(text);
    if (!amount) return null;

    const transactionType = this.isIncome(text)
      ? 'income'
      : this.isTransfer(text)
        ? 'transfer'
        : 'expense';

    const merchant = this.extractMerchant(text, [
      /kepada\s+(.+?)(?:\s+Rp|\s+senilai|\n|$)/i,
      /pembayaran\s+ke\s+(.+?)(?:\s+Rp|\n|$)/i,
      /bayar\s+ke\s+(.+?)(?:\s+Rp|\n|$)/i,
    ]);

    return this.buildResult(input, amount, transactionType, { merchant });
  }
}
