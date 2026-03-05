import { Injectable } from '@nestjs/common';
import {
  BaseBankParser,
  ParserInput,
  ParsedTransaction,
} from './base-bank.parser';

@Injectable()
export class OvoParser extends BaseBankParser {
  readonly sourceName = 'OVO';
  readonly senderPatterns = [
    /no-reply@ovo\.id/,
    /noreply@ovo\.id/,
    /notification@ovo\.id/,
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
      /transaksi\s+(?:ke|di|to)\s+(.+?)(?:\s+senilai|\s+Rp|\.|$)/i,
      /pembayaran\s+ke\s+(.+?)(?:\s+Rp|\n|$)/i,
      /kepada\s*:\s*(.+?)[\n\r]/i,
    ]);

    return this.buildResult(input, amount, transactionType, { merchant });
  }
}
