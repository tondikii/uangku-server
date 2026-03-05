/**
 * Mengekstrak nominal rupiah dari teks email.
 *
 * Problem utama: Format angka Indonesia KEBALIKAN dari internasional:
 *   Indonesia:     1.500.000,50  ← titik = ribuan, koma = desimal
 *   Internasional: 1,500,000.50  ← koma = ribuan, titik = desimal
 *
 * Kita harus handle keduanya karena beberapa bank pakai format campuran.
 */
export function extractAmount(text: string): number | null {
  const patterns = [
    // Pola paling umum: "Rp1.500.000" atau "Rp 1.500.000,00" atau "IDR 1500000"
    /(?:Rp\.?|IDR)\s*([\d.,]+)/gi,
    // Pola kontekstual: "sebesar Rp...", "senilai Rp...", "jumlah Rp..."
    /(?:sebesar|senilai|jumlah|nominal|total)\s*:?\s*(?:Rp\.?|IDR)?\s*([\d.,]+)/gi,
    // Pola label: "Total: 1.500.000" atau "Amount: 1500000"
    /(?:total|amount|nilai transaksi)\s*[:\s]+(?:Rp\.?|IDR)?\s*([\d.,]+)/gi,
  ];

  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const raw = match[1].trim();
      const amount = normalizeIndonesianNumber(raw);
      // Sanity check: minimal Rp100, maksimal Rp1 miliar
      // Ini untuk filter false positive seperti nomor versi "1.0.2"
      if (amount !== null && amount >= 100 && amount <= 1_000_000_000) {
        return amount;
      }
    }
  }

  return null;
}

export function normalizeIndonesianNumber(raw: string): number | null {
  const dotCount = (raw.match(/\./g) || []).length;
  const commaCount = (raw.match(/,/g) || []).length;

  let normalized: string;

  if (dotCount > 1) {
    // "1.500.000" atau "1.500.000,50" → pasti format Indonesia
    // Hapus semua titik (pemisah ribuan), ganti koma jadi titik (desimal)
    normalized = raw.replace(/\./g, '').replace(',', '.');
  } else if (commaCount > 1) {
    // "1,500,000" → pasti format internasional
    // Hapus semua koma (pemisah ribuan)
    normalized = raw.replace(/,/g, '');
  } else if (dotCount === 1 && commaCount === 1) {
    const dotPos = raw.indexOf('.');
    const commaPos = raw.indexOf(',');
    if (dotPos < commaPos) {
      // "1.500,00" → Indonesia (titik dulu, koma belakang)
      normalized = raw.replace('.', '').replace(',', '.');
    } else {
      // "1,500.00" → Internasional (koma dulu, titik belakang)
      normalized = raw.replace(',', '');
    }
  } else if (dotCount === 1) {
    const afterDot = raw.split('.')[1];
    // Kalau setelah titik ada tepat 3 digit → titik = pemisah ribuan
    // "1.500" → 1500, bukan 1.5
    if (afterDot && afterDot.length === 3) {
      normalized = raw.replace('.', '');
    } else {
      // "1500.50" → titik = desimal
      normalized = raw;
    }
  } else if (commaCount === 1) {
    // "1500,50" → koma = desimal Indonesia
    normalized = raw.replace(',', '.');
  } else {
    // "1500000" → angka polos
    normalized = raw;
  }

  const amount = parseFloat(normalized);
  return isNaN(amount) ? null : Math.round(amount);
}
