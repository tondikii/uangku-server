const TRANSACTION_CATEGORIES = [
  // --- INCOME (ID: 1) ---
  { name: 'Salary', transactionType: { id: 1 }, iconName: 'money-bill-wave' },
  { name: 'Investments', transactionType: { id: 1 }, iconName: 'chart-line' },
  { name: 'Part-Time', transactionType: { id: 1 }, iconName: 'business-time' },
  { name: 'Bonus', transactionType: { id: 1 }, iconName: 'gift' },
  { name: 'Interest', transactionType: { id: 1 }, iconName: 'percent' },
  { name: 'Selling', transactionType: { id: 1 }, iconName: 'tags' },
  {
    name: 'Refunds',
    transactionType: { id: 1 },
    iconName: 'hand-holding-dollar',
  },
  {
    name: 'Balance Correction',
    transactionType: { id: 1 },
    iconName: 'scale-balanced',
  },

  // --- EXPENSE (ID: 2) ---
  { name: 'Food', transactionType: { id: 2 }, iconName: 'utensils' },
  { name: 'Snacks', transactionType: { id: 2 }, iconName: 'cookie' },
  { name: 'Vegetables', transactionType: { id: 2 }, iconName: 'leaf' },
  { name: 'Fruits', transactionType: { id: 2 }, iconName: 'apple-whole' },
  { name: 'Shopping', transactionType: { id: 2 }, iconName: 'cart-shopping' },
  { name: 'Clothing', transactionType: { id: 2 }, iconName: 'shirt' },
  { name: 'Game', transactionType: { id: 2 }, iconName: 'gamepad' },
  {
    name: 'Entertainment',
    transactionType: { id: 2 },
    iconName: 'clapperboard',
  },
  { name: 'Education', transactionType: { id: 2 }, iconName: 'book-open' },
  { name: 'Beauty', transactionType: { id: 2 }, iconName: 'sparkles' },
  { name: 'Sports', transactionType: { id: 2 }, iconName: 'dumbbell' },
  { name: 'Social', transactionType: { id: 2 }, iconName: 'users' },
  { name: 'Transportation', transactionType: { id: 2 }, iconName: 'bus' },
  { name: 'Car', transactionType: { id: 2 }, iconName: 'car' },
  { name: 'Phone', transactionType: { id: 2 }, iconName: 'mobile-screen' },
  { name: 'Electronics', transactionType: { id: 2 }, iconName: 'laptop' },
  { name: 'Alcohol', transactionType: { id: 2 }, iconName: 'wine-glass' },
  { name: 'Cigarettes', transactionType: { id: 2 }, iconName: 'smoking' },
  { name: 'Travel', transactionType: { id: 2 }, iconName: 'plane' },
  { name: 'Health', transactionType: { id: 2 }, iconName: 'heart-pulse' },
  { name: 'Pets', transactionType: { id: 2 }, iconName: 'paw' },
  {
    name: 'Repairs',
    transactionType: { id: 2 },
    iconName: 'screwdriver-wrench',
  },
  { name: 'Housing', transactionType: { id: 2 }, iconName: 'house-chimney' },
  { name: 'Home', transactionType: { id: 2 }, iconName: 'couch' },
  { name: 'Gifts', transactionType: { id: 2 }, iconName: 'box-open' },
  {
    name: 'Donations',
    transactionType: { id: 2 },
    iconName: 'hand-holding-heart',
  },
  { name: 'Lottery', transactionType: { id: 2 }, iconName: 'ticket' },
  { name: 'Kids', transactionType: { id: 2 }, iconName: 'baby' },
  { name: 'Insurance', transactionType: { id: 2 }, iconName: 'shield-halved' },
  { name: 'Tax', transactionType: { id: 2 }, iconName: 'file-invoice-dollar' },
  {
    name: 'Balance Correction',
    transactionType: { id: 2 },
    iconName: 'scale-unbalanced',
  },

  // --- TRANSFER / TOP UP (ID: 3) ---
  // Mengganti icon 'plus' menjadi icon wallet/bank yang lebih cocok untuk Top Up
  { name: 'Top Up', transactionType: { id: 3 }, iconName: 'wallet' },
  {
    name: 'Bank Transfer',
    transactionType: { id: 3 },
    iconName: 'building-columns',
  },
  { name: 'E-Wallet', transactionType: { id: 3 }, iconName: 'mobile-retro' },
];

export default TRANSACTION_CATEGORIES;
