import { Injectable } from '@nestjs/common';
import {
  BaseBankParser,
  ParserInput,
  ParsedTransaction,
} from './base-bank.parser';

@Injectable()
export class GopayParser extends BaseBankParser {
  readonly sourceName = 'GoPay';
  readonly senderPatterns = [
    /noreply@gopay\.co\.id/,
    /no-reply@gojek\.com/,
    /notification@gojek\.com/,
    /noreply@gojek\.com/,
  ];

  parse(input: ParserInput): ParsedTransaction | null {
    const text = `${input.subject} ${input.body} ${input.snippet}`;
    const amount = this.extractAmount(text);
    if (!amount) return null;

    const isTopUp = /top.?up|isi saldo/i.test(text);
    const isRefund = /refund|kembali|cashback/i.test(text);
    const transactionType = isTopUp || isRefund ? 'income' : 'expense';

    const merchant = this.extractMerchant(text, [
      /pembayaran\s+(?:ke|di|to)\s+(.+?)(?:\s+senilai|\s+sebesar|\s+Rp|\.|$)/i,
      /di\s+(.+?)(?:\s+senilai|\s+sebesar|\s+berhasil|\s+Rp|\.|$)/i,
      /kepada\s*:\s*(.+?)[\n\r]/i,
    ]);

    return this.buildResult(input, amount, transactionType, { merchant });
  }
}
