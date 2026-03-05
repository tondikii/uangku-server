import { Injectable } from '@nestjs/common';
import {
  BaseBankParser,
  ParserInput,
  ParsedTransaction,
} from './base-bank.parser';

@Injectable()
export class SeabankParser extends BaseBankParser {
  readonly sourceName = 'SeaBank';
  readonly senderPatterns = [
    /noreply@seabank\.co\.id/,
    /info@seabank\.co\.id/,
    /notification@seabank\.co\.id/,
    /noreply@seamoney\.com/,
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
      /transfer\s+ke\s+(.+?)(?:\s+Rp|\n|$)/i,
    ]);

    return this.buildResult(input, amount, transactionType, { merchant });
  }
}
