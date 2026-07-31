// Prices are in Russian rubles. Intl gives proper ru-RU formatting:
// "1 234,56 \u20BD" (space thousands separator, comma decimals, \u20BD suffix).
const rubFmt = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' });
export const money = (n) => rubFmt.format(Number(n) || 0);

const PH_BG = ['#E9E7F8', '#F3E7E3', '#EAF3EA', '#F6EEDB'];
export const placeholderBg = (p) =>
  PH_BG[(String(p.name).length + String(p.id).length) % PH_BG.length];
