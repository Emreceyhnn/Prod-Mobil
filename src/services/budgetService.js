import AsyncStorage from "@react-native-async-storage/async-storage";

const BUDGET_KEY_PREFIX = "@vela/budget_";

/**
 * Kategori -> aylık limit (₺) eşlemesini kullanıcı başına saklar.
 * Şema: { "Market & Restoran": 3000, "Ulaşım & Yakıt": 1000, ... }
 */
export async function getBudgets(userId) {
  if (!userId) return {};
  const raw = await AsyncStorage.getItem(BUDGET_KEY_PREFIX + userId);
  return raw ? JSON.parse(raw) : {};
}

export async function setBudget(userId, category, monthlyLimit) {
  const budgets = await getBudgets(userId);
  const next = { ...budgets, [category]: monthlyLimit };
  await AsyncStorage.setItem(BUDGET_KEY_PREFIX + userId, JSON.stringify(next));
  return next;
}

export async function removeBudget(userId, category) {
  const budgets = await getBudgets(userId);
  const next = { ...budgets };
  delete next[category];
  await AsyncStorage.setItem(BUDGET_KEY_PREFIX + userId, JSON.stringify(next));
  return next;
}

/**
 * Verilen harcama listesini (bu ayki) kategori bazlı toplamlarla
 * bütçe limitleriyle karşılaştırıp durum raporu üretir.
 */
export function evaluateBudgets(budgets, categoryTotals) {
  return Object.entries(budgets)
    .map(([category, limit]) => {
      const spent = categoryTotals[category] || 0;
      const ratio = limit > 0 ? spent / limit : 0;
      return {
        category,
        limit,
        spent,
        remaining: Math.max(limit - spent, 0),
        ratio,
        isOverBudget: spent > limit,
        isNearLimit: ratio >= 0.8 && spent <= limit,
      };
    })
    .sort((a, b) => b.ratio - a.ratio);
}
