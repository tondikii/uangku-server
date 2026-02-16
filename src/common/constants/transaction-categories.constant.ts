const TRANSACTION_CATEGORIES = [
  // --- LEAST FREQUENT / CORRECTIONS ---
  {
    name: 'Balance Correction',
    transactionType: { id: 1 },
    iconName: 'scale-balanced',
  },
  {
    name: 'Balance Correction',
    transactionType: { id: 2 },
    iconName: 'scale-unbalanced',
  },
  { name: 'Tax', transactionType: { id: 2 }, iconName: 'file-invoice-dollar' },
  { name: 'Insurance', transactionType: { id: 2 }, iconName: 'shield-halved' },
  { name: 'Lottery', transactionType: { id: 2 }, iconName: 'ticket' },

  // --- INFREQUENT EXPENSES ---
  {
    name: 'Repairs',
    transactionType: { id: 2 },
    iconName: 'screwdriver-wrench',
  },
  { name: 'Home', transactionType: { id: 2 }, iconName: 'couch' },
  { name: 'Housing', transactionType: { id: 2 }, iconName: 'house-chimney' },
  { name: 'Pets', transactionType: { id: 2 }, iconName: 'paw' },
  { name: 'Kids', transactionType: { id: 2 }, iconName: 'baby' },
  {
    name: 'Donations',
    transactionType: { id: 2 },
    iconName: 'hand-holding-heart',
  },
  { name: 'Gifts', transactionType: { id: 2 }, iconName: 'box-open' },

  // --- LIFESTYLE & HOBBIES ---
  { name: 'Alcohol', transactionType: { id: 2 }, iconName: 'wine-glass' },
  { name: 'Cigarettes', transactionType: { id: 2 }, iconName: 'smoking' },
  { name: 'Game', transactionType: { id: 2 }, iconName: 'gamepad' },
  { name: 'Sports', transactionType: { id: 2 }, iconName: 'dumbbell' },
  { name: 'Travel', transactionType: { id: 2 }, iconName: 'plane' },
  {
    name: 'Entertainment',
    transactionType: { id: 2 },
    iconName: 'clapperboard',
  },
  {
    name: 'Beauty',
    transactionType: { id: 2 },
    iconName: 'spray-can-sparkles',
  },
  { name: 'Education', transactionType: { id: 2 }, iconName: 'book-open' },

  // --- INCOME (MID-FREQUENCY) ---
  { name: 'Selling', transactionType: { id: 1 }, iconName: 'tags' },
  {
    name: 'Refunds',
    transactionType: { id: 1 },
    iconName: 'hand-holding-dollar',
  },
  { name: 'Interest', transactionType: { id: 1 }, iconName: 'percent' },
  { name: 'Bonus', transactionType: { id: 1 }, iconName: 'gift' },
  { name: 'Part-Time', transactionType: { id: 1 }, iconName: 'business-time' },
  { name: 'Investments', transactionType: { id: 1 }, iconName: 'chart-line' },

  // --- TRANSFERS ---

  {
    name: 'Top Up',
    transactionType: { id: 3 },
    iconName: 'sack-dollar',
  },
  {
    name: 'Bank Transfer',
    transactionType: { id: 3 },
    iconName: 'building-columns',
  },
  {
    name: 'E-Wallet',
    transactionType: { id: 3 },
    iconName: 'mobile-screen-button',
  },

  // --- HIGH FREQUENCY (Akan muncul paling atas di UI) ---
  { name: 'Electronics', transactionType: { id: 2 }, iconName: 'laptop' },
  { name: 'Health', transactionType: { id: 2 }, iconName: 'heart-pulse' },
  { name: 'Car', transactionType: { id: 2 }, iconName: 'car' },
  { name: 'Transportation', transactionType: { id: 2 }, iconName: 'bus' },
  { name: 'Social', transactionType: { id: 2 }, iconName: 'users' },
  { name: 'Phone', transactionType: { id: 2 }, iconName: 'mobile-screen' },
  { name: 'Clothing', transactionType: { id: 2 }, iconName: 'shirt' },
  { name: 'Fruits', transactionType: { id: 2 }, iconName: 'apple-whole' },
  { name: 'Vegetables', transactionType: { id: 2 }, iconName: 'leaf' },
  { name: 'Snacks', transactionType: { id: 2 }, iconName: 'cookie' },
  { name: 'Shopping', transactionType: { id: 2 }, iconName: 'cart-shopping' },
  { name: 'Food', transactionType: { id: 2 }, iconName: 'utensils' },
  { name: 'Salary', transactionType: { id: 1 }, iconName: 'money-bill-wave' },
];

export default TRANSACTION_CATEGORIES;
